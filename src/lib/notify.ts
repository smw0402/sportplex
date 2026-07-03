import { prisma } from "./prisma";

// 알림 생성 (자기 자신 행동은 알림 X)
export async function notify(opts: {
  userId: string;
  actorId?: string | null;
  type: string;
  message: string;
  link: string;
}) {
  if (!opts.userId) return;
  if (opts.actorId && opts.actorId === opts.userId) return;
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      actorId: opts.actorId ?? null,
      type: opts.type,
      message: opts.message,
      link: opts.link,
    },
  });
}

export const NOTI_ICON: Record<string, string> = {
  COMMENT: "💬",
  REPLY: "↳",
  POST_LIKE: "❤️",
  COMMENT_LIKE: "❤️",
  PROPOSAL: "✋",
  MATCH: "🤝",
  MESSAGE: "💌",
  CONSULT: "📩",
  RECOMMEND: "✅",
};
