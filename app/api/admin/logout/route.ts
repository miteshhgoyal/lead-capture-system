import { json } from "@/lib/http";
import { clearAdminSession } from "@/lib/admin-auth";

export async function POST(): Promise<Response> {
  await clearAdminSession();
  return json({ ok: true });
}
