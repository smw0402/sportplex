import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NOTI_ICON } from "@/lib/notify";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 이번에 새로 보는 안 읽은 알림 표시 후, 모두 읽음 처리
  const freshIds = new Set(items.filter((n) => !n.read).map((n) => n.id));
  if (freshIds.size > 0) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-extrabold">🔔 알림</h1>

      <div className="card divide-y divide-gray-100">
        {items.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">새로운 알림이 없어요.</div>
        )}
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.link}
            className={`flex items-start gap-3 p-4 hover:bg-gray-50 ${
              freshIds.has(n.id) ? "bg-brand-50/60" : ""
            }`}
          >
            <span className="mt-0.5 text-xl leading-none">{NOTI_ICON[n.type] ?? "🔔"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
            </div>
            {freshIds.has(n.id) && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
