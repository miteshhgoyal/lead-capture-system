import { PageHeader } from "@/components/admin/AdminPrimitives";
import { AutomationsList } from "@/autodm/ui/AutomationsList";

export default function Page() {
  return (
    <>
      <PageHeader title="Automations" description="Rules that reply to comments, story replies and DMs." />
      <AutomationsList />
    </>
  );
}
