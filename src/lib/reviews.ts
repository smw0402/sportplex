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

// 아직 후기를 남기지 않은 성사 매칭 목록 (후기 리마인드용)
export async function getPendingReviews(userId: string) {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ proposerId: userId }, { recruitment: { authorId: userId } }],
    },
    include: {
      recruitment: { select: { id: true, title: true, authorId: true, author: { select: { name: true } } } },
      proposer: { select: { name: true } },
      reviews: { where: { authorId: userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return proposals
    .filter((p) => p.reviews.length === 0)
    .map((p) => ({
      recruitmentId: p.recruitment.id,
      title: p.recruitment.title,
      targetName: userId === p.recruitment.authorId ? p.proposer.name : p.recruitment.author.name,
    }));
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
