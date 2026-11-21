import { PageHeader } from "@/components/admin/AdminPrimitives";
import { AutomationForm } from "@/autodm/ui/AutomationForm";

export default async function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit automation" />
      <AutomationForm automationId={id} />
    </>
  );
}
