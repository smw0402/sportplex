import { NextResponse } from "next/server";
import { kakaoAuthUrl, kakaoConfigured } from "@/lib/kakao";

// 카카오 로그인 시작 → 카카오 인증 페이지로 이동
export async function GET(req: Request) {
  if (!kakaoConfigured()) {
    return NextResponse.redirect(new URL("/login?error=kakao_config", req.url));
  }
  // redirect_uri는 등록값과 정확히 일치해야 하므로 환경변수로 고정 가능(없으면 요청 주소 기준)
  const redirectUri =
    process.env.KAKAO_REDIRECT_URI ?? new URL("/api/auth/kakao/callback", req.url).toString();
  return NextResponse.redirect(kakaoAuthUrl(redirectUri));
}
