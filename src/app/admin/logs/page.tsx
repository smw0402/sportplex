import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo, ymd } from "@/lib/format";
import { resolveErrorLogAction, clearResolvedLogsAction } from "@/app/actions/adminExtra";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const { show = "open" } = await searchParams;
  const resolved = show === "resolved";

  const [logs, openCount, resolvedCount] = await Promise.all([
    prisma.errorLog.findMany({
      where: { resolved },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.errorLog.count({ where: { resolved: true } }),
  ]);

  return (
    <div className="space-y-5">
      <AdminNav active="logs" />

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold">🐞 오류·버그 로그 · 미해결 <span className="text-red-500">{openCount}</span></h2>
        <div className="ml-auto flex gap-2">
          <Link
            href="/admin/logs?show=open"
            className={`chip border ${!resolved ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600"}`}
          >
            미해결 {openCount}
          </Link>
          <Link
            href="/admin/logs?show=resolved"
            className={`chip border ${resolved ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600"}`}
          >
            해결됨 {resolvedCount}
          </Link>
        </div>
      </div>

      {resolved && resolvedCount > 0 && (
        <form action={clearResolvedLogsAction}>
          <button className="btn-outline !py-1.5 text-xs text-red-500">해결된 로그 전체 삭제</button>
        </form>
      )}

      <div className="space-y-3">
        {logs.length === 0 && (
          <div className="card p-8 text-center text-sm text-gray-400">
            {resolved ? "해결된 로그가 없습니다." : "🎉 미해결 오류가 없습니다."}
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="card p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="break-words font-mono text-sm font-semibold text-red-600">{log.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {log.path && <span className="mr-2">📍 {log.path}</span>}
                  {ymd(log.createdAt)} · {timeAgo(log.createdAt)}
                  {log.digest && <span className="ml-2">#{log.digest}</span>}
                </p>
                {log.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-400">스택 추적</summary>
                    <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
              <form action={resolveErrorLogAction} className="shrink-0">
                <input type="hidden" name="logId" value={log.id} />
                <input type="hidden" name="resolved" value={resolved ? "0" : "1"} />
                <button className="btn-outline !px-2.5 !py-1.5 text-xs">
                  {resolved ? "미해결로" : "해결"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
