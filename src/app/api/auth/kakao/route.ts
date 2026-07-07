import { NextResponse } from "next/server";
import { kakaoAuthUrl, kakaoConfigured } from "@/lib/kakao";

// 카카오 로그인 시작 → 카카오 인증 페이지로 이동
export async function GET(req: Request) {
  if (!kakaoConfigured()) {
    return NextResponse.redirect(new URL("/login?error=kakao_config", req.url));
  }
  const redirectUri = new URL("/api/auth/kakao/callback", req.url).toString();
  return NextResponse.redirect(kakaoAuthUrl(redirectUri));
}
