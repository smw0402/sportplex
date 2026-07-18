"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  checkPassword,
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/auth";

export async function signupAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "STUDENT");
  const sport = String(formData.get("sport") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const school = String(formData.get("school") ?? "").trim() || null;
  const team = String(formData.get("team") ?? "").trim() || null;

  // 약관 동의 (체크박스는 체크된 경우에만 전송됨)
  const agreeAge = formData.get("agreeAge") != null;
  const agreeTerms = formData.get("agreeTerms") != null;
  const agreePrivacy = formData.get("agreePrivacy") != null;
  const marketingOptIn = formData.get("marketing") != null;

  if (!email || !password || !name) {
    return { error: "이메일, 비밀번호, 이름을 모두 입력해주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (!agreeAge || !agreeTerms || !agreePrivacy) {
    return { error: "필수 약관(만 14세 이상·이용약관·개인정보)에 모두 동의해주세요." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "이미 가입된 이메일입니다." };

  const user = await prisma.user.create({
    data: {
      email,
      name,
      nickname,
      role,
      sport,
      region,
      school,
      team,
      password: await hashPassword(password),
      agreedAt: new Date(), // 필수 동의 이력
      marketingOptIn,
    },
  });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const remember = formData.get("remember") != null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.password))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  if (user.suspended) {
    return { error: "이용이 정지된 계정입니다. 고객센터로 문의해주세요." };
  }
  // 탈퇴한 계정: 30일 내면 재로그인으로 복구, 이후면 차단
  if (user.deletedAt) {
    const days = (Date.now() - user.deletedAt.getTime()) / 86_400_000;
    if (days > 30) return { error: "탈퇴 처리된 계정입니다. 새로 가입해주세요." };
    await prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });
  }
  await createSession(user.id, remember);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// 가입 직후 온보딩 — 역할·종목·지역 관심사 저장
export async function saveOnboardingAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const role = String(formData.get("role") ?? user.role);
  const sport = String(formData.get("sport") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;

  await prisma.user.update({
    where: { id: user.id },
    data: { role, sport, region },
  });
  redirect("/");
}

// 회원 탈퇴 — 관련 데이터(글·댓글·채팅 등)는 Prisma cascade로 함께 삭제됨
export async function deleteAccountAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const isSocial = !!user.kakaoId && user.email.endsWith("@kakao.local");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (isSocial) {
    // 카카오 등 소셜 전용 계정은 비밀번호가 없으므로 확인 문구로 검증
    if (confirm !== "탈퇴") return { error: '확인란에 "탈퇴"를 정확히 입력해주세요.' };
  } else {
    if (!password || !(await checkPassword(password, user.password))) {
      return { error: "비밀번호가 올바르지 않습니다." };
    }
  }

  // 마지막 관리자 계정은 실수로 삭제되지 않도록 보호
  if (user.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      return { error: "마지막 관리자 계정은 탈퇴할 수 없습니다. 다른 관리자를 먼저 지정하세요." };
    }
  }

  // 소프트 삭제: 즉시 로그아웃·비공개 처리, 30일간 보관 후 완전 삭제(그 전 재로그인 시 복구)
  await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });
  await destroySession();
  redirect("/?left=1");
}
