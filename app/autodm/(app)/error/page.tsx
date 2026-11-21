import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/admin/AdminPrimitives";
import { connectErrorMessage } from "@/autodm/accounts";

export default async function ConnectErrorPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4 p-8 text-center">
      <AlertTriangle className="mx-auto size-10 text-down" aria-hidden />
      <h1 className="text-xl font-semibold">We couldn&apos;t connect your account</h1>
      <p className="text-sm text-mute">{connectErrorMessage(String(code ?? "failed").slice(0, 30))}</p>
      <Link href="/api/autodm/connect/instagram" prefetch={false} className="inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Try again</Link>
      <div><Link href="/autodm" className="text-sm text-mute hover:underline">Back to AutoDM</Link></div>
    </Card>
  );
}
