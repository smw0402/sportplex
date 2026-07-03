import { NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID, saveChallenge } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();

  // 이메일이 있으면 해당 계정의 패스키만 허용(allowCredentials), 없으면 디스커버러블 패스키
  let allowCredentials:
    | { id: string; transports?: AuthenticatorTransportFuture[] }[]
    | undefined;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });
    if (!user || user.credentials.length === 0) {
      return NextResponse.json(
        { error: "이 이메일로 등록된 패스키가 없어요. 비밀번호로 로그인 후 등록해주세요." },
        { status: 404 }
      );
    }
    allowCredentials = user.credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports ? JSON.parse(c.transports) : undefined,
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials,
  });

  await saveChallenge(options.challenge);
  return NextResponse.json(options);
}
