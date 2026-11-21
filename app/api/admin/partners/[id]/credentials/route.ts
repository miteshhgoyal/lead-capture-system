import { isValidObjectId } from "mongoose";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { adminOr401, hashPassword } from "@/lib/admin-auth";
import { AdminCredentialsSchema } from "@/lib/validation/partner-portal";

/** Admin sets or resets a partner's portal login ID / password. Resetting the password signs the partner out everywhere. */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const admin = await adminOr401();
  if (admin instanceof Response) return admin;

  const { id } = await props.params;
  if (!isValidObjectId(id)) return fail(400, "Invalid ID");

  const parsed = AdminCredentialsSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid details");
  const { loginId, password } = parsed.data;

  await dbConnect();
  const partner = await Partner.findById(id).select("+passwordHash");
  if (!partner) return fail(404, "Partner not found");

  if (loginId !== partner.loginId && (await Partner.exists({ loginId, _id: { $ne: id } }))) {
    return fail(409, "That login ID is already in use.");
  }
  if (!password && !partner.passwordHash) return fail(400, "Set a password for the first login.");

  partner.loginId = loginId;
  if (password) partner.passwordHash = hashPassword(password);

  try {
    await partner.save();
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return fail(409, "That login ID is already in use.");
    throw e;
  }
  return json({ ok: true, loginId });
}
