import { PageHeader } from "@/components/admin/AdminPrimitives";
import { ConversationsView } from "@/autodm/ui/DataViews";

export default function Page() {
  return (
    <>
      <PageHeader title="Conversations" description="Read-only history of messages received and sent." />
      <ConversationsView />
    </>
  );
}
