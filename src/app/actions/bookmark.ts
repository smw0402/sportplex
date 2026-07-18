"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const TYPES = ["USER", "POST", "RECRUITMENT"];

export async function toggleBookmarkAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  if (!TYPES.includes(targetType) || !targetId) return { error: "잘못된 요청입니다." };
  if (targetType === "USER" && targetId === user.id) return { error: "본인은 찜할 수 없어요." };

  const existing = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, targetType, targetId } });
  }
  revalidatePath("/saved");
  return { ok: true, saved: !existing };
}
