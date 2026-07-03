import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rpID, origin, readChallenge, clearChallenge } from "@/lib/webauthn";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const response = body?.response;
  const deviceName = String(body?.deviceName ?? "").trim() || null;
  const expectedChallenge = await readChallenge();
  if (!response || !expectedChallenge) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "검증 실패" },
      { status: 400 }
    );
  }

  await clearChallenge();

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "패스키 등록에 실패했어요." }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  await prisma.credential.create({
    data: {
      userId: user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
      deviceName,
    },
  });

  return NextResponse.json({ ok: true });
}
