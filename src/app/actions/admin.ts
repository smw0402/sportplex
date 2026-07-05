"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

// 회원 이용 정지 / 해제
export async function setUserSuspendAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "1";
  if (!userId || userId === admin.id) return; // 본인은 정지 불가
  await prisma.user.update({ where: { id: userId }, data: { suspended: suspend } });
  revalidatePath("/admin/members");
  revalidatePath(`/u/${userId}`);
}

// 인증 지도자 뱃지 부여 / 해제
export async function setUserVerifiedAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const userId = String(formData.get("userId") ?? "");
  const verified = String(formData.get("verified") ?? "") === "1";
  if (!userId) return;
  await prisma.user.update({ where: { id: userId }, data: { verified } });
  revalidatePath("/admin/members");
  revalidatePath(`/u/${userId}`);
}
