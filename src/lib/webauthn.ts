import { cookies } from "next/headers";

// 개발: localhost (Touch ID 동작) / 배포: 환경변수로 도메인 지정
export const rpName = "Sportplex";
export const rpID = process.env.WEBAUTHN_RP_ID ?? "localhost";
export const origin = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";

const CHALLENGE_COOKIE = "sportplex_webauthn_challenge";

// 옵션 발급 ~ 검증 사이에 챌린지를 잠시 보관 (httpOnly 쿠키, 5분)
export async function saveChallenge(value: string) {
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
}

export async function readChallenge() {
  const jar = await cookies();
  return jar.get(CHALLENGE_COOKIE)?.value ?? null;
}

export async function clearChallenge() {
  const jar = await cookies();
  jar.delete(CHALLENGE_COOKIE);
}
