"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewTargetFor } from "@/lib/reviews";

export async function createReviewAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const proposalId = String(formData.get("proposalId") ?? "");
  const rating = parseInt(String(formData.get("rating") ?? ""), 10);
  const content = String(formData.get("content") ?? "").trim();

  if (!proposalId) return { error: "잘못된 요청입니다." };
  if (!(rating >= 1 && rating <= 5)) return { error: "별점을 선택해주세요." };
  if (!content) return { error: "후기 내용을 입력해주세요." };

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { recruitment: true },
  });
  if (!proposal) return { error: "존재하지 않는 매칭입니다." };

  // 매칭 성사(ACCEPTED)된 두 당사자만 상호 작성 가능
  const targetId = reviewTargetFor(proposal, user.id);
  if (!targetId) {
    return { error: "매칭이 성사된 상대에게만 후기를 남길 수 있어요." };
  }

  // 한 매칭당 1회만
  const existing = await prisma.review.findUnique({
    where: { proposalId_authorId: { proposalId, authorId: user.id } },
  });
  if (existing) return { error: "이미 이 매칭에 후기를 남겼어요." };

  await prisma.review.create({
    data: { proposalId, authorId: user.id, targetId, rating, content },
  });

  revalidatePath(`/recruit/${proposal.recruitmentId}`);
  revalidatePath(`/u/${targetId}`);
  return { ok: true };
}
