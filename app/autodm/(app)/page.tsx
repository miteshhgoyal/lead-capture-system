import { PageHeader } from "@/components/admin/AdminPrimitives";
import { Overview } from "@/autodm/ui/Overview";

export default function AutoDmHome() {
  return (
    <>
      <PageHeader title="AutoDM" description="Reply automatically when people comment, reply to your story, or message you on Instagram." />
      <Overview />
    </>
  );
}
