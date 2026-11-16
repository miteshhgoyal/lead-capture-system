"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CAPITAL_OPTIONS,
  PROFESSION_OPTIONS,
  LeadFormSchema,
} from "@/lib/validation/lead";
import { COUNTRIES, type CountryOption } from "./country-data";
import { Confetti } from "./Confetti";

interface LeadFormProps {
  partnerSlug?: string;
  partnerName?: string;
  telegramLink?: string;
  className?: string;
}

export function LeadForm({
  partnerSlug = "direct",
  partnerName: _partnerName = "Direct",
  telegramLink = "https://t.me/onestockacademy",
  className = "",
}: LeadFormProps) {
  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [capital, setCapital] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<string>("24");
  const [profession, setProfession] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [tracking, setTracking] = useState<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referrer?: string;
    landingUrl?: string;
  }>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTelegramLink, setSubmittedTelegramLink] = useState(telegramLink);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Extract UTMs and referrer upon mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source") || undefined;
    const utm_medium = params.get("utm_medium") || undefined;
    const utm_campaign = params.get("utm_campaign") || undefined;
    const utm_term = params.get("utm_term") || undefined;
    const utm_content = params.get("utm_content") || undefined;
    const referrer = document.referrer || undefined;
    const landingUrl = window.location.href;

    setTracking((prev) => {
      if (prev.landingUrl === landingUrl) return prev;
      return { utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer, landingUrl };
    });
  }, []);

  // Handle auto-redirect countdown after submission
  useEffect(() => {
    if (!isSubmitted || redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      if (submittedTelegramLink && submittedTelegramLink.startsWith("http")) {
        window.location.href = submittedTelegramLink;
      }
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isSubmitted, redirectCountdown, submittedTelegramLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formDataToValidate = {
      name: name.trim(),
      countryCode: selectedCountry.dialCode,
      phone: phone.trim(),
      capital: capital,
      email: email.trim().toLowerCase(),
      age: parseInt(age, 10),
      profession: profession,
      country: selectedCountry.name,
      hp_company: honeypot,
      ...tracking,
    };

    const parsed = LeadFormSchema.safeParse(formDataToValidate);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setFormError("Please fill in all required fields accurately.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...parsed.data,
          partnerSlug,
        };

        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          setFormError(data.error || "Failed to submit. Please try again.");
          return;
        }

        const tLink = data.telegramLink || telegramLink;
        setSubmittedTelegramLink(tLink);
        setIsSubmitted(true);
        setRedirectCountdown(6); // 6-second auto-redirect countdown
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "A network error occurred. Please try again.";
        setFormError(message);
      }
    });
  };

  if (isSubmitted) {
    return (
      <div
        id="lead-form"
        className={`relative overflow-hidden rounded-3xl border border-hairline bg-card p-6 shadow-2xl transition-all sm:p-8 ${className}`}
      >
        <Confetti />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-up/10 text-up ring-8 ring-up/5">
            <svg
              className="size-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <span className="rounded-full bg-up/10 px-3 py-1 text-xs font-semibold text-up">
            PASS CONFIRMED
          </span>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            You&apos;re In, {name.split(" ")[0]}!
          </h3>

          <p className="mt-2 text-sm text-mute">
            We&apos;ve sent your exclusive Zoom link and webinar pass to{" "}
            <span className="font-semibold text-ink">
              {selectedCountry.dialCode} {phone}
            </span>{" "}
            via WhatsApp and to <span className="font-semibold text-ink">{email}</span>.
          </p>

          {/* Action Box */}
          <div className="my-6 w-full rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">⚡</span>
              <div>
                <h4 className="text-sm font-semibold text-ink">Immediate Next Step</h4>
                <p className="mt-0.5 text-xs text-mute">
                  Join our official VIP Telegram community now to receive session resources, chart
                  templates, and instant live reminders.
                </p>
              </div>
            </div>
          </div>

          <a
            href={submittedTelegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <svg className="size-5 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.963z" />
            </svg>
            Join Partner Telegram Channel
          </a>

          {redirectCountdown !== null && redirectCountdown > 0 && (
            <p className="mt-3 text-xs text-mute">
              Auto-redirecting to Telegram in {redirectCountdown}s...{" "}
              <button
                type="button"
                onClick={() => setRedirectCountdown(null)}
                className="underline hover:text-ink"
              >
                Cancel
              </button>
            </p>
          )}

          <div className="mt-6 border-t border-hairline pt-4 text-xs text-mute">
            🔒 100% Free · Join 60,000+ Enrolled Students
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="lead-form"
      className={`relative rounded-3xl border border-hairline bg-card p-6 shadow-2xl transition-all sm:p-8 ${className}`}
    >
      {/* Decorative accent wash */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-accent-2/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            LIMITED SEATS AVAILABLE · LIVE WEBINAR
          </div>
          <h3 className="mt-2.5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Claim Your Free VIP Pass
          </h3>
          <p className="mt-1 text-xs text-mute sm:text-sm">
            Fill the quick form below to receive the Zoom link & preparation kit.
          </p>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-down/20 bg-down/10 p-3 text-xs text-down">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field - invisible to genuine users */}
          <input
            type="text"
            name="hp_company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* 1. Your Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Your Name <span className="text-down">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-[11px] text-down">{fieldErrors.name}</p>
            )}
          </div>

          {/* 2. WhatsApp Number (For Zoom Link) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              WhatsApp Number <span className="font-normal text-mute">(For Zoom Link)</span>{" "}
              <span className="text-down">*</span>
            </label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={selectedCountry.dialCode}
                  onChange={(e) => {
                    const match = COUNTRIES.find((c) => c.dialCode === e.target.value);
                    if (match) setSelectedCountry(match);
                  }}
                  className="h-full rounded-xl border border-hairline bg-bg px-2.5 py-2.5 text-xs font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm"
                >
                  {COUNTRIES.map((c, i) => (
                    <option key={`${c.code}-${i}`} value={c.dialCode}>
                      {c.flag} {c.dialCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number Input */}
              <input
                type="tel"
                required
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-[11px] text-down">{fieldErrors.phone}</p>
            )}
          </div>

          {/* 3. Trading / Investment Capital */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Trading / Investment Capital <span className="text-down">*</span>
            </label>
            <select
              required
              value={capital}
              onChange={(e) => {
                setCapital(e.target.value);
                if (fieldErrors.capital) setFieldErrors((prev) => ({ ...prev, capital: "" }));
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="" disabled>
                Select your capital range
              </option>
              {CAPITAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {fieldErrors.capital && (
              <p className="mt-1 text-[11px] text-down">{fieldErrors.capital}</p>
            )}
          </div>

          {/* 4. Gmail / Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Gmail / Email <span className="text-down">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="rahul@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] text-down">{fieldErrors.email}</p>
            )}
          </div>

          {/* 5. Age & Profession (2-column layout) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Age <span className="text-down">*</span>
              </label>
              <input
                type="number"
                min={18}
                max={80}
                required
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (fieldErrors.age) setFieldErrors((prev) => ({ ...prev, age: "" }));
                }}
                className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {fieldErrors.age && (
                <p className="mt-1 text-[11px] text-down">{fieldErrors.age}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Profession <span className="text-down">*</span>
              </label>
              <select
                required
                value={profession}
                onChange={(e) => {
                  setProfession(e.target.value);
                  if (fieldErrors.profession)
                    setFieldErrors((prev) => ({ ...prev, profession: "" }));
                }}
                className="w-full rounded-xl border border-hairline bg-bg px-3 py-2.5 text-xs text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm"
              >
                <option value="" disabled>
                  Select
                </option>
                {PROFESSION_OPTIONS.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
              {fieldErrors.profession && (
                <p className="mt-1 text-[11px] text-down">{fieldErrors.profession}</p>
              )}
            </div>
          </div>

          {/* 6. Country */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Country <span className="text-down">*</span>
            </label>
            <select
              value={selectedCountry.name}
              onChange={(e) => {
                const match = COUNTRIES.find((c) => c.name === e.target.value);
                if (match) setSelectedCountry(match);
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>

          {/* 7. Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="size-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Securing Your Seat...
              </span>
            ) : (
              <span>Get Free Pass →</span>
            )}
          </button>

          {/* 8. Footer Trust Line */}
          <p className="pt-1 text-center text-xs text-mute">
            🔒 100% Free · Join 60,000+ Enrolled Students
          </p>
        </form>
      </div>
    </div>
  );
}
