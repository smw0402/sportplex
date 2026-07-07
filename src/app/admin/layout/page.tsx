import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHomeLayout } from "@/lib/homeLayout";
import AdminNav from "@/components/AdminNav";
import LayoutEditor from "@/components/LayoutEditor";

export const dynamic = "force-dynamic";

export default async function AdminLayoutPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const layout = await getHomeLayout();

  return (
    <div className="space-y-5">
      <AdminNav active="layout" />
      <div className="card p-6">
        <h2 className="mb-4 font-bold">🧩 홈 레이아웃 편집</h2>
        <LayoutEditor initial={layout} />
      </div>
    </div>
  );
}
