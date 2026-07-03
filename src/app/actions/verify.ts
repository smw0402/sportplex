"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProvider } from "@/lib/constants";

// 코치/감독/레슨선생님이 인증 신청
export async function submitVerificationAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  if (!isProvider(user.role)) {
    return { error: "지도자(코치·감독·레슨선생님) 계정만 인증 신청할 수 있어요." };
  }
  if (user.verified) return { error: "이미 인증된 지도자입니다." };

  const realName = String(formData.get("realName") ?? "").trim() || null;
  const credential = String(formData.get("credential") ?? "").trim();
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim() || null;
  if (!credential) return { error: "자격·경력 증빙 내용을 입력해주세요." };

  const pending = await prisma.verificationRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (pending) return { error: "이미 심사 대기 중인 신청이 있어요." };

  await prisma.verificationRequest.create({
    data: { userId: user.id, realName, credential, evidenceUrl },
  });
  revalidatePath("/verify");
  return { ok: true };
}

// ── 관리자 전용 ──
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return user;
}

export async function approveVerificationAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("requestId") ?? "");
  const req = await prisma.verificationRequest.findUnique({ where: { id } });
  if (!req) return;

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    prisma.user.update({ where: { id: req.userId }, data: { verified: true } }),
  ]);
  revalidatePath("/admin");
  revalidatePath(`/u/${req.userId}`);
}

export async function rejectVerificationAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("requestId") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim() || null;
  const req = await prisma.verificationRequest.findUnique({ where: { id } });
  if (!req) return;

  await prisma.verificationRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewNote: note, reviewedAt: new Date() },
  });
  revalidatePath("/admin");
}
