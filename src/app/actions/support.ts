"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// 공개 1:1 문의 접수
export async function createInquiryAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim() || user?.name || "";
  const email = String(formData.get("email") ?? "").trim() || user?.email || "";
  const category = String(formData.get("category") ?? "GENERAL");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email) return { error: "이름과 이메일을 입력해주세요." };
  if (!subject || !message) return { error: "제목과 내용을 입력해주세요." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "이메일 형식이 올바르지 않습니다." };

  await prisma.inquiry.create({
    data: { userId: user?.id ?? null, name, email, category, subject, message },
  });
  revalidatePath("/support");
  return { ok: true };
}
