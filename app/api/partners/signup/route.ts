import { revalidatePath } from "next/cache";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { hit, clientIp } from "@/lib/rate-limit";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { PartnerSignupSchema } from "@/lib/validation/partner-portal";
import { hashPassword } from "@/lib/admin-auth";
import { createPartnerSession } from "@/lib/partner-auth";
import { generatePartnerPage } from "@/lib/page-builder/generate";

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");

  const rl = await hit(`partner_signup_${clientIp(req)}`, 5, 3600); // 5 sign-ups / hour / IP
  if (!rl.ok) return fail(429, "Too many sign-ups from this network. Try again later.");

  const body = await readJson(req);
  const parsed = PartnerSignupSchema.safeParse(body);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid details");

  const { hp_company, password, loginId, primaryColor, whatsappGroupLink, logoUrl, ...rest } = parsed.data;
  if (hp_company && hp_company.trim()) return json({ ok: true, slug: rest.slug }); // bot: fake success

  await dbConnect();
  if (await Partner.exists({ slug: rest.slug })) return fail(409, `The link "${rest.slug}" is already taken. Pick another.`);
  if (await Partner.exists({ loginId })) return fail(409, "That login ID is already in use.");

  const passwordHash = hashPassword(password);
  try {
    const partner = await Partner.create({
      ...rest,
      whatsappGroupLink: whatsappGroupLink || undefined,
      logoUrl: logoUrl || undefined,
      theme: { primaryColor },
      isActive: true,
      loginId,
      passwordHash,
      createdBy: "self-signup",
      // Layout, copy, theme and section order are randomised once here, like admin-created partners.
      ...generatePartnerPage({}),
    });

    await createPartnerSession({ _id: partner._id, passwordHash });
    try {
      revalidatePath("/partners");
    } catch {
      /* ignore */
    }
    return json({ ok: true, slug: partner.slug });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return fail(409, "That link or login ID is already taken.");
    console.error("[partners/signup]", e);
    return fail(500, "Could not create your page. Please try again.");
  }
}
