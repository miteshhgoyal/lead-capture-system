import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutsPreview } from "@/components/landing/dev/LayoutsPreview";

export const metadata: Metadata = {
  title: "Layout variants (dev)",
  robots: { index: false, follow: false },
};

/** Development-only gallery of every section variant. Returns 404 in production. */
export default function LayoutsDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LayoutsPreview />;
}
