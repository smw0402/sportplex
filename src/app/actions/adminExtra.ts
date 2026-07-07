"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

// ───────── 결제 관리 ─────────
export async function refundPaymentAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("paymentId") ?? "");
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status !== "PAID") return;
  await prisma.payment.update({ where: { id }, data: { status: "REFUNDED" } });
  await notify({
    userId: payment.payerId,
    type: "MESSAGE",
    message: `${payment.amount.toLocaleString("ko-KR")}원 결제가 환불 처리되었어요.`,
    link: payment.roomId ? `/chat/${payment.roomId}` : "/chat",
  });
  revalidatePath("/admin/payments");
}

// ───────── 1:1 문의 ─────────
export async function answerInquiryAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("inquiryId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  if (!id || !reply) return;
  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { reply, status: "ANSWERED", repliedAt: new Date() },
  });
  // 회원이면 알림
  if (inquiry.userId) {
    await notify({
      userId: inquiry.userId,
      type: "MESSAGE",
      message: `1:1 문의 "${inquiry.subject}"에 답변이 등록되었어요.`,
      link: "/support",
    });
  }
  revalidatePath("/admin/inquiries");
}

export async function closeInquiryAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("inquiryId") ?? "");
  if (!id) return;
  await prisma.inquiry.update({ where: { id }, data: { status: "CLOSED" } });
  revalidatePath("/admin/inquiries");
}

// ───────── 학교 DB ─────────
export async function createSchoolAction(_prev: unknown, formData: FormData) {
  if (!(await requireAdmin())) return { error: "권한이 없습니다." };
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "HIGH");
  const region = String(formData.get("region") ?? "").trim() || null;
  const sports = String(formData.get("sports") ?? "").trim() || null;
  const homepage = String(formData.get("homepage") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!name) return { error: "학교명을 입력하세요." };
  await prisma.school.create({ data: { name, category, region, sports, homepage, note } });
  revalidatePath("/admin/schools");
  return { ok: true, name };
}

export async function deleteSchoolAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("schoolId") ?? "");
  if (!id) return;
  await prisma.school.delete({ where: { id } });
  revalidatePath("/admin/schools");
}

// ───────── 홈 레이아웃 ─────────
export async function saveHomeLayoutAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const value = String(formData.get("layout") ?? "").trim();
  if (!value) return;
  await prisma.setting.upsert({
    where: { key: "home_layout" },
    create: { key: "home_layout", value },
    update: { value },
  });
  revalidatePath("/admin/layout");
  revalidatePath("/");
}

// ───────── 오류 로그 ─────────
export async function resolveErrorLogAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("logId") ?? "");
  const resolved = String(formData.get("resolved") ?? "1") === "1";
  if (!id) return;
  await prisma.errorLog.update({ where: { id }, data: { resolved } });
  revalidatePath("/admin/logs");
}

export async function clearResolvedLogsAction() {
  if (!(await requireAdmin())) return;
  await prisma.errorLog.deleteMany({ where: { resolved: true } });
  revalidatePath("/admin/logs");
}
