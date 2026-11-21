import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/admin/AdminPrimitives";

export default function ConnectedPage() {
  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4 p-8 text-center">
      <CheckCircle2 className="mx-auto size-10 text-up" aria-hidden />
      <h1 className="text-xl font-semibold">Account connected</h1>
      <p className="text-sm text-mute">Your account is connected. Create your first automation to start replying automatically.</p>
      <div className="flex justify-center gap-3 text-sm font-semibold">
        <Link href="/autodm/automations/new" className="text-accent hover:underline">Create automation</Link>
        <Link href="/autodm" className="text-mute hover:underline">Back to AutoDM</Link>
      </div>
    </Card>
  );
}
