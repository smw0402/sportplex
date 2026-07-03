import { prisma } from "./prisma";

// 두 사용자 사이의 방을 가져오거나 새로 만든다.
// userAId < userBId 로 정렬해 한 쌍당 방이 하나만 생기도록 보장.
export async function getOrCreateRoom(u1: string, u2: string) {
  const [userAId, userBId] = u1 < u2 ? [u1, u2] : [u2, u1];
  const existing = await prisma.chatRoom.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) return existing;
  return prisma.chatRoom.create({ data: { userAId, userBId } });
}
