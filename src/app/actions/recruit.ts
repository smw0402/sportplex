"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateRoom } from "@/lib/chat";
import { isClient, displayName } from "@/lib/constants";
import { notify } from "@/lib/notify";
import { sendUserEmail, emailLayout } from "@/lib/email";
import { headers } from "next/headers";

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sportplex-phi.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function createRecruitmentAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  if (!isClient(user.role)) {
    return { error: "모집공고는 학생·학부모 계정만 작성할 수 있어요." };
  }

  const sport = String(formData.get("sport") ?? "").trim();
  const serviceType = String(formData.get("serviceType") ?? "LESSON");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim() || null;
  const budget = String(formData.get("budget") ?? "").trim() || null;

  if (!sport || !title || !content) return { error: "종목, 제목, 내용을 입력해주세요." };

  const r = await prisma.recruitment.create({
    data: { sport, serviceType, title, content, region, budget, authorId: user.id },
  });
  redirect(`/recruit/${r.id}`);
}

// 모집공고 하트 (사용자당 1회 토글)
export async function toggleRecruitHeartAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const recruitmentId = String(formData.get("recruitmentId") ?? "");
  if (!recruitmentId) return;

  const existing = await prisma.recruitmentLike.findUnique({
    where: { recruitmentId_userId: { recruitmentId, userId: user.id } },
  });
  if (existing) {
    await prisma.recruitmentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.recruitmentLike.create({ data: { recruitmentId, userId: user.id } });
  }
  revalidatePath(`/recruit/${recruitmentId}`);
  revalidatePath("/recruit");
}

export async function createProposalAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const recruitmentId = String(formData.get("recruitmentId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim() || null;
  if (!recruitmentId || !message) return { error: "제안 내용을 입력해주세요." };

  const recruit = await prisma.recruitment.findUnique({ where: { id: recruitmentId } });
  if (!recruit) return { error: "존재하지 않는 공고입니다." };
  if (recruit.authorId === user.id) return { error: "본인 공고에는 제안할 수 없습니다." };

  await prisma.proposal.create({
    data: { recruitmentId, proposerId: user.id, message, price },
  });
  // 상담/레슨 요청에 제안 도착 → 공고 작성자에게 알림
  await notify({
    userId: recruit.authorId,
    actorId: user.id,
    type: "PROPOSAL",
    message: `${displayName(user)}님이 "${recruit.title}" 공고에 제안을 보냈어요.`,
    link: `/recruit/${recruitmentId}`,
  });
  await sendUserEmail(
    recruit.authorId,
    `[Sportplex] "${recruit.title}" 공고에 새 제안이 도착했어요`,
    emailLayout(
      "새 제안이 도착했어요 📩",
      `${displayName(user)}님이 회원님의 모집공고 <b>"${recruit.title}"</b>에 제안을 보냈습니다. 지금 확인하고 상담을 시작해보세요.`,
      "제안 확인하기",
      `${await siteOrigin()}/recruit/${recruitmentId}`
    )
  );
  revalidatePath(`/recruit/${recruitmentId}`);
  return { ok: true };
}

export async function acceptProposalAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const proposalId = String(formData.get("proposalId") ?? "");

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { recruitment: true },
  });
  if (!proposal || proposal.recruitment.authorId !== user.id) return;

  await prisma.$transaction([
    prisma.proposal.update({ where: { id: proposalId }, data: { status: "ACCEPTED" } }),
    prisma.recruitment.update({
      where: { id: proposal.recruitmentId },
      data: { status: "MATCHED" },
    }),
  ]);

  // 매칭되면 바로 채팅방 생성 후 이동
  const room = await getOrCreateRoom(user.id, proposal.proposerId);
  await notify({
    userId: proposal.proposerId,
    actorId: user.id,
    type: "MATCH",
    message: `${displayName(user)}님이 제안을 수락했어요! 채팅으로 상담을 시작하세요. 🤝`,
    link: `/chat/${room.id}`,
  });
  await sendUserEmail(
    proposal.proposerId,
    "[Sportplex] 제안이 수락되어 매칭되었어요 🤝",
    emailLayout(
      "매칭 성사! 🤝",
      `${displayName(user)}님이 회원님의 제안을 수락했어요. 이제 채팅으로 상담을 시작할 수 있습니다.`,
      "채팅으로 이동",
      `${await siteOrigin()}/chat/${room.id}`
    )
  );
  redirect(`/chat/${room.id}`);
}

export async function rejectProposalAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { recruitment: true },
  });
  if (!proposal || proposal.recruitment.authorId !== user.id) return;
  await prisma.proposal.update({ where: { id: proposalId }, data: { status: "REJECTED" } });
  revalidatePath(`/recruit/${proposal.recruitmentId}`);
}

export async function closeRecruitmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("recruitmentId") ?? "");
  const r = await prisma.recruitment.findUnique({ where: { id } });
  if (!r || r.authorId !== user.id) return;
  await prisma.recruitment.update({ where: { id }, data: { status: "CLOSED" } });
  revalidatePath(`/recruit/${id}`);
}
