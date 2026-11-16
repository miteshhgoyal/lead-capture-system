import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { dbConnect } from "./db";
import { AdminUser } from "./models/AdminUser";
import { fail } from "./http";

export const ADMIN_COOKIE = "fogm_admin";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, "hex");
    return timingSafeEqual(derivedKey, keyBuf);
  } catch {
    return false;
  }
}

function adminKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "default_development_secret_32_chars_minimum_len";
  return new TextEncoder().encode(secret.padEnd(32, "0"));
}

export async function createAdminSession(payload: { email: string; id?: string }): Promise<void> {
  const token = await new SignJWT({ sub: payload.id || "admin", email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(adminKey());

  const cookieJar = await cookies();
  cookieJar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieJar = await cookies();
  cookieJar.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin(): Promise<{ email: string; id?: string }> {
  const cookieJar = await cookies();
  const token = cookieJar.get(ADMIN_COOKIE)?.value;
  if (!token) throw Object.assign(new Error("unauthorized"), { status: 401 });

  try {
    const { payload } = await jwtVerify(token, adminKey(), { algorithms: ["HS256"] });
    return { email: (payload.email as string) || "admin@example.com", id: payload.sub };
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status) throw e;
    throw Object.assign(new Error("unauthorized"), { status: 401 });
  }
}

export async function adminOr401(): Promise<{ email: string; id?: string } | Response> {
  try {
    return await requireAdmin();
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return fail(err.status ?? 401, err.message ?? "unauthorized");
  }
}

export async function authenticateAdmin(emailInput: string, passwordInput: string): Promise<boolean> {
  const email = emailInput.trim().toLowerCase();
  const pass = passwordInput.trim();

  // 1. Check DB admin user
  try {
    await dbConnect();
    const adminUser = await AdminUser.findOne({ email }).lean();
    if (adminUser && adminUser.passwordHash) {
      const match = verifyPassword(pass, adminUser.passwordHash);
      if (match) {
        await AdminUser.updateOne({ _id: adminUser._id }, { $set: { lastLoginAt: new Date() } });
        return true;
      }
    }
  } catch (err) {
    console.error("[auth] DB check error:", err);
  }

  // 2. Fallback to ENV admin credentials
  const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || "").trim();
  if (envEmail && envPass && email === envEmail && pass === envPass) {
    return true;
  }

  return false;
}
