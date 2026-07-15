import DashboardApp from "../dashboard-app";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const user = await requireChatGPTUser("/playground");
  return <DashboardApp section="playground" userName={user.displayName} userEmail={user.email} />;
}
