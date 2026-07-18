import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { kakaoConfigured, kakaoExchange, kakaoProfile } from "@/lib/kakao";

// 카카오 인증 콜백 → 토큰 교환 → 회원 조회/생성 → 세션 발급
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code || !kakaoConfigured()) {
    return NextResponse.redirect(new URL("/login?error=kakao", req.url));
  }

  try {
    // 토큰 교환 시 redirect_uri는 authorize 때와 동일해야 함(고정값 우선)
    const redirectUri =
      process.env.KAKAO_REDIRECT_URI ?? new URL("/api/auth/kakao/callback", req.url).toString();
    const { access_token } = await kakaoExchange(code, redirectUri);
    const profile = await kakaoProfile(access_token);

    const kakaoId = String(profile.id);
    const account = profile.kakao_account ?? {};
    const email = account.email ? account.email.toLowerCase() : null;
    const nickname = account.profile?.nickname?.trim() || "카카오사용자";
    const avatar = account.profile?.profile_image_url || null;

    // 1) 카카오ID로 기존 연동 회원 찾기
    let user = await prisma.user.findUnique({ where: { kakaoId } });

    // 2) 없으면 이메일로 기존 회원 찾아 연동
    if (!user && email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        user = await prisma.user.update({ where: { id: byEmail.id }, data: { kakaoId } });
      }
    }

    // 3) 그래도 없으면 신규 가입
    let isNew = false;
    if (!user) {
      isNew = true;
      const finalEmail = email ?? `kakao_${kakaoId}@kakao.local`;
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: nickname,
          nickname,
          kakaoId,
          avatar,
          password: await hashPassword(randomUUID()),
          agreedAt: new Date(), // 카카오 로그인 = 약관·개인정보 동의 간주
        },
      });
    }

    if (user.suspended) {
      return NextResponse.redirect(new URL("/login?error=suspended", req.url));
    }
    // 탈퇴한 계정이면 재로그인으로 복구
    if (user.deletedAt) {
      await prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });
    }

    await createSession(user.id, true);
    // 신규 가입자는 온보딩으로
    return NextResponse.redirect(new URL(isNew ? "/onboarding" : "/", req.url));
  } catch (e) {
    // 실패 원인을 관리자 오류 로그에 상세 기록 (카카오 응답 본문 포함)
    const message = e instanceof Error ? e.message : "kakao login failed";
    await prisma.errorLog
      .create({ data: { message: `[KAKAO] ${message}`, path: "/api/auth/kakao/callback" } })
      .catch(() => {});
    return NextResponse.redirect(new URL("/login?error=kakao", req.url));
  }
}
