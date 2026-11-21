import { redirect } from "next/navigation";

/** The root page has no content any more: send everyone to partner sign-up. */
export default function HomePage(): never {
  redirect("/partners/join");
}
