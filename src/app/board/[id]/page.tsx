import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sportEmoji, roleLabel, displayName } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { addCommentAction, deletePostAction } from "@/app/actions/board";
import Avatar from "@/components/Avatar";
import LikeButton from "@/components/LikeButton";
import ReportButton from "@/components/ReportButton";
import LevelBadge from "@/components/LevelBadge";
import CommentItem, { type CommentNode } from "@/components/CommentItem";

export const dynamic = "force-dynamic";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const likeFilter = user ? { where: { userId: user.id } } : false;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      likes: likeFilter,
      _count: { select: { likes: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: true,
          likes: likeFilter,
          _count: { select: { likes: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: true,
              likes: likeFilter,
              _count: { select: { likes: true } },
            },
          },
        },
      },
    },
  });
  if (!post) notFound();

  await prisma.post.update({ where: { id }, data: { views: { increment: 1 } } });

  const isOwner = user?.id === post.author.id;
  const postLiked = Array.isArray(post.likes) && post.likes.length > 0;

  // 댓글 → 노드 평탄화 (부모 다음에 답글)
  type C = (typeof post.comments)[number];
  const toNode = (c: C | C["replies"][number], isReply: boolean): CommentNode => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    author: {
      id: c.author.id,
      name: c.author.name,
      nickname: c.author.nickname,
      role: c.author.role,
      avatar: c.author.avatar,
      sport: c.author.sport,
      verified: c.author.verified,
      points: c.author.points,
    },
    likeCount: c._count.likes,
    liked: Array.isArray(c.likes) && c.likes.length > 0,
    isReply,
    recommended: c.recommended,
  });

  const isPostAuthor = user?.id === post.author.id;

  // 추천(채택)된 답변을 상단으로
  const topComments = [...post.comments].sort(
    (a, b) => Number(b.recommended) - Number(a.recommended)
  );

  const nodes: CommentNode[] = [];
  let total = 0;
  for (const c of topComments) {
    nodes.push(toNode(c, false));
    total++;
    for (const r of c.replies) {
      nodes.push(toNode(r, true));
      total++;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/board" className="text-sm text-gray-500 hover:text-gray-700">
        ← 커뮤니티
      </Link>

      <article className="card p-6">
        {post.sport && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip bg-gray-50 text-gray-600">
              {sportEmoji(post.sport)} {post.sport}
            </span>
          </div>
        )}
        <h1 className="mt-2 text-xl font-bold">{post.title}</h1>

        <div className="mt-3 flex items-center justify-between">
          <Link href={`/u/${post.author.id}`} className="flex items-center gap-2.5">
            <Avatar name={displayName(post.author)} src={post.author.avatar} sport={post.author.sport} size={38} />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {displayName(post.author)}
                {post.author.verified && <span className="text-brand-500">✔</span>}
                <LevelBadge points={post.author.points} />
              </p>
              <p className="text-xs text-gray-400">
                {roleLabel(post.author.role)} · {timeAgo(post.createdAt)} · 👁 {post.views}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user && !isOwner && <ReportButton targetType="POST" targetId={post.id} />}
            {(isOwner || user?.isAdmin) && (
              <form action={deletePostAction}>
                <input type="hidden" name="postId" value={post.id} />
                <button className="text-xs text-gray-400 hover:text-red-500">삭제</button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
          {post.content}
        </p>

        <div className="mt-5 flex justify-center">
          <LikeButton postId={post.id} count={post._count.likes} liked={postLiked} canLike={!!user} />
        </div>
      </article>

      <section className="card p-6">
        <h2 className="mb-4 font-bold">댓글 {total}</h2>

        <div className="space-y-4">
          {nodes.length === 0 && <p className="text-sm text-gray-400">첫 댓글을 남겨보세요.</p>}
          {nodes.map((n) => (
            <CommentItem
              key={n.id}
              comment={n}
              postId={post.id}
              meId={user?.id ?? null}
              isAdmin={!!user?.isAdmin}
              canInteract={!!user}
              isPostAuthor={isPostAuthor}
            />
          ))}
        </div>

        {user ? (
          <form action={addCommentAction} className="mt-5 flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input name="content" className="input" placeholder="댓글을 입력하세요" required />
            <button className="btn-primary shrink-0">등록</button>
          </form>
        ) : (
          <p className="mt-5 rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-500">
            <Link href="/login" className="font-semibold text-brand-600">
              로그인
            </Link>{" "}
            후 댓글을 남길 수 있어요.
          </p>
        )}
      </section>
    </div>
  );
}
