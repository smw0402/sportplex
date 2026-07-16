import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sportEmoji, displayName } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import SportFilter from "@/components/SportFilter";
import Avatar from "@/components/Avatar";
import LevelBadge from "@/components/LevelBadge";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "new", label: "최신순" },
  { key: "hot", label: "인기순" },
  { key: "comment", label: "댓글순" },
];

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; sort?: string; q?: string }>;
}) {
  const { sport, sort = "new", q = "" } = await searchParams;
  const keyword = q.trim();

  const where = {
    ...(sport ? { sport } : {}),
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: "insensitive" as const } },
            { content: { contains: keyword, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "hot"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : sort === "comment"
        ? [{ comments: { _count: "desc" as const } }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    include: {
      author: true,
      _count: { select: { comments: true, likes: true } },
    },
    take: 60,
  });

  const qs = (next: { sort?: string }) => {
    const p = new URLSearchParams();
    if (sport) p.set("sport", sport);
    if (keyword) p.set("q", keyword);
    p.set("sort", next.sort ?? sort);
    return `/board?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold">💬 커뮤니티</h1>
          <p className="text-sm text-gray-500">선수·지도자가 자유롭게 소통하는 공간이에요.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Link href="/leaderboard" className="btn-outline w-full sm:w-auto">
            🏅 내공랭킹
          </Link>
          <Link href="/board/new" className="btn-primary w-full sm:w-auto">
            + 글쓰기
          </Link>
        </div>
      </div>

      {/* 커뮤니티 검색 */}
      <form action="/board" className="flex gap-2">
        {sport && <input type="hidden" name="sport" value={sport} />}
        {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            name="q"
            defaultValue={keyword}
            className="input !pl-10"
            placeholder="커뮤니티 글 검색 (제목·내용)"
          />
        </div>
        <button className="btn-primary shrink-0">검색</button>
      </form>

      <SportFilter />

      {/* 정렬 */}
      <div className="flex items-center gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={qs({ sort: s.key })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              sort === s.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {s.label}
          </Link>
        ))}
        {keyword && (
          <Link href="/board" className="ml-auto text-xs text-gray-400 hover:text-gray-600">
            검색 초기화 ✕
          </Link>
        )}
      </div>

      {keyword && (
        <p className="text-sm text-gray-500">
          <b className="text-gray-800">&ldquo;{keyword}&rdquo;</b> 검색 결과 {posts.length}건
        </p>
      )}

      <div className="card divide-y divide-gray-100">
        {posts.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">
            {keyword ? "검색 결과가 없어요. 다른 키워드로 시도해보세요." : "첫 글을 남겨보세요!"}
          </div>
        )}
        {posts.map((p) => {
          const hot = p._count.likes >= 3;
          return (
            <Link key={p.id} href={`/board/${p.id}`} className="flex gap-3 p-4 hover:bg-gray-50">
              <Avatar name={displayName(p.author)} src={p.author.avatar} sport={p.author.sport} size={42} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                  {p.sport && (
                    <span className="chip bg-gray-50 text-gray-600">
                      {sportEmoji(p.sport)} {p.sport}
                    </span>
                  )}
                  {hot && <span className="chip bg-red-50 text-red-500">🔥 HOT</span>}
                </div>
                <h3 className="mt-1 truncate font-semibold">
                  {p.title}
                  {p._count.comments > 0 && (
                    <span className="ml-1.5 text-sm font-bold text-brand-600">
                      [{p._count.comments}]
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{p.content}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <LevelBadge points={p.author.points} showName={false} />
                  {displayName(p.author)} · {timeAgo(p.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-center gap-1 text-xs text-gray-400">
                <span className={p._count.likes > 0 ? "font-semibold text-red-500" : ""}>
                  ❤️ {p._count.likes}
                </span>
                <span>👁 {p.views}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
