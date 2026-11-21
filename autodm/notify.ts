import { dbConnect } from "@/lib/db";
import { AutodmNotification } from "./models";

/**
 * In-app notice for a user. (The project has no mailer yet; when one is added, send the e-mail from here.)
 */
export async function notify(ownerId: string, kind: string, message: string): Promise<void> {
  try {
    await dbConnect();
    await AutodmNotification.create({ ownerId, kind, message: message.slice(0, 300) });
  } catch (e) {
    console.error("[autodm] notify failed:", (e as Error).message);
  }
}
