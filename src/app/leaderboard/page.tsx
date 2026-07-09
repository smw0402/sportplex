import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { roleLabel, displayName } from "@/lib/constants";
import { levelOf } from "@/lib/level";
import { RANK_MEDAL } from "@/lib/ranking";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    where: { isAdmin: false, deletedAt: null },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/board" className="text-sm text-gray-500 hover:text-gray-700">
        ← 커뮤니티
      </Link>
      <div>
        <h1 className="text-xl font-extrabold">🏅 내공 랭킹</h1>
        <p className="mt-1 text-sm text-gray-500">
          글·답변·추천으로 내공을 쌓아 등급을 올려보세요. (네이버 지식iN 성장형 등급)
        </p>
      </div>

      {/* 등급 안내 */}
      <div className="card flex flex-wrap gap-x-3 gap-y-1.5 p-4 text-xs text-gray-500">
        {[
          { i: "🌱", n: "씨앗" },
          { i: "🌳", n: "나무" },
          { i: "⭐", n: "별" },
          { i: "🌙", n: "달" },
          { i: "☀️", n: "태양" },
          { i: "🪐", n: "우주신" },
        ].map((g) => (
          <span key={g.n} className="inline-flex items-center gap-0.5">
            {g.i} {g.n}
          </span>
        ))}
        <span className="text-gray-400">… 내공이 쌓일수록 등급이 자랍니다</span>
      </div>

      <div className="card divide-y divide-gray-100">
        {users.map((u, i) => {
          const lv = levelOf(u.points);
          return (
            <Link key={u.id} href={`/u/${u.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <span className="w-7 shrink-0 text-center text-sm font-extrabold text-gray-400">
                {i < 3 ? RANK_MEDAL[i] : i + 1}
              </span>
              <Avatar name={displayName(u)} src={u.avatar} sport={u.sport} size={44} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {displayName(u)}
                  {u.verified && <span className="text-brand-500">✔</span>}
                  <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700">
                    {lv.icon} Lv.{lv.level} {lv.name}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{roleLabel(u.role)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-extrabold text-brand-600">{u.points}</p>
                <p className="text-[10px] text-gray-400">내공</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
