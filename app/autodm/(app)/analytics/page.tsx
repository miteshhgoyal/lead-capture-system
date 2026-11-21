import { PageHeader } from "@/components/admin/AdminPrimitives";
import { AnalyticsView } from "@/autodm/ui/DataViews";

export default function Page() {
  return (
    <>
      <PageHeader title="Analytics" description="How your automations are performing." />
      <AnalyticsView />
    </>
  );
}
