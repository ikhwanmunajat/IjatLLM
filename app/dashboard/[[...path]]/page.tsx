import DashboardApp from "../../dashboard-app";
import { requireChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function DashboardRoute({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const returnTo = path.length ? `/dashboard/${path.join("/")}` : "/dashboard";
  const user = await requireChatGPTUser(returnTo);
  return <DashboardApp section={path[0] ?? "overview"} userName={user.displayName} userEmail={user.email} />;
}
