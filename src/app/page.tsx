import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  sportEmoji,
  roleLabel,
  RECRUIT_STATUS,
  serviceLabel,
  categoryMeta,
  displayName,
} from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { getRatings } from "@/lib/reviews";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import SportFilter from "@/components/SportFilter";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const user = await getCurrentUser();

  // 명시적 선택(URL) > 내 종목 > 전체
  const explicitSport = sport ?? null;
  const effectiveSport = explicitSport ?? user?.sport ?? null;
  const usingMySport = !explicitSport && !!user?.sport;

  const [news, popularPosts, openRecruits, coaches] = await Promise.all([
    prisma.newsItem.findMany({
      where: effectiveSport ? { sport: effectiveSport } : undefined,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.post.findMany({
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: 5,
      include: { author: true, _count: { select: { likes: true, comments: true } } },
    }),
    prisma.recruitment.findMany({
      where: { status: "OPEN", ...(effectiveSport ? { sport: effectiveSport } : {}) },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { author: true, _count: { select: { proposals: true } } },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["COACH", "DIRECTOR", "TEACHER"] },
        ...(effectiveSport ? { sport: effectiveSport } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const ratings = await getRatings(coaches.map((c) => c.id));
  const [hero, ...rest] = news;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 히어로 배너 */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-9">
        <p className="text-sm font-medium text-brand-100">스포츠인들의 커뮤니티 · 코칭 매칭</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
          선수도, 코치도 모이는 곳
          <br className="hidden sm:block" /> Sportplex
        </h1>
        <p className="mt-2 max-w-lg text-sm text-brand-100">
          자유롭게 소통하고, 내게 맞는 코치·레슨까지 한 번에.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
          <Link href="/board" className="btn w-full bg-white !px-3 text-[13px] text-brand-700 hover:bg-brand-50 sm:text-sm">
            💬 커뮤니티 가기
          </Link>
          <Link href="/recruit" className="btn w-full bg-white/15 !px-3 text-[13px] text-white hover:bg-white/25 sm:text-sm">
            모집공고 둘러보기
          </Link>
        </div>
      </section>

      {/* 종목 필터 */}
      <SportFilter />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 md:space-y-8 lg:col-span-2">
          {/* 인기글 */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">🔥 인기글</h2>
              <Link href="/board?sort=hot" className="text-xs font-medium text-brand-600">
                커뮤니티 전체보기
              </Link>
            </div>
            {popularPosts.length === 0 ? (
              <div className="card p-8 text-center text-sm text-gray-400">
                아직 인기글이 없어요. 첫 글을 남겨보세요!
              </div>
            ) : (
              <div className="card divide-y divide-gray-100">
                {popularPosts.map((p, i) => {
                  const cat = categoryMeta(p.category);
                  return (
                    <Link key={p.id} href={`/board/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                      <span className="w-5 shrink-0 text-center text-sm font-extrabold text-brand-500">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="chip bg-brand-50 text-brand-700">
                            {cat.emoji} {cat.label}
                          </span>
                          {p.sport && <span>{sportEmoji(p.sport)} {p.sport}</span>}
                        </div>
                        <h3 className="mt-1 truncate font-semibold">
                          {p.title}
                          {p._count.comments > 0 && (
                            <span className="ml-1.5 text-sm font-bold text-brand-600">
                              [{p._count.comments}]
                            </span>
                          )}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-400">{displayName(p.author)}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-red-500">❤️ {p._count.likes}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 종목 뉴스 (직접 등록한 뉴스) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                📰 {effectiveSport ? `${sportEmoji(effectiveSport)} ${effectiveSport} 주요 뉴스` : "스포츠 이슈"}
              </h2>
              {usingMySport && <span className="chip bg-brand-50 text-brand-700">내 종목</span>}
            </div>

            {news.length === 0 ? (
              <div className="card p-8 text-center text-sm text-gray-400">
                {effectiveSport ? `${effectiveSport} 뉴스가 아직 없어요.` : "아직 등록된 뉴스가 없습니다."}
              </div>
            ) : (
              <div className="space-y-4">
                {hero && (
                  <article className="card overflow-hidden">
                    {hero.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.imageUrl} alt={hero.title} className="aspect-[16/7] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-6xl">
                        {sportEmoji(hero.sport)}
                      </div>
                    )}
                    <div className="p-5">
                      <span className="chip bg-brand-50 text-brand-700">
                        {sportEmoji(hero.sport)} {hero.sport}
                      </span>
                      <h3 className="mt-2 text-xl font-bold leading-snug">{hero.title}</h3>
                      <p className="mt-1.5 text-sm text-gray-600">{hero.summary}</p>
                      <p className="mt-3 text-xs text-gray-400">
                        {hero.source ?? "Sportplex"} · {timeAgo(hero.createdAt)}
                      </p>
                    </div>
                  </article>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {rest.map((n) => (
                    <article key={n.id} className="card p-4">
                      <span className="chip bg-gray-50 text-gray-600">
                        {sportEmoji(n.sport)} {n.sport}
                      </span>
                      <h3 className="mt-2 font-semibold leading-snug">{n.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{n.summary}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {n.source ?? "Sportplex"} · {timeAgo(n.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 사이드: 모집공고 + 추천 전문가 */}
        <aside className="space-y-6">
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">📢 최신 모집공고</h2>
              <Link href="/recruit" className="text-xs font-medium text-brand-600">
                전체보기
              </Link>
            </div>
            <div className="space-y-3">
              {openRecruits.length === 0 && (
                <p className="text-sm text-gray-400">모집중인 공고가 없습니다.</p>
              )}
              {openRecruits.map((r) => (
                <Link key={r.id} href={`/recruit/${r.id}`} className="block rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>
                      {RECRUIT_STATUS[r.status].label}
                    </span>
                    <span className="text-gray-400">
                      {sportEmoji(r.sport)} {serviceLabel(r.serviceType)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {r.region ?? "지역무관"} · 제안 {r._count.proposals}건
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold">⭐ 추천 코치·선생님</h2>
            <div className="space-y-3">
              {coaches.length === 0 && (
                <p className="text-sm text-gray-400">등록된 전문가가 없습니다.</p>
              )}
              {coaches.map((c) => (
                <Link key={c.id} href={`/u/${c.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-gray-50">
                  <Avatar name={c.name} src={c.avatar} sport={c.sport} size={42} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {c.name}
                      {c.verified && <span className="ml-1 text-brand-500">✔</span>}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {roleLabel(c.role)} · {c.sport ?? "종목무관"} · {c.region ?? ""}
                    </p>
                    {(ratings.get(c.id)?.count ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs">
                        <Stars value={ratings.get(c.id)!.avg} size="text-[11px]" />
                        <span className="font-semibold text-gray-500">
                          {ratings.get(c.id)!.avg.toFixed(1)} ({ratings.get(c.id)!.count})
                        </span>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {!user && (
            <section className="card bg-brand-50 p-5 text-center">
              <p className="text-sm font-semibold text-brand-800">스포츠인이라면 누구나</p>
              <p className="mt-1 text-xs text-brand-600">
                가입하고 커뮤니티에서 자유롭게 소통해보세요.
              </p>
              <Link href="/signup" className="btn-primary mt-3 w-full">
                무료로 시작하기
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
