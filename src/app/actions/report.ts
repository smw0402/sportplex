"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/constants";

const TARGET_TYPES = ["USER", "POST", "COMMENT", "RECRUITMENT"];

export async function createReportAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim() || null;

  if (!TARGET_TYPES.includes(targetType) || !targetId) return { error: "잘못된 신고 대상입니다." };
  if (!REPORT_REASONS.includes(reason as never)) return { error: "신고 사유를 선택해주세요." };
  if (targetType === "USER" && targetId === user.id) {
    return { error: "본인은 신고할 수 없어요." };
  }

  // 동일 대상 중복 신고 방지(대기중 건이 있으면)
  const dup = await prisma.report.findFirst({
    where: { reporterId: user.id, targetType, targetId, status: "PENDING" },
  });
  if (dup) return { error: "이미 신고하여 처리 대기중이에요." };

  await prisma.report.create({
    data: { reporterId: user.id, targetType, targetId, reason, detail },
  });
  return { ok: true };
}

// ── 관리자 전용 ──
async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export async function resolveReportAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("reportId") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim() || null;
  await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED", adminNote: note, resolvedAt: new Date() },
  });
  revalidatePath("/admin");
}

export async function dismissReportAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("reportId") ?? "");
  await prisma.report.update({
    where: { id },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
  revalidatePath("/admin");
}

// 신고된 콘텐츠 삭제 + 해당 신고 해결 처리
export async function removeReportedContentAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("reportId") ?? "");
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return;

  try {
    if (report.targetType === "POST") {
      await prisma.post.delete({ where: { id: report.targetId } });
    } else if (report.targetType === "COMMENT") {
      await prisma.comment.delete({ where: { id: report.targetId } });
    } else if (report.targetType === "RECRUITMENT") {
      await prisma.recruitment.delete({ where: { id: report.targetId } });
    }
  } catch {
    /* 이미 삭제된 경우 무시 */
  }

  await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED", adminNote: "콘텐츠 삭제 처리", resolvedAt: new Date() },
  });
  revalidatePath("/admin");
}

// 회원 이용 정지 / 해제
export async function setSuspendAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "1";
  if (!userId || userId === admin.id) return;
  await prisma.user.update({ where: { id: userId }, data: { suspended: suspend } });
  revalidatePath("/admin");
  revalidatePath(`/u/${userId}`);
}
