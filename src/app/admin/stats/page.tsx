import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, roleLabel } from "@/lib/constants";
import { won } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import SpellCheck from "@/components/SpellCheck";

export const dynamic = "force-dynamic";

// 지난 N일의 yyyy-mm-dd 라벨
function lastDays(n: number) {
  const days: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucket(rows: { createdAt: Date }[], days: string[]) {
  const map = new Map(days.map((d) => [d, 0]));
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({ day: d, count: map.get(d) ?? 0 }));
}

function refHost(referrer: string | null) {
  if (!referrer) return "직접 유입";
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    if (!h || h.includes("sportplex")) return "직접 유입";
    return h;
  } catch {
    return "직접 유입";
  }
}

export default async function AdminStatsPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const days = lastDays(14);
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const [
    revenueAgg,
    paidCount,
    payRows,
    totalUsers,
    usersByRole,
    signupRows,
    posts,
    comments,
    recruits,
    proposals,
    matched,
    reviews,
    accessRows,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.findMany({ where: { status: "PAID", paidAt: { gte: since } }, select: { paidAt: true, amount: true } }),
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.recruitment.count(),
    prisma.proposal.count(),
    prisma.recruitment.count({ where: { status: "MATCHED" } }),
    prisma.review.count(),
    prisma.accessLog.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, referrer: true } }),
  ]);

  const revenue = revenueAgg._sum.amount ?? 0;
  const signupSeries = bucket(signupRows, days);
  const accessSeries = bucket(accessRows, days);

  // 매출 시리즈(금액)
  const revMap = new Map(days.map((d) => [d, 0]));
  for (const p of payRows) {
    const key = (p.paidAt ?? new Date()).toISOString().slice(0, 10);
    if (revMap.has(key)) revMap.set(key, (revMap.get(key) ?? 0) + p.amount);
  }
  const revSeries = days.map((d) => ({ day: d, count: revMap.get(d) ?? 0 }));

  // 유입 통계
  const refCount = new Map<string, number>();
  for (const a of accessRows) {
    const h = refHost(a.referrer);
    refCount.set(h, (refCount.get(h) ?? 0) + 1);
  }
  const referrers = [...refCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const roleCount = new Map(usersByRole.map((r) => [r.role, r._count._all]));

  return (
    <div className="space-y-6">
      <AdminNav active="stats" />

      {/* 매출 통계 */}
      <Section title="💰 매출 통계">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="누적 매출(완료)" value={won(revenue)} accent />
          <Stat label="결제 완료 건수" value={`${paidCount}건`} />
          <Stat label="14일 매출" value={won(revSeries.reduce((s, r) => s + r.count, 0))} />
          <Stat label="예상 수수료(10%)" value={won(Math.round(revenue * 0.1))} />
        </div>
        <Bars data={revSeries} format={(v) => won(v)} />
      </Section>

      {/* 고객 통계 */}
      <Section title="👥 고객 통계">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="전체 회원" value={`${totalUsers}명`} accent />
          <Stat label="14일 신규가입" value={`${signupSeries.reduce((s, r) => s + r.count, 0)}명`} />
          <Stat label="지도자" value={`${ROLES.filter((r) => r.group === "provider").reduce((s, r) => s + (roleCount.get(r.key) ?? 0), 0)}명`} />
          <Stat label="학생·학부모" value={`${ROLES.filter((r) => r.group !== "provider").reduce((s, r) => s + (roleCount.get(r.key) ?? 0), 0)}명`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <span key={r.key} className="chip bg-gray-100 text-gray-600">
              {roleLabel(r.key)} {roleCount.get(r.key) ?? 0}
            </span>
          ))}
        </div>
        <Bars data={signupSeries} format={(v) => `${v}명`} />
      </Section>

      {/* 운영 통계 */}
      <Section title="🛠 운영 통계">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="게시글" value={`${posts}`} />
          <Stat label="댓글" value={`${comments}`} />
          <Stat label="모집공고" value={`${recruits}`} />
          <Stat label="제안" value={`${proposals}`} />
          <Stat label="매칭 성사" value={`${matched}`} accent />
          <Stat label="후기" value={`${reviews}`} />
        </div>
      </Section>

      {/* 접속 통계 */}
      <Section title="📊 접속 통계 (14일)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="14일 페이지뷰" value={`${accessSeries.reduce((s, r) => s + r.count, 0)}`} accent />
          <Stat label="일 평균" value={`${Math.round(accessSeries.reduce((s, r) => s + r.count, 0) / 14)}`} />
          <Stat label="오늘" value={`${accessSeries.at(-1)?.count ?? 0}`} />
        </div>
        <Bars data={accessSeries} format={(v) => `${v}`} />
      </Section>

      {/* 유입 통계 */}
      <Section title="🔗 유입 통계 (14일)">
        {referrers.length === 0 ? (
          <p className="text-sm text-gray-400">아직 유입 데이터가 없습니다.</p>
        ) : (
          <ul className="space-y-1.5">
            {referrers.map(([host, count]) => (
              <li key={host} className="flex items-center gap-2 text-sm">
                <span className="w-40 shrink-0 truncate">{host}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(count / referrers[0][1]) * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-gray-500">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 맞춤법 검사 */}
      <Section title="🔤 맞춤법 검사">
        <SpellCheck />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-gray-100 p-3 ${accent ? "bg-brand-50" : "bg-white"}`}>
      <p className={`text-lg font-extrabold ${accent ? "text-brand-700" : ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Bars({ data, format }: { data: { day: string; count: number }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="mt-4 flex items-end gap-1" style={{ height: 96 }}>
      {data.map((d) => (
        <div key={d.day} className="group flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t bg-brand-400 transition group-hover:bg-brand-600"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 3 : 0 }}
            title={`${d.day.slice(5)} · ${format(d.count)}`}
          />
          <span className="mt-1 text-[9px] text-gray-300">{d.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}
