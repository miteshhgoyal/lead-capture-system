import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { Partner } from "@/lib/models/Partner";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { LeadFormSchema, normalizePhone } from "@/lib/validation/lead";
import { hit, clientIp } from "@/lib/rate-limit";
import { triggerLeadAutomations } from "@/lib/automations";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);

    // 1. Rate limiting: 10 lead submissions per 60s per IP
    const rl = await hit(`lead_${ip}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const json = await req.json();

    // 2. Honeypot check: bots fill hidden inputs
    if (json.hp_company && String(json.hp_company).trim().length > 0) {
      // Fake success for bots
      return NextResponse.json({ ok: true, success: true });
    }

    // 3. Shared Zod Validation
    const parsed = LeadFormSchema.safeParse(json);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue ? issue.message : "Invalid form submission" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await dbConnect();

    // 4. Server-Side Partner Resolution (Never trust client body alone)
    let partnerId = null;
    let partnerSlug = "direct";
    let partnerName = "Direct";
    let source: "partner-page" | "direct" = "direct";
    let telegramLink = "https://t.me/onestockacademy";

    const requestedSlug = (json.partnerSlug || "").trim().toLowerCase();
    if (requestedSlug && requestedSlug !== "direct") {
      const partner = await Partner.findOne({ slug: requestedSlug, isActive: true }).lean();
      if (partner) {
        partnerId = partner._id;
        partnerSlug = partner.slug;
        partnerName = partner.name;
        source = "partner-page";
        if (partner.telegramLink) telegramLink = partner.telegramLink;
      }
    }

    if (source === "direct") {
      const settings = await SiteSettings.findOne({ key: "main" }).lean();
      if (settings?.defaultTelegramLink) {
        telegramLink = settings.defaultTelegramLink;
      }
    }

    // 5. Phone Normalization (E.164)
    const normalizedPhone = normalizePhone(data.phone, data.countryCode);
    const normalizedEmail = data.email.toLowerCase().trim();

    // 6. Technical Metadata (Device detection from User-Agent)
    const userAgent = req.headers.get("user-agent") || "";
    let device: "desktop" | "mobile" | "tablet" = "desktop";
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      device = "tablet";
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(userAgent)) {
      device = "mobile";
    }

    // 7. Duplicate Detection (Same phone OR email for the same partner)
    const existing = await Lead.findOne({
      partnerSlug,
      $or: [{ phone: normalizedPhone }, { email: normalizedEmail }],
    });

    let leadDoc;

    if (existing) {
      // Update existing record, mark as duplicate, bump duplicateCount
      existing.name = data.name;
      existing.age = data.age;
      existing.profession = data.profession;
      existing.capital = data.capital;
      existing.country = data.country;
      existing.isDuplicate = true;
      existing.duplicateCount = (existing.duplicateCount || 0) + 1;
      if (data.utm_source) existing.utm_source = data.utm_source;
      if (data.utm_medium) existing.utm_medium = data.utm_medium;
      if (data.utm_campaign) existing.utm_campaign = data.utm_campaign;
      if (data.referrer) existing.referrer = data.referrer;
      if (data.landingUrl) existing.landingUrl = data.landingUrl;
      existing.ip = ip;
      existing.userAgent = userAgent;
      existing.device = device;

      leadDoc = await existing.save();
    } else {
      // Create new lead
      leadDoc = await Lead.create({
        name: data.name,
        phone: normalizedPhone,
        countryCode: data.countryCode,
        email: normalizedEmail,
        age: data.age,
        profession: data.profession,
        capital: data.capital,
        country: data.country,
        partnerId,
        partnerSlug,
        partnerName,
        source,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_term: data.utm_term,
        utm_content: data.utm_content,
        referrer: data.referrer,
        landingUrl: data.landingUrl,
        ip,
        userAgent,
        device,
        status: "new",
        notes: "",
        isDuplicate: false,
        duplicateCount: 0,
      });
    }

    // 8. Fire automation stub (WhatsApp / Zoom notification)
    await triggerLeadAutomations(leadDoc.toObject());

    return NextResponse.json({
      ok: true,
      leadId: leadDoc._id.toString(),
      isDuplicate: leadDoc.isDuplicate,
      partnerSlug,
      partnerName,
      telegramLink,
    });
  } catch (error) {
    console.error("[api/leads] Error saving lead:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
