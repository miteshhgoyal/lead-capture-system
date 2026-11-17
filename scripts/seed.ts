import { dbConnect } from "../lib/db";
import { AdminUser } from "../lib/models/AdminUser";
import { Partner } from "../lib/models/Partner";
import { Lead } from "../lib/models/Lead";
import { SiteSettings } from "../lib/models/SiteSettings";
import { hashPassword } from "../lib/admin-auth";
import { DEFAULT_SETTINGS } from "../lib/defaults";

async function seed() {
  console.log("Starting seed script...");
  await dbConnect();

  // 1. Seed / Upsert Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@freecourselink.com").toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD || "AdminPass123!@#";

  const existingAdmin = await AdminUser.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await AdminUser.create({
      email: adminEmail,
      passwordHash: hashPassword(adminPass),
      name: "Super Admin",
      role: "superadmin",
    });
    console.log(`Admin user created: ${adminEmail} (password: ${adminPass})`);
  } else {
    existingAdmin.passwordHash = hashPassword(adminPass);
    await existingAdmin.save();
    console.log(`Admin user password updated: ${adminEmail}`);
  }

  // 2. Seed Default SiteSettings
  const existingSettings = await SiteSettings.findOne({ key: "main" });
  if (!existingSettings) {
    await SiteSettings.create({
      key: "main",
      ...DEFAULT_SETTINGS,
    });
    console.log("Default SiteSettings initialized.");
  } else {
    console.log("SiteSettings already exist.");
  }

  // 3. Seed Demo Partner "Aman Singh"
  let demoPartner = await Partner.findOne({ slug: "aman-singh" });
  if (!demoPartner) {
    demoPartner = await Partner.create({
      name: "Aman Singh",
      slug: "aman-singh",
      telegramLink: "https://t.me/amansinghtrading",
      whatsappGroupLink: "https://chat.whatsapp.com/demo-aman-singh",
      zoomLink: "https://zoom.us/j/9876543210",
      tagline: "Master Institutional Price Action & Liquidity With Aman Singh",
      mentorBio:
        "Certified Technical Analyst with 7+ years of experience trading index futures and currency derivatives. Mentored over 15,000 students on risk-reward asymmetry and candlestick mechanics.",
      theme: {
        primaryColor: "#059669",
      },
      isActive: true,
      createdBy: adminEmail,
    });
    console.log("Demo partner created: Aman Singh (/aman-singh)");
  } else {
    console.log("Demo partner Aman Singh already exists.");
  }

  // 4. Seed sample leads if collection is empty
  const leadsCount = await Lead.countDocuments({});
  if (leadsCount === 0) {
    console.log("Seeding sample leads...");
    const sampleLeads = [
      {
        name: "Vikram Malhotra",
        phone: "+919876543210",
        countryCode: "+91",
        email: "vikram.malhotra@gmail.com",
        age: 28,
        profession: "Salaried",
        capital: "₹1L–₹5L",
        country: "India",
        partnerId: demoPartner._id,
        partnerSlug: "aman-singh",
        partnerName: "Aman Singh",
        source: "partner-page",
        utm_source: "instagram",
        utm_medium: "bio_link",
        status: "joined",
        notes: "Attended session, interested in mentorship cohort",
        isDuplicate: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Pooja Sharma",
        phone: "+919812345678",
        countryCode: "+91",
        email: "pooja.sharma@yahoo.com",
        age: 32,
        profession: "Business",
        capital: "₹5L–₹10L",
        country: "India",
        partnerId: demoPartner._id,
        partnerSlug: "aman-singh",
        partnerName: "Aman Singh",
        source: "partner-page",
        utm_source: "youtube",
        utm_medium: "video_desc",
        status: "contacted",
        notes: "Called on WhatsApp, sent Zoom guide",
        isDuplicate: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Rohan Gupta",
        phone: "+919765432109",
        countryCode: "+91",
        email: "rohan.gupta@gmail.com",
        age: 22,
        profession: "Student",
        capital: "Up to ₹1,00,000",
        country: "India",
        partnerId: null,
        partnerSlug: "direct",
        partnerName: "Direct",
        source: "direct",
        utm_source: "google",
        utm_medium: "cpc",
        status: "new",
        notes: "",
        isDuplicate: false,
        createdAt: new Date(),
      },
      {
        name: "Ananya Patel",
        phone: "+919988776655",
        countryCode: "+91",
        email: "ananya.patel@gmail.com",
        age: 27,
        profession: "Self-employed",
        capital: "₹10L+",
        country: "India",
        partnerId: demoPartner._id,
        partnerSlug: "aman-singh",
        partnerName: "Aman Singh",
        source: "partner-page",
        utm_source: "telegram",
        status: "joined",
        notes: "High capital trader, very active",
        isDuplicate: false,
        createdAt: new Date(),
      },
    ];

    await Lead.insertMany(sampleLeads);
    console.log(`Seeded ${sampleLeads.length} sample leads.`);
  }

  console.log("\nSeeding complete!");
  console.log("-----------------------------------------");
  console.log(`Admin Portal: /admin/login`);
  console.log(`Email:        ${adminEmail}`);
  console.log(`Password:     ${adminPass}`);
  console.log(`Partner Page: /aman-singh`);
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
