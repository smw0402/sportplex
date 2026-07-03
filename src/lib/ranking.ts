// 스포렉스 점수 = 별점·후기수·매칭수·인증여부 가중 합산
export function sportplexScore(input: {
  avg: number;
  reviewCount: number;
  matchCount: number;
  verified: boolean;
}) {
  return Math.round(
    input.avg * 10 + input.reviewCount * 4 + input.matchCount * 6 + (input.verified ? 15 : 0)
  );
}

export const RANK_MEDAL = ["🥇", "🥈", "🥉"];
