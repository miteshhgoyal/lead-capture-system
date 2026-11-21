import { receive, verifyHandshake } from "@/autodm/webhook";

export const dynamic = "force-dynamic";

/** Meta webhook: GET = verification handshake, POST = signed events. No session, no CSRF: the HMAC is the authentication. */
export async function GET(req: Request): Promise<Response> {
  return verifyHandshake(req);
}

export async function POST(req: Request): Promise<Response> {
  return receive(req);
}
