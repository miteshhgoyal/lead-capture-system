# Free Course Link — Multi-Partner Lead Capture System

A high-converting, multi-partner lead capture and attribution system for trading-education free webinars and live Zoom masterclasses. Built with **Next.js 16 (App Router + Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **MongoDB (Mongoose)**, and stateless **JWT session authentication**.

---

## 🌟 Key Architecture & Capabilities

1. **Multi-Partner, Zero-Redeploy Architecture**:
   - Partners are data in MongoDB, not code. When an administrator creates a partner in `/admin`, the partner landing page is **instantly live** at `domain.com/[slug]` without any code commit or redeployment.
   - On-demand path revalidation updates partner pages in real-time.
   - Reserved slugs (`admin`, `api`, `login`, `_next`, `sitemap`, etc.) are protected from collision.

2. **Dynamic Partner Branding & Color Themes**:
   - Custom hex color palettes (`primaryColor`, `secondaryColor`, `accentColor`) injected via CSS custom properties.
   - Automated text contrast calculation (`getReadableTextColor`) guarantees that CTA buttons and text remain 100% legible in **both Dark and Light modes**.
   - Custom partner logo, mentor bio, hero headline, and Telegram/WhatsApp community links.

3. **High-Converting Single Landing Page**:
   - **Hero Section**: Value proposition, trust badge ("100% Free · Join 60,000+ Enrolled Students"), smooth scroll CTA.
   - **Sticky Lead Form**: Desktop side-by-side sticky placement, accessible via CTA on mobile.
   - **Form Fields**: Full Name, WhatsApp Number with Country Flag/Code dropdown (+91 India default), Trading/Investment Capital, Email, Age (18–80), Profession, Country.
   - **Lead Protection & Duplicate Handling**: Shared client + server Zod validation, E.164 phone normalization, bot honeypot trap, per-IP rate limiting, and intelligent duplicate merging (same phone or email for the same partner updates the record and flags `isDuplicate` without noisy errors).
   - **Instant Thank-You State**: Confetti animation, WhatsApp confirmation message, direct "Join Partner Telegram" button, and optional 6-second auto-redirect.
   - **Visual Educational Pillars**: Interactive SVG charts (price action break-and-retest model, candlestick confirmation visuals, 1:3 asymmetric risk-reward gauge).
   - **How It Works (3 Steps)**: Register → Receive Zoom Link on WhatsApp → Attend Live.
   - **Social Proof Counters**: Animated `CountUp` statistics (60,000+ students, 4.9/5 rating, 92% positive feedback).
   - **FAQ Accordion & Risk Disclaimer**: Compliant copy with mandatory risk notice.

4. **Comprehensive Admin Portal (`/admin`)**:
   - **Overview Dashboard** (`/admin`): Live leads volume, today's leads, 7d/30d pace, daily trend chart with hover tooltips, conversion by status, and breakdown by capital, profession, and country.
   - **Partners Management** (`/admin/partners`): Create, edit, and delete partners with live slug uniqueness checking, real-time light/dark theme color preview, logo upload, active status toggle, 1-click URL copy, and direct page launch.
   - **Leads Data Table** (`/admin/leads`): Server-side paginated table with multi-field search (name, phone, email), filter by partner, status, country, capital, and date range. Inline status updater, lead detail drawer with marketing attribution (UTM source, medium, campaign, referrer, device, IP), CRM notes autosave, bulk status update, bulk delete, and **1-click CSV/Excel export with UTF-8 BOM**.
   - **Partner Performance Leaderboard** (`/admin/performance`): Live leaderboard ranking partners by total leads, 7-day velocity, 30-day velocity, webinar attendance rate, and audience share % with 1-click drill-down to filtered leads.
   - **System Settings** (`/admin/settings`): Configure default root page copy, default Telegram link, and change administrator password.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (v26 tested)
- **pnpm**: v9+ (v11 recommended)
- **MongoDB**: MongoDB 6+ instance (local or MongoDB Atlas connection string)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your variables in `.env`:
```env
# Required MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/leadcapture?retryWrites=true&w=majority

# Admin Credentials (Seeded on first run / fallback authentication)
ADMIN_EMAIL=admin@freecourselink.com
ADMIN_PASSWORD=AdminPass123!@#
# Generate a secure 32+ character key: openssl rand -base64 48
ADMIN_SESSION_SECRET=qAfSXZIbpEvKOB5AS5xfeHMLN1QqADKE3b1tBflyxeC64ZVNvsW3B/dtk9xHq1iP

# Canonical Public URL
NEXT_PUBLIC_SITE_URL=https://freecourselink.com

# Cloudinary Storage for Partner Logos (Optional: falls back to persistent local /public/uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Seed the Database
Run the idempotent seed script to create the administrator account, default system settings, demo partner **Aman Singh** (`/aman-singh`), and initial sample leads:
```bash
pnpm seed
```

Output:
```text
🌱 Starting seed script...
✅ Admin user created: admin@freecourselink.com
✅ Default SiteSettings initialized.
✅ Demo partner created: Aman Singh (/aman-singh)
✅ Seeded 4 sample leads.
🚀 Seeding complete!
```

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) for the generic landing page, [http://localhost:3000/aman-singh](http://localhost:3000/aman-singh) for the demo partner page, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin console.

---

## 🛠️ Testing & Quality Assurance

Run the test suite verifying phone E.164 normalization, lead validation schema, duplicate detection rules, and partner slug reservation:
```bash
pnpm test
```

Run ESLint verification (0 errors, 0 warnings):
```bash
pnpm lint
```

Run production build:
```bash
pnpm build
```

---

## 📁 Logo & Brand Asset Storage

The system includes a dual-storage strategy:
1. **Cloudinary CDN (Cloud Storage)**: If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are provided in `.env`, uploaded partner logos are uploaded directly to Cloudinary and served via their global CDN.
2. **Local `/public/uploads` Fallback**: If Cloudinary credentials are not provided, files are written directly to `public/uploads/` with unique cryptographically random names and served directly by Next.js.
3. **SVG Sanitization**: All uploaded SVG files are sanitized to strip any executable scripts, `onload`, `onclick`, `onerror`, or dangerous XML entities before saving.

---

## 📊 Deployment Steps

### On Vercel
1. Push this repository to GitHub/GitLab.
2. Import the project in Vercel.
3. Add the environment variables from `.env.example` in Vercel Settings > Environment Variables.
4. Deploy! Run `pnpm seed` via a one-off task or connect locally to seed the admin account.

### On Docker / VPS / Railway
1. Build the production container:
   ```bash
   pnpm build
   pnpm start
   ```
2. Set up reverse proxy (Nginx or Caddy) with SSL termination forwarding port 3000.

---

## 🔒 Security & Compliance
- **Stateless HTTP-Only JWT Cookies**: Admin session token (`fogm_admin`) with SameSite Strict protection.
- **Timing-Safe Password Verification**: Scrypt + cryptographic salt comparison via `crypto.timingSafeEqual`.
- **IP Rate Limiting**: Redis/MongoDB TTL sliding window counters protecting `/api/leads` and `/api/admin/login`.
- **Security Headers**: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Educational Disclaimer**: Mandatory financial risk disclaimers across all landing pages and emails.
