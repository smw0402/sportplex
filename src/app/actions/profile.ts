"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateRoom } from "@/lib/chat";
import { notify } from "@/lib/notify";
import { displayName } from "@/lib/constants";

export async function updateProfileAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const sport = String(formData.get("sport") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const avatar = String(formData.get("avatar") ?? "").trim() || null;
  const cover = String(formData.get("cover") ?? "").trim() || null;
  if (!name) return { error: "이름을 입력해주세요." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, nickname, sport, region, bio, avatar, cover },
  });
  redirect(`/u/${user.id}`);
}

export async function addCareerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const org = String(formData.get("org") ?? "").trim() || null;
  const startYear = parseInt(String(formData.get("startYear") ?? ""), 10);
  const endYear = parseInt(String(formData.get("endYear") ?? ""), 10);
  const detail = String(formData.get("detail") ?? "").trim() || null;

  await prisma.career.create({
    data: {
      userId: user.id,
      title,
      org,
      detail,
      startYear: Number.isNaN(startYear) ? null : startYear,
      endYear: Number.isNaN(endYear) ? null : endYear,
    },
  });
  revalidatePath("/profile/edit");
}

export async function deleteCareerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("careerId") ?? "");
  const career = await prisma.career.findUnique({ where: { id } });
  if (!career || career.userId !== user.id) return;
  await prisma.career.delete({ where: { id } });
  revalidatePath("/profile/edit");
}

export async function deleteCredentialAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("credentialId") ?? "");
  const cred = await prisma.credential.findUnique({ where: { id } });
  if (!cred || cred.userId !== user.id) return;
  await prisma.credential.delete({ where: { id } });
  revalidatePath("/profile/edit");
}

export async function startChatAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId || targetId === user.id) return;
  const room = await getOrCreateRoom(user.id, targetId);

  // 상담요청 알림 (같은 방에 안 읽은 상담 알림이 없을 때만)
  const dup = await prisma.notification.findFirst({
    where: { userId: targetId, type: "CONSULT", link: `/chat/${room.id}`, read: false },
  });
  if (!dup) {
    await notify({
      userId: targetId,
      actorId: user.id,
      type: "CONSULT",
      message: `${displayName(user)}님이 상담을 요청했어요. 📩`,
      link: `/chat/${room.id}`,
    });
  }
  redirect(`/chat/${room.id}`);
}
