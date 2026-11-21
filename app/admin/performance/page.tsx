import { redirect } from "next/navigation";

/** Merged into Partners (leads, revenue, share % and share value are columns there). Safe to delete this file. */
export default function PerformanceMoved(): never {
  redirect("/admin/partners");
}
