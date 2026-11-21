import { PageHeader } from "@/components/admin/AdminPrimitives";
import { AutomationForm } from "@/autodm/ui/AutomationForm";

export default function NewAutomationPage() {
  return (
    <>
      <PageHeader title="New automation" description="Replies only go to people who interact first: no cold or bulk messages." />
      <AutomationForm />
    </>
  );
}
