import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sportEmoji, roleLabel, displayName, RECRUIT_STATUS, serviceLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
  });

  const idsOf = (t: string) => bookmarks.filter((b) => b.targetType === t).map((b) => b.targetId);
  const [users, posts, recruits] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: idsOf("USER") }, deletedAt: null } }),
    prisma.post.findMany({
      where: { id: { in: idsOf("POST") } },
      include: { author: true, _count: { select: { comments: true, likes: true } } },
    }),
    prisma.recruitment.findMany({
      where: { id: { in: idsOf("RECRUITMENT") } },
      include: { author: true, _count: { select: { proposals: true } } },
    }),
  ]);

  // 저장 순서 유지
  const order = new Map(bookmarks.map((b, i) => [`${b.targetType}:${b.targetId}`, i]));
  users.sort((a, b) => (order.get(`USER:${a.id}`) ?? 0) - (order.get(`USER:${b.id}`) ?? 0));
  posts.sort((a, b) => (order.get(`POST:${a.id}`) ?? 0) - (order.get(`POST:${b.id}`) ?? 0));
  recruits.sort((a, b) => (order.get(`RECRUITMENT:${a.id}`) ?? 0) - (order.get(`RECRUITMENT:${b.id}`) ?? 0));

  const empty = users.length + posts.length + recruits.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-extrabold">🔖 찜 목록</h1>

      {empty && (
        <div className="card p-10 text-center text-sm text-gray-400">
          아직 찜한 항목이 없어요. 코치·글·공고에서 🔖 를 눌러 저장해보세요.
        </div>
      )}

      {users.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">⭐ 코치·회원 {users.length}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {users.map((u) => (
              <Link key={u.id} href={`/u/${u.id}`} className="card-link flex items-center gap-3 p-4">
                <Avatar name={u.name} src={u.avatar} sport={u.sport} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {displayName(u)}
                    {u.verified && <span className="ml-1 text-brand-500">✔</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {roleLabel(u.role)} · {u.sport ?? "종목무관"} · {u.region ?? ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recruits.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">📢 모집공고 {recruits.length}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recruits.map((r) => (
              <Link key={r.id} href={`/recruit/${r.id}`} className="card-link p-4">
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>{RECRUIT_STATUS[r.status].label}</span>
                  <span className="chip bg-gray-50 text-gray-600">{sportEmoji(r.sport)} {r.sport}</span>
                  <span className="chip bg-brand-50 text-brand-600">{serviceLabel(r.serviceType)}</span>
                </div>
                <p className="mt-2 truncate font-semibold">{r.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{r.author.name} · 제안 {r._count.proposals}건</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">💬 커뮤니티 글 {posts.length}</h2>
          <div className="card divide-y divide-gray-100">
            {posts.map((p) => (
              <Link key={p.id} href={`/board/${p.id}`} className="flex gap-3 p-4 hover:bg-gray-50">
                <Avatar name={displayName(p.author)} src={p.author.avatar} sport={p.author.sport} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{p.content}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {displayName(p.author)} · {timeAgo(p.createdAt)} · ❤️ {p._count.likes} · 💬 {p._count.comments}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
