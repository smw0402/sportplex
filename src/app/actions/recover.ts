"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail, emailConfigured } from "@/lib/email";

async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sportplex-phi.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function maskEmail(email: string) {
  if (email.endsWith("@kakao.local")) return "카카오 계정 (카카오로 로그인)";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

// 아이디(가입 이메일) 찾기 — 이름으로 조회 후 마스킹해서 안내
export async function findEmailAction(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "이름을 입력해주세요." };

  const users = await prisma.user.findMany({
    where: { name, deletedAt: null },
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  return {
    ok: true,
    emails: users.map((u) => ({
      masked: maskEmail(u.email),
      joined: u.createdAt.toLocaleDateString("ko-KR"),
    })),
  };
}

// 비밀번호 재설정 요청 — 가입 이메일로 재설정 링크 발송
export async function requestPasswordResetAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "이메일을 입력해주세요." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "이메일 형식이 올바르지 않습니다." };

  if (!emailConfigured()) {
    return {
      error:
        "비밀번호 재설정 메일 발송이 아직 설정되지 않았어요. 잠시 후 다시 시도하거나 1:1 문의로 알려주세요.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 계정 존재 여부는 노출하지 않고, 존재할 때만 실제 발송
  if (user && !user.email.endsWith("@kakao.local")) {
    const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
    });
    const link = `${await siteUrl()}/reset/${token}`;
    await sendEmail({
      to: email,
      subject: "[Sportplex] 비밀번호 재설정 안내",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1b5cf5">Sportplex 비밀번호 재설정</h2>
          <p>아래 버튼을 눌러 새 비밀번호를 설정하세요. 이 링크는 <b>30분간</b> 유효합니다.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#1b5cf5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">비밀번호 재설정하기</a>
          </p>
          <p style="color:#888;font-size:13px">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          <p style="color:#aaa;font-size:12px">${link}</p>
        </div>`,
    });
  }

  return { ok: true };
}

// 새 비밀번호 설정 (토큰 검증)
export async function resetPasswordAction(_prev: unknown, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!token) return { error: "잘못된 접근입니다." };
  if (password.length < 6) return { error: "비밀번호는 6자 이상이어야 합니다." };
  if (password !== confirm) return { error: "비밀번호가 일치하지 않습니다." };

  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: "만료되었거나 이미 사용된 링크입니다. 재설정을 다시 요청해주세요." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { password: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
