import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  sportEmoji,
  roleLabel,
  isProvider,
  RECRUIT_STATUS,
  serviceLabel,
  categoryMeta,
  themeGradient,
} from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { getRating } from "@/lib/reviews";
import { logoutAction } from "@/app/actions/auth";
import { startChatAction } from "@/app/actions/profile";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import ReportButton from "@/components/ReportButton";
import { levelOf } from "@/lib/level";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();

  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      careers: { orderBy: [{ startYear: "desc" }, { order: "asc" }] },
      posts: { orderBy: { createdAt: "desc" }, take: 10 },
      recruitments: { orderBy: { createdAt: "desc" }, take: 10 },
      reviewsReceived: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { posts: true, recruitments: true, proposals: true } },
    },
  });
  if (!u) notFound();

  const isMe = me?.id === u.id;
  const provider = isProvider(u.role);
  const rating = await getRating(u.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 커버 + 헤더 (인스타 스타일) */}
      <div className="card overflow-hidden">
        {u.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.cover} alt="cover" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-28" style={{ backgroundImage: themeGradient(u.themeColor) }} />
        )}
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <div className="rounded-full border-4 border-white">
              <Avatar name={u.name} src={u.avatar} sport={u.sport} size={80} />
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <>
                  <Link href="/profile/edit" className="btn-outline text-sm">
                    프로필 편집
                  </Link>
                  <form action={logoutAction}>
                    <button className="btn-ghost text-sm">로그아웃</button>
                  </form>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {me && <ReportButton targetType="USER" targetId={u.id} className="btn-ghost text-sm" />}
                  <form action={startChatAction}>
                    <input type="hidden" name="targetId" value={u.id} />
                    <button className="btn-primary text-sm">💌 메시지 보내기</button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="flex items-center gap-1.5 text-xl font-extrabold">
              {u.name}
              {u.verified && <span className="text-brand-500">✔</span>}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              <span className="font-medium text-brand-600">{roleLabel(u.role)}</span>
              {u.sport && ` · ${sportEmoji(u.sport)} ${u.sport}`}
              {u.region && ` · 📍 ${u.region}`}
            </p>
            {(u.school || u.team) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {u.school && <span className="chip bg-gray-100 text-gray-600">🏫 {u.school}</span>}
                {u.team && <span className="chip bg-gray-100 text-gray-600">🛡️ {u.team}</span>}
              </div>
            )}
            {provider && u.verified && (
              <span className="mt-1.5 inline-flex chip bg-brand-50 text-brand-700">
                ✔ 인증 지도자
              </span>
            )}
            {isMe && provider && !u.verified && (
              <Link
                href="/verify"
                className="mt-1.5 inline-flex chip border border-dashed border-brand-300 text-brand-600 hover:bg-brand-50"
              >
                🪪 지도자 인증 신청하기 →
              </Link>
            )}
            {rating.count > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Stars value={rating.avg} />
                <span className="text-sm font-bold text-gray-700">{rating.avg.toFixed(1)}</span>
                <span className="text-xs text-gray-400">후기 {rating.count}개</span>
              </div>
            )}
            {u.bio && <p className="mt-2 text-[15px] text-gray-700">{u.bio}</p>}

            {(u.instagram || u.youtube) && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {u.instagram && (
                  <a
                    href={`https://instagram.com/${u.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="chip bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                  >
                    📷 @{u.instagram}
                  </a>
                )}
                {u.youtube && (
                  <a href={u.youtube} target="_blank" rel="noreferrer" className="chip bg-red-500 text-white">
                    ▶️ YouTube
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 등급(내공 레벨) */}
          {(() => {
            const lv = levelOf(u.points);
            return (
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-brand-50 to-white p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-brand-700">
                    <span className="text-lg">{lv.icon}</span>
                    Lv.{lv.level} {lv.name}
                  </span>
                  <span className="text-xs text-gray-500">내공 {u.points}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round(lv.progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {lv.isMax ? "최고 등급에 도달했어요! 🎉" : `다음 등급까지 내공 ${lv.toNext}`}
                </p>
              </div>
            );
          })()}

          {/* 통계 (인스타식) */}
          <div className="mt-4 flex gap-6 border-t border-gray-50 pt-4 text-center">
            <Stat label="글" value={u._count.posts} />
            <Stat label="후기" value={rating.count} />
            <Stat label="내공" value={u.points} accent />
          </div>
        </div>
      </div>

      {/* 경력 */}
      {(u.careers.length > 0 || isMe) && (
        <section className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">🏅 경력</h2>
            {isMe && (
              <Link href="/profile/edit" className="text-xs font-medium text-brand-600">
                + 추가/편집
              </Link>
            )}
          </div>
          {u.careers.length === 0 ? (
            <p className="text-sm text-gray-400">
              {isMe ? "경력을 추가해 신뢰도를 높여보세요." : "등록된 경력이 없습니다."}
            </p>
          ) : (
            <ul className="space-y-3">
              {u.careers.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {c.org && `${c.org} · `}
                      {c.startYear ?? ""}
                      {c.startYear && ` ~ ${c.endYear ?? "현재"}`}
                    </p>
                    {c.detail && <p className="mt-0.5 text-sm text-gray-600">{c.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 받은 후기 */}
      {u.reviewsReceived.length > 0 && (
        <section className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">⭐ 후기 {rating.count}개</h2>
            <span className="flex items-center gap-1.5 text-sm">
              <Stars value={rating.avg} />
              <b className="text-gray-700">{rating.avg.toFixed(1)}</b>
            </span>
          </div>
          <ul className="space-y-4">
            {u.reviewsReceived.map((rv) => (
              <li key={rv.id} className="border-t border-gray-50 pt-4 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <Avatar name={rv.author.name} src={rv.author.avatar} sport={rv.author.sport} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">
                      <Link href={`/u/${rv.author.id}`} className="hover:underline">
                        {rv.author.name}
                      </Link>
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        {roleLabel(rv.author.role)} · {timeAgo(rv.createdAt)}
                      </span>
                    </p>
                    <Stars value={rv.rating} size="text-xs" />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{rv.content}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 작성한 모집공고 */}
      {u.recruitments.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-bold">📢 모집공고</h2>
          <div className="space-y-2">
            {u.recruitments.map((r) => (
              <Link
                key={r.id}
                href={`/recruit/${r.id}`}
                className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
              >
                <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>
                  {RECRUIT_STATUS[r.status].label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                <span className="text-xs text-gray-400">{serviceLabel(r.serviceType)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 작성한 글 */}
      {u.posts.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-bold">💬 커뮤니티 글</h2>
          <div className="space-y-2">
            {u.posts.map((p) => (
              <Link
                key={p.id}
                href={`/board/${p.id}`}
                className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
              >
                <span className="chip bg-brand-50 text-brand-700">
                  {categoryMeta(p.category).emoji} {categoryMeta(p.category).label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                <span className="text-xs text-gray-400">{timeAgo(p.createdAt)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`text-lg font-extrabold ${accent ? "text-brand-600" : ""}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
