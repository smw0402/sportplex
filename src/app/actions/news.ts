"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export async function createNewsAction(_prev: unknown, formData: FormData) {
  if (!(await requireAdmin())) return { error: "권한이 없습니다." };

  const sport = String(formData.get("sport") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!sport || !title || !summary) {
    return { error: "종목, 헤드라인, 요약을 입력해주세요." };
  }

  await prisma.newsItem.create({ data: { sport, title, summary, body, source, imageUrl } });
  revalidatePath("/admin/news");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNewsAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("newsId") ?? "");
  await prisma.newsItem.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/news");
  revalidatePath("/");
}
