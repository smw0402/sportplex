import { prisma } from "@/lib/prisma";

// 데모(isBot) 계정이 최근 글에 좋아요를 누른다. count 만큼 시도하고 실제 수행 수를 반환.
// 좋아요는 알림이 가지 않으므로 실제 회원에게 방해가 없다.
export async function botLike(count: number): Promise<number> {
  const bots = await prisma.user.findMany({
    where: { isBot: true, deletedAt: null },
    select: { id: true },
  });
  if (bots.length === 0) return 0;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, authorId: true },
  });
  if (posts.length === 0) return 0;

  let done = 0;
  for (let i = 0; i < count; i++) {
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const post = posts[Math.floor(Math.random() * posts.length)];
    if (post.authorId === bot.id) continue;
    try {
      const exists = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: post.id, userId: bot.id } },
      });
      if (exists) continue;
      await prisma.postLike.create({ data: { postId: post.id, userId: bot.id } });
      await prisma.user.update({
        where: { id: post.authorId },
        data: { points: { increment: 1 } },
      });
      done++;
    } catch {
      /* 개별 실패는 무시 */
    }
  }
  return done;
}
