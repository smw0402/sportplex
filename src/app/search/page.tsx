import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  sportEmoji,
  roleLabel,
  serviceLabel,
  RECRUIT_STATUS,
  categoryMeta,
  PROVIDER_ROLE_KEYS,
} from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { getRatings } from "@/lib/reviews";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import SportFilter from "@/components/SportFilter";

export const dynamic = "force-dynamic";

type Tab = "all" | "people" | "recruit" | "post";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "people", label: "코치·선생님" },
  { key: "recruit", label: "모집공고" },
  { key: "post", label: "질문" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; type?: Tab }>;
}) {
  const { q = "", sport, type = "all" } = await searchParams;
  const keyword = q.trim();
  const hasQuery = keyword.length > 0;

  // q + sport 조건으로 각 엔티티 검색
  const sportWhere = sport ? { sport } : {};

  const [people, recruits, posts] = await Promise.all([
    type === "all" || type === "people"
      ? prisma.user.findMany({
          where: {
            role: { in: PROVIDER_ROLE_KEYS },
            deletedAt: null,
            ...sportWhere,
            ...(hasQuery
              ? {
                  OR: [
                    { name: { contains: keyword } },
                    { bio: { contains: keyword } },
                    { region: { contains: keyword } },
                    { sport: { contains: keyword } },
                  ],
                }
              : {}),
          },
          orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
          take: type === "people" ? 50 : 6,
        })
      : Promise.resolve([]),

    type === "all" || type === "recruit"
      ? prisma.recruitment.findMany({
          where: {
            ...sportWhere,
            ...(hasQuery
              ? {
                  OR: [
                    { title: { contains: keyword } },
                    { content: { contains: keyword } },
                    { region: { contains: keyword } },
                  ],
                }
              : {}),
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          include: { author: true, _count: { select: { proposals: true } } },
          take: type === "recruit" ? 50 : 5,
        })
      : Promise.resolve([]),

    type === "all" || type === "post"
      ? prisma.post.findMany({
          where: {
            ...sportWhere,
            ...(hasQuery
              ? {
                  OR: [
                    { title: { contains: keyword } },
                    { content: { contains: keyword } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          include: { author: true, _count: { select: { comments: true } } },
          take: type === "post" ? 50 : 5,
        })
      : Promise.resolve([]),
  ]);

  const ratings = await getRatings(people.map((p) => p.id));
  const total = people.length + recruits.length + posts.length;
  const qs = (next: Partial<{ type: Tab }>) => {
    const sp = new URLSearchParams();
    if (keyword) sp.set("q", keyword);
    if (sport) sp.set("sport", sport);
    const t = next.type ?? type;
    if (t !== "all") sp.set("type", t);
    return `/search?${sp.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* 검색 입력 */}
      <form action="/search" className="flex gap-2">
        {sport && <input type="hidden" name="sport" value={sport} />}
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            name="q"
            defaultValue={keyword}
            className="input !pl-10"
            placeholder="코치, 종목, 지역, 모집공고, 질문 검색…"
            autoFocus
          />
        </div>
        <button className="btn-primary shrink-0">검색</button>
      </form>

      {/* 종목 필터 */}
      <SportFilter />

      {/* 타입 탭 */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs({ type: t.key })}
            className={`chip whitespace-nowrap border ${
              type === t.key
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 결과 헤더 */}
      <p className="text-sm text-gray-500">
        {hasQuery ? (
          <>
            <b className="text-gray-800">&ldquo;{keyword}&rdquo;</b> 검색 결과 {total}건
          </>
        ) : (
          "키워드를 입력하거나 종목으로 둘러보세요."
        )}
        {sport && <span className="ml-1 text-brand-600">· {sportEmoji(sport)} {sport}</span>}
      </p>

      {total === 0 && (
        <div className="card p-10 text-center text-sm text-gray-400">
          {hasQuery ? "검색 결과가 없어요. 다른 키워드로 시도해보세요." : "검색어를 입력해보세요."}
        </div>
      )}

      {/* 코치·선생님 */}
      {people.length > 0 && (
        <section className="space-y-2">
          <SectionTitle label="⭐ 코치·선생님" more={type === "all" ? qs({ type: "people" }) : undefined} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {people.map((u) => (
              <Link key={u.id} href={`/u/${u.id}`} className="card-link flex items-center gap-3 p-4 ">
                <Avatar name={u.name} src={u.avatar} sport={u.sport} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {u.name}
                    {u.verified && <span className="ml-1 text-brand-500">✔</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {roleLabel(u.role)} · {u.sport ?? "종목무관"} · {u.region ?? ""}
                  </p>
                  {(ratings.get(u.id)?.count ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs">
                      <Stars value={ratings.get(u.id)!.avg} size="text-[11px]" />
                      <span className="font-semibold text-gray-500">
                        {ratings.get(u.id)!.avg.toFixed(1)} ({ratings.get(u.id)!.count})
                      </span>
                    </span>
                  )}
                  {u.bio && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{u.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 모집공고 */}
      {recruits.length > 0 && (
        <section className="space-y-2">
          <SectionTitle label="📢 모집공고" more={type === "all" ? qs({ type: "recruit" }) : undefined} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recruits.map((r) => (
              <Link key={r.id} href={`/recruit/${r.id}`} className="card-link p-4 ">
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>
                    {RECRUIT_STATUS[r.status].label}
                  </span>
                  <span className="chip bg-gray-50 text-gray-600">
                    {sportEmoji(r.sport)} {r.sport}
                  </span>
                  <span className="chip bg-brand-50 text-brand-600">{serviceLabel(r.serviceType)}</span>
                </div>
                <p className="mt-2 truncate font-semibold">{r.title}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{r.content}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {r.author.name} · {r.region ?? "지역무관"} · 제안 {r._count.proposals}건
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 커뮤니티 글 */}
      {posts.length > 0 && (
        <section className="space-y-2">
          <SectionTitle label="💬 커뮤니티" more={type === "all" ? qs({ type: "post" }) : undefined} />
          <div className="card divide-y divide-gray-100">
            {posts.map((p) => (
              <Link key={p.id} href={`/board/${p.id}`} className="flex gap-3 p-4 hover:bg-gray-50">
                <Avatar name={p.author.name} src={p.author.avatar} sport={p.author.sport} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="chip bg-brand-50 text-brand-700">
                      {categoryMeta(p.category).emoji} {categoryMeta(p.category).label}
                    </span>
                    {p.sport && (
                      <span className="chip bg-gray-50 text-gray-600">
                        {sportEmoji(p.sport)} {p.sport}
                      </span>
                    )}
                    <span>· {p.author.name} · {timeAgo(p.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate font-semibold">{p.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{p.content}</p>
                </div>
                <span className="self-center text-xs font-semibold text-brand-600">💬 {p._count.comments}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ label, more }: { label: string; more?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-bold">{label}</h2>
      {more && (
        <Link href={more} className="text-xs font-medium text-brand-600">
          더보기 →
        </Link>
      )}
    </div>
  );
}
