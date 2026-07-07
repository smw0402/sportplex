// 카카오 로그인(OAuth) 헬퍼
// 필요한 환경변수: KAKAO_REST_API_KEY (필수), KAKAO_CLIENT_SECRET (선택)
// 카카오 개발자 콘솔에 Redirect URI로 `<사이트주소>/api/auth/kakao/callback` 등록 필요

export function kakaoConfigured() {
  return !!process.env.KAKAO_REST_API_KEY;
}

export function kakaoAuthUrl(redirectUri: string) {
  const p = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile_nickname account_email",
  });
  return `https://kauth.kakao.com/oauth/authorize?${p.toString()}`;
}

export async function kakaoExchange(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: redirectUri,
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  if (!res.ok) throw new Error("kakao token exchange failed");
  return (await res.json()) as { access_token: string };
}

type KakaoProfile = {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string; profile_image_url?: string };
  };
};

export async function kakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("kakao profile fetch failed");
  return (await res.json()) as KakaoProfile;
}
