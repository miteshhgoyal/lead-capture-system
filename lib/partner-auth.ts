import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { dbConnect } from "./db";
import { Partner, type IPartner } from "./models/Partner";
import { fail } from "./http";

export const PARTNER_COOKIE = "fogm_partner";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const AUDIENCE = "partner-portal";

/** Separate key from the admin one, so a partner token can never be replayed as an admin token. */
function partnerKey(): Uint8Array {
  const secret =
    process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "default_development_secret_32_chars_minimum_len";
  return new TextEncoder().encode(`${secret}:partner`.padEnd(32, "0"));
}

/** First chars of the scrypt salt: changes whenever the password changes, which kills old sessions. */
const pwVersion = (hash?: string) => (hash ?? "").slice(0, 16);

export async function createPartnerSession(partner: { _id: unknown; passwordHash?: string }): Promise<void> {
  const token = await new SignJWT({ pv: pwVersion(partner.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(partner._id))
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(partnerKey());

  const jar = await cookies();
  jar.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearPartnerSession(): Promise<void> {
  const jar = await cookies();
  jar.set(PARTNER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

/**
 * The signed-in partner, or null. Re-checked against the database on every call, so an admin
 * inactivating a partner or resetting their password logs them out immediately.
 */
export async function getPartnerSession(): Promise<IPartner | null> {
  const token = (await cookies()).get(PARTNER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, partnerKey(), { algorithms: ["HS256"], audience: AUDIENCE });
    if (!payload.sub) return null;
    await dbConnect();
    const partner = await Partner.findById(payload.sub).select("+passwordHash").lean<IPartner | null>();
    if (!partner || !partner.isActive || !partner.passwordHash) return null;
    if (pwVersion(partner.passwordHash) !== payload.pv) return null;
    return partner;
  } catch {
    return null;
  }
}

export async function partnerOr401(): Promise<IPartner | Response> {
  return (await getPartnerSession()) ?? fail(401, "unauthorized");
}
