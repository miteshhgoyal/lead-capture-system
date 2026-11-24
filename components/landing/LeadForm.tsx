"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CAPITAL_OPTIONS,
  PROFESSION_OPTIONS,
  LeadFormSchema,
} from "@/lib/validation/lead";
import { COUNTRIES, type CountryOption } from "./country-data";
import { Confetti } from "./Confetti";
import { ArrowRight, Lock, MessageCircle, Send, Zap } from "lucide-react";

interface LeadFormProps {
  partnerSlug?: string;
  partnerName?: string;
  telegramLink?: string;
  whatsappLink?: string;
  className?: string;
}

/*
 * Mobile notes:
 *  - Controls use text-base on mobile (16px) so iOS Safari does not zoom the page on focus; sm:text-sm restores the compact size.
 *  - The phone row uses a fixed-width country select + min-w-0 input so it cannot overflow at 320px.
 *  - scroll-mt keeps the form clear of the sticky navbar when "Get Free Pass" scrolls to it.
 */
export function LeadForm({
  partnerSlug = "direct",
  partnerName: _partnerName = "Direct",
  telegramLink = "",
  whatsappLink = "",
  className = "",
}: LeadFormProps) {
  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [capital, setCapital] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<string>("");
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
  const [submittedWhatsappLink, setSubmittedWhatsappLink] = useState(whatsappLink);

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

        setSubmittedTelegramLink(data.telegramLink || telegramLink);
        setSubmittedWhatsappLink(data.whatsappLink || whatsappLink);
        setIsSubmitted(true);
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
        data-solid
        className={`relative scroll-mt-24 overflow-hidden rounded-3xl border border-hairline bg-card p-5 shadow-2xl transition-all sm:p-8 ${className}`}
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

          <h3 className="mt-3 max-w-full break-words text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            You&apos;re In, {name.split(" ")[0]}!
          </h3>

          <p className="mt-2 max-w-full break-words text-sm text-mute">
            We&apos;ve sent your exclusive Zoom link and webinar pass to{" "}
            <span className="font-semibold text-ink">
              {selectedCountry.dialCode} {phone}
            </span>{" "}
            via WhatsApp and to <span className="break-all font-semibold text-ink">{email}</span>.
          </p>

          {/* Community links: shown only here, after the lead is saved */}
          {(submittedTelegramLink || submittedWhatsappLink) && (
            <>
              <div className="my-6 w-full rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Immediate Next Step</h4>
                    <p className="mt-0.5 text-xs text-mute">
                      Join our official community now to receive session resources, chart templates, and
                      instant live reminders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                {submittedTelegramLink && (
                  <a
                    href={submittedTelegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-4 py-3.5 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-all hover:brightness-110 active:scale-[0.98] sm:px-6"
                  >
                    <Send className="size-5 shrink-0" aria-hidden />
                    Join Telegram Community
                  </a>
                )}
                {submittedWhatsappLink && (
                  <a
                    href={submittedWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      submittedTelegramLink
                        ? "inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent px-4 py-3.5 text-base font-semibold text-accent transition-all hover:bg-accent/10 active:scale-[0.98] sm:px-6"
                        : "inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-4 py-3.5 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-all hover:brightness-110 active:scale-[0.98] sm:px-6"
                    }
                  >
                    <MessageCircle className="size-5 shrink-0" aria-hidden />
                    Join WhatsApp Community
                  </a>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 border-t border-hairline pt-4 text-xs text-mute">
            <Lock className="size-3.5" aria-hidden /> 100% Free · Join 60,000+ Enrolled Students
          </div>
        </div>
      </div>
    );
  }

  const controlBase =
    "w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-base text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm";

  return (
    <div
      id="lead-form"
      data-solid
      className={`relative scroll-mt-24 rounded-3xl border border-hairline bg-card p-5 shadow-2xl transition-all sm:p-8 ${className}`}
    >
      {/* Decorative accent wash (clipped so it can never cause sideways scroll) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-20 -top-20 size-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-48 rounded-full bg-accent-2/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="mb-5">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <span>
              LIMITED SEATS AVAILABLE<span className="hidden sm:inline"> · LIVE WEBINAR</span>
            </span>
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
              autoComplete="name"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={controlBase}
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
                  aria-label="Country code"
                  className="h-full w-28 rounded-xl border border-hairline bg-bg px-2.5 py-2.5 text-base font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-auto sm:text-sm"
                >
                  {COUNTRIES.map((c, i) => (
                    <option key={`${c.code}-${i}`} value={c.dialCode}>
                      {c.code} {c.dialCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number Input */}
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={`min-w-0 ${controlBase}`}
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
              className={controlBase}
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
              inputMode="email"
              autoComplete="email"
              required
              placeholder="rahul@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={controlBase}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] text-down">{fieldErrors.email}</p>
            )}
          </div>

          {/* 5. Age & Profession (2-column layout) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-semibold text-ink">
                Age <span className="text-down">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={18}
                max={80}
                required
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (fieldErrors.age) setFieldErrors((prev) => ({ ...prev, age: "" }));
                }}
                className={controlBase}
              />
              {fieldErrors.age && (
                <p className="mt-1 text-[11px] text-down">{fieldErrors.age}</p>
              )}
            </div>

            <div className="min-w-0">
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
                className={controlBase}
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
              className={controlBase}
            >
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.dialCode})
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
              <span className="inline-flex items-center gap-1.5">Get Free Pass <ArrowRight className="size-4" aria-hidden /></span>
            )}
          </button>

          {/* 8. Footer Trust Line */}
          <p className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-center text-xs text-mute">
            <Lock className="size-3.5" aria-hidden /> 100% Free · Join 60,000+ Enrolled Students
          </p>
        </form>
      </div>
    </div>
  );
}
