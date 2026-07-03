import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rpID, origin, readChallenge, clearChallenge } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const response = body?.response;
  const expectedChallenge = await readChallenge();
  if (!response?.id || !expectedChallenge) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 사용된 자격증명으로 사용자 식별
  const cred = await prisma.credential.findUnique({
    where: { credentialId: response.id },
    include: { user: true },
  });
  if (!cred) {
    return NextResponse.json({ error: "등록되지 않은 패스키입니다." }, { status: 404 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: cred.credentialId,
        publicKey: new Uint8Array(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "검증 실패" },
      { status: 400 }
    );
  }

  await clearChallenge();

  if (!verification.verified) {
    return NextResponse.json({ error: "인증에 실패했어요." }, { status: 400 });
  }

  // 카운터 갱신(복제 방지) 후 세션 발급
  await prisma.credential.update({
    where: { id: cred.id },
    data: { counter: verification.authenticationInfo.newCounter },
  });
  await createSession(cred.userId, true);

  return NextResponse.json({ ok: true });
}
