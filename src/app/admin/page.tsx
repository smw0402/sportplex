import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel, sportEmoji, REPORT_TARGET_LABEL } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { approveVerificationAction, rejectVerificationAction } from "@/app/actions/verify";
import {
  resolveReportAction,
  dismissReportAction,
  removeReportedContentAction,
  setSuspendAction,
} from "@/app/actions/report";
import { deleteNewsAction } from "@/app/actions/news";
import Avatar from "@/components/Avatar";
import NewsForm from "@/components/NewsForm";
import AiNewsGenerator from "@/components/AiNewsGenerator";

export const dynamic = "force-dynamic";
// AI 웹 검색은 시간이 걸릴 수 있어 함수 타임아웃을 늘림
export const maxDuration = 60;

// 신고 대상으로 이동할 링크
function targetHref(type: string, id: string) {
  if (type === "USER") return `/u/${id}`;
  if (type === "POST") return `/board/${id}`;
  if (type === "RECRUITMENT") return `/recruit/${id}`;
  return null; // 댓글은 직접 링크 없음
}

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound(); // 관리자가 아니면 존재하지 않는 페이지로 처리

  const [pending, reviewed, reports, newsList, stats] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.verificationRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: { user: true },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      include: { reporter: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.newsItem.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.recruitment.count(),
      prisma.recruitment.count({ where: { status: "MATCHED" } }),
      prisma.review.count(),
      prisma.post.count(),
    ]),
  ]);

  const [users, verified, recruits, matched, reviews, posts] = stats;

  // 신고된 USER 대상의 정지 상태 조회
  const reportedUserIds = reports.filter((r) => r.targetType === "USER").map((r) => r.targetId);
  const reportedUsers = reportedUserIds.length
    ? await prisma.user.findMany({ where: { id: { in: reportedUserIds } } })
    : [];
  const suspendedMap = new Map(reportedUsers.map((u) => [u.id, u.suspended]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold">🛠️ 관리자</h1>
        <span className="chip bg-gray-900 text-white">ADMIN</span>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="전체 회원" value={users} />
        <StatCard label="인증 지도자" value={verified} accent />
        <StatCard label="모집공고" value={recruits} />
        <StatCard label="매칭 성사" value={matched} accent />
        <StatCard label="후기" value={reviews} />
        <StatCard label="신고 대기" value={reports.length} accent />
      </div>

      {/* 신고 처리 큐 */}
      <section className="card p-6">
        <h2 className="mb-4 font-bold">
          🚩 신고 처리 대기 <span className="text-red-500">{reports.length}</span>
        </h2>

        {reports.length === 0 && (
          <p className="text-sm text-gray-400">대기 중인 신고가 없습니다.</p>
        )}

        <div className="space-y-3">
          {reports.map((r) => {
            const href = targetHref(r.targetType, r.targetId);
            const isUser = r.targetType === "USER";
            const suspended = suspendedMap.get(r.targetId);
            return (
              <div key={r.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="chip bg-red-50 text-red-600">{r.reason}</span>
                  <span className="chip bg-gray-100 text-gray-600">
                    {REPORT_TARGET_LABEL[r.targetType] ?? r.targetType}
                  </span>
                  <span className="text-gray-400">· 신고 {timeAgo(r.createdAt)}</span>
                  {href && (
                    <Link href={href} className="font-medium text-brand-600 hover:underline">
                      대상 보기 →
                    </Link>
                  )}
                </div>

                {r.detail && (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700">
                    {r.detail}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">신고자: {r.reporter.name}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* 콘텐츠 삭제 (게시글/댓글/모집공고) */}
                  {r.targetType !== "USER" && (
                    <form action={removeReportedContentAction}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <button className="btn !bg-red-500 !py-1.5 text-xs text-white hover:!bg-red-600">
                        콘텐츠 삭제
                      </button>
                    </form>
                  )}

                  {/* 회원 정지/해제 */}
                  {isUser && (
                    <form action={setSuspendAction}>
                      <input type="hidden" name="userId" value={r.targetId} />
                      <input type="hidden" name="suspend" value={suspended ? "0" : "1"} />
                      <button className="btn !py-1.5 text-xs text-white hover:opacity-90"
                        style={{ background: suspended ? "#16a34a" : "#dc2626" }}>
                        {suspended ? "정지 해제" : "회원 정지"}
                      </button>
                    </form>
                  )}

                  <form action={resolveReportAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="reportId" value={r.id} />
                    <button className="btn-ghost !py-1.5 text-xs">해결 처리</button>
                  </form>
                  <form action={dismissReportAction}>
                    <input type="hidden" name="reportId" value={r.id} />
                    <button className="btn-outline !py-1.5 text-xs text-gray-500">반려</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 뉴스 관리 (홈 노출) */}
      <section className="card p-6">
        <h2 className="mb-4 font-bold">📰 뉴스 관리</h2>
        <div className="mb-5">
          <AiNewsGenerator />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsForm />
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-600">최근 등록 {newsList.length}</p>
            <div className="space-y-2">
              {newsList.length === 0 && <p className="text-sm text-gray-400">등록된 뉴스가 없습니다.</p>}
              {newsList.map((n) => (
                <div key={n.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="mr-1">{sportEmoji(n.sport)}</span>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {n.sport} · {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <form action={deleteNewsAction}>
                    <input type="hidden" name="newsId" value={n.id} />
                    <button className="text-sm text-red-500 hover:underline">삭제</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 인증 심사 큐 */}
      <section className="card p-6">
        <h2 className="mb-4 font-bold">
          🪪 인증 심사 대기 <span className="text-brand-600">{pending.length}</span>
        </h2>

        {pending.length === 0 && (
          <p className="text-sm text-gray-400">대기 중인 인증 신청이 없습니다.</p>
        )}

        <div className="space-y-4">
          {pending.map((req) => (
            <div key={req.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/u/${req.user.id}`} className="flex items-center gap-2.5">
                  <Avatar name={req.user.name} src={req.user.avatar} sport={req.user.sport} size={40} />
                  <div>
                    <p className="text-sm font-semibold">
                      {req.user.name}
                      {req.realName && <span className="ml-1 text-xs text-gray-400">({req.realName})</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {roleLabel(req.user.role)}
                      {req.user.sport && ` · ${sportEmoji(req.user.sport)} ${req.user.sport}`}
                      {` · 신청 ${timeAgo(req.createdAt)}`}
                    </p>
                  </div>
                </Link>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {req.credential}
              </p>

              {req.evidenceUrl && (
                <a href={req.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={req.evidenceUrl} alt="증빙" className="h-28 rounded-lg border border-gray-100 object-cover" />
                </a>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={approveVerificationAction}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <button className="btn-primary text-sm">✔ 승인 (뱃지 부여)</button>
                </form>
                <form action={rejectVerificationAction} className="flex items-center gap-2">
                  <input type="hidden" name="requestId" value={req.id} />
                  <input name="reviewNote" className="input !py-2 text-sm" placeholder="거절 사유 (선택)" />
                  <button className="btn-ghost text-sm">거절</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 처리 내역 */}
      {reviewed.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-bold">최근 처리 내역</h2>
          <ul className="divide-y divide-gray-100">
            {reviewed.map((req) => (
              <li key={req.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span
                  className={`chip ${
                    req.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {req.status === "APPROVED" ? "승인" : "거절"}
                </span>
                <Link href={`/u/${req.user.id}`} className="font-medium hover:underline">
                  {req.user.name}
                </Link>
                <span className="text-xs text-gray-400">
                  {roleLabel(req.user.role)} · {req.reviewedAt ? timeAgo(req.reviewedAt) : ""}
                </span>
                {req.reviewNote && <span className="text-xs text-gray-400">— {req.reviewNote}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? "bg-brand-50" : ""}`}>
      <p className={`text-2xl font-extrabold ${accent ? "text-brand-700" : ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}
