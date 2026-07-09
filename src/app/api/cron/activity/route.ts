import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { displayName } from "@/lib/constants";
import { BOT_POST_TEMPLATES, BOT_COMMENTS, pick } from "@/lib/demoContent";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

// 데모/마케팅 계정(isBot)이 자동으로 글·댓글·좋아요 활동을 수행 (플랫폼 활성화용)
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 한 번 실행에 몇 개의 액션을 할지 (기본 4, ?n= 로 조절)
  const n = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("n")) || 4));

  const bots = await prisma.user.findMany({
    where: { isBot: true, deletedAt: null },
    select: { id: true, name: true, nickname: true, sport: true },
  });
  if (bots.length === 0) {
    return NextResponse.json({ ok: true, note: "isBot 계정이 없습니다.", done: 0 });
  }

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, authorId: true },
  });

  const log: string[] = [];

  for (let i = 0; i < n; i++) {
    const bot = pick(bots);
    const roll = Math.random();

    try {
      if (roll < 0.2 || recentPosts.length === 0) {
        // 새 글 작성 (20%)
        const t = pick(BOT_POST_TEMPLATES);
        const post = await prisma.post.create({
          data: {
            authorId: bot.id,
            category: t.category,
            sport: bot.sport,
            title: t.title,
            content: t.content,
          },
        });
        await prisma.user.update({ where: { id: bot.id }, data: { points: { increment: 2 } } });
        recentPosts.unshift({ id: post.id, authorId: bot.id });
        log.push(`post by ${displayName(bot)}`);
      } else if (roll < 0.55) {
        // 댓글 (35%)
        const target = pick(recentPosts);
        if (target.authorId === bot.id) continue;
        await prisma.comment.create({
          data: { postId: target.id, authorId: bot.id, content: pick(BOT_COMMENTS) },
        });
        await prisma.user.update({ where: { id: bot.id }, data: { points: { increment: 1 } } });
        // 글 작성자에게 알림 (자기 글 제외)
        await notify({
          userId: target.authorId,
          actorId: bot.id,
          type: "COMMENT",
          message: `${displayName(bot)}님이 회원님의 글에 댓글을 남겼어요.`,
          link: `/board/${target.id}`,
        });
        log.push(`comment by ${displayName(bot)}`);
      } else {
        // 좋아요 (45%)
        const target = pick(recentPosts);
        if (target.authorId === bot.id) continue;
        const exists = await prisma.postLike.findUnique({
          where: { postId_userId: { postId: target.id, userId: bot.id } },
        });
        if (exists) continue;
        await prisma.postLike.create({ data: { postId: target.id, userId: bot.id } });
        await prisma.user.update({
          where: { id: target.authorId },
          data: { points: { increment: 1 } },
        });
        log.push(`like by ${displayName(bot)}`);
      }
    } catch {
      /* 개별 액션 실패는 무시하고 계속 */
    }
  }

  return NextResponse.json({ ok: true, done: log.length, actions: log });
}
