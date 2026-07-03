import { prisma } from "./prisma";

export type Rating = { avg: number; count: number };

// 여러 사용자의 평균 별점/개수를 한 번에 집계
export async function getRatings(userIds: string[]): Promise<Map<string, Rating>> {
  const map = new Map<string, Rating>();
  if (userIds.length === 0) return map;
  const rows = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetId: { in: userIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  for (const r of rows) {
    map.set(r.targetId, {
      avg: Math.round((r._avg.rating ?? 0) * 10) / 10,
      count: r._count.rating,
    });
  }
  return map;
}

export async function getRating(userId: string): Promise<Rating> {
  return (await getRatings([userId])).get(userId) ?? { avg: 0, count: 0 };
}

// 매칭(ACCEPTED 제안)에서 viewer가 상대방에게 후기를 쓸 수 있는지 판단.
// 성사된 제안의 두 당사자(공고 작성자 ↔ 제안자)끼리만 상호 작성 가능.
export function reviewTargetFor(
  proposal: { status: string; proposerId: string; recruitment: { authorId: string } },
  viewerId: string
): string | null {
  if (proposal.status !== "ACCEPTED") return null;
  const author = proposal.recruitment.authorId;
  const proposer = proposal.proposerId;
  if (viewerId === author) return proposer;
  if (viewerId === proposer) return author;
  return null;
}
