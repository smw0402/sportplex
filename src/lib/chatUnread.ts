import { prisma } from "./prisma";

// 방별 안 읽은 메시지 수 + 합계
export async function getChatUnread(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { id: true, userAId: true, lastReadAAt: true, lastReadBAt: true },
  });

  const perRoom = new Map<string, number>();
  let total = 0;
  for (const r of rooms) {
    const isA = r.userAId === userId;
    const lastRead = isA ? r.lastReadAAt : r.lastReadBAt;
    const count = await prisma.message.count({
      where: {
        roomId: r.id,
        senderId: { not: userId },
        ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
      },
    });
    if (count > 0) {
      perRoom.set(r.id, count);
      total += count;
    }
  }
  return { total, perRoom };
}
