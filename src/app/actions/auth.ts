"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  checkPassword,
  createSession,
  destroySession,
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
  redirect(`/u/${user.id}`);
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
  await createSession(user.id, remember);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
