import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { roleLabel, sportEmoji, PROVIDER_ROLE_KEYS } from "@/lib/constants";
import { getRatings } from "@/lib/reviews";
import { sportplexScore, RANK_MEDAL } from "@/lib/ranking";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import SportFilter from "@/components/SportFilter";

export const dynamic = "force-dynamic";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;

  const providers = await prisma.user.findMany({
    where: {
      role: { in: PROVIDER_ROLE_KEYS },
      ...(sport ? { sport } : {}),
    },
  });

  const ids = providers.map((p) => p.id);
  const [ratings, matchRows] = await Promise.all([
    getRatings(ids),
    prisma.proposal.groupBy({
      by: ["proposerId"],
      where: { status: "ACCEPTED", proposerId: { in: ids } },
      _count: { proposerId: true },
    }),
  ]);
  const matchMap = new Map(matchRows.map((r) => [r.proposerId, r._count.proposerId]));

  const ranked = providers
    .map((p) => {
      const r = ratings.get(p.id) ?? { avg: 0, count: 0 };
      const matchCount = matchMap.get(p.id) ?? 0;
      return {
        user: p,
        avg: r.avg,
        reviewCount: r.count,
        matchCount,
        score: sportplexScore({
          avg: r.avg,
          reviewCount: r.count,
          matchCount,
          verified: p.verified,
        }),
      };
    })
    .sort((a, b) => b.score - a.score || b.avg - a.avg);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">🏆 지도자 랭킹</h1>
        <p className="mt-1 text-sm text-gray-500">
          별점·후기·매칭 성사·인증 여부를 종합한 <b>스포렉스 점수</b> 순위예요.
        </p>
      </div>

      <SportFilter />

      {/* 전체 순위 */}
      <div className="card divide-y divide-gray-100">
        {ranked.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-400">해당 종목의 지도자가 없습니다.</p>
        )}
        {ranked.map((r, i) => (
          <Link key={r.user.id} href={`/u/${r.user.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <span className="w-7 shrink-0 text-center text-sm font-extrabold text-gray-400">
              {i < 3 ? RANK_MEDAL[i] : i + 1}
            </span>
            <Avatar name={r.user.name} src={r.user.avatar} sport={r.user.sport} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {r.user.name}
                {r.user.verified && <span className="ml-1 text-brand-500">✔</span>}
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  {roleLabel(r.user.role)} · {sportEmoji(r.user.sport)} {r.user.sport ?? "종목무관"}
                </span>
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                {r.reviewCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Stars value={r.avg} size="text-[11px]" />
                    {r.avg.toFixed(1)} ({r.reviewCount})
                  </span>
                ) : (
                  <span>후기 없음</span>
                )}
                <span>· 매칭 {r.matchCount}건</span>
                {r.user.verified && <span className="text-brand-500">· 인증 지도자</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold text-brand-600">{r.score}</p>
              <p className="text-[10px] text-gray-400">점</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="px-1 text-xs text-gray-400">
        점수 산정: 평균별점×10 + 후기수×4 + 매칭성사×6 + 인증 보너스 15
      </p>
    </div>
  );
}
