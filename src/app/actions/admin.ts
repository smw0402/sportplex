"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

const ROLE_KEYS = ROLES.map((r) => r.key);

// 관리자가 임의로 계정 생성 (마케팅/데모용)
export async function createUserAction(_prev: unknown, formData: FormData) {
  if (!(await requireAdmin())) return { error: "권한이 없습니다." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "STUDENT");
  const sport = String(formData.get("sport") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const verified = formData.get("verified") != null;
  const isAdmin = formData.get("isAdmin") != null;

  if (!email || !password || !name) {
    return { error: "이메일·비밀번호·이름은 필수입니다." };
  }
  if (password.length < 6) return { error: "비밀번호는 6자 이상이어야 합니다." };
  if (!ROLE_KEYS.includes(role as never)) return { error: "역할이 올바르지 않습니다." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "이미 가입된 이메일입니다." };

  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name,
      nickname,
      role,
      sport,
      region,
      bio,
      verified,
      isAdmin,
      agreedAt: new Date(),
    },
  });
  revalidatePath("/admin/members");
  return { ok: true, email: user.email };
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
