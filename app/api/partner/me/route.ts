import { revalidatePath } from "next/cache";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { hashPassword, verifyPassword } from "@/lib/admin-auth";
import { createPartnerSession, partnerOr401 } from "@/lib/partner-auth";
import { PartnerSelfUpdateSchema } from "@/lib/validation/partner-portal";

/** A partner edits their own page details / colour / logo, or changes their password. */
export async function PATCH(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const session = await partnerOr401();
  if (session instanceof Response) return session;

  const parsed = PartnerSelfUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid details");
  const d = parsed.data;

  await dbConnect();
  const partner = await Partner.findById(session._id).select("+passwordHash");
  if (!partner || !partner.isActive) return fail(401, "unauthorized");

  if (d.name !== undefined) partner.name = d.name;
  if (d.telegramLink !== undefined) partner.telegramLink = d.telegramLink;
  if (d.whatsappGroupLink !== undefined) partner.whatsappGroupLink = d.whatsappGroupLink;
  if (d.tagline !== undefined) partner.tagline = d.tagline;
  if (d.mentorBio !== undefined) partner.mentorBio = d.mentorBio;
  if (d.logoUrl !== undefined) partner.logoUrl = d.logoUrl;
  if (d.primaryColor !== undefined) partner.theme = { primaryColor: d.primaryColor };

  let newHash: string | undefined;
  if (d.newPassword) {
    if (!d.currentPassword || !verifyPassword(d.currentPassword, partner.passwordHash ?? "")) {
      return fail(400, "Current password is incorrect.");
    }
    newHash = hashPassword(d.newPassword);
    partner.passwordHash = newHash;
  }

  await partner.save();
  // Password change invalidates every session (including this one): issue a fresh cookie.
  if (newHash) await createPartnerSession({ _id: partner._id, passwordHash: newHash });

  try {
    revalidatePath(`/${partner.slug}`);
    revalidatePath("/partners");
  } catch {
    /* ignore */
  }
  return json({ ok: true });
}
