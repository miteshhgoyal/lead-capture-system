import { PageHeader } from "@/components/admin/AdminPrimitives";
import { LeadsView } from "@/autodm/ui/DataViews";

export default function Page() {
  return (
    <>
      <PageHeader title="Leads" description="People who interacted with your automations." />
      <LeadsView />
    </>
  );
}
