import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// 클라이언트 오류 경계에서 발생한 에러 기록
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "알 수 없는 오류").slice(0, 1000);
    const stack = body?.stack ? String(body.stack).slice(0, 8000) : null;
    const path = body?.path ? String(body.path).slice(0, 300) : null;
    const digest = body?.digest ? String(body.digest).slice(0, 100) : null;

    const user = await getCurrentUser().catch(() => null);

    // 같은 메시지+경로가 최근 1분 내 이미 있으면 중복 방지
    const oneMinAgo = new Date(Date.now() - 60_000);
    const dup = await prisma.errorLog.findFirst({
      where: { message, path, createdAt: { gte: oneMinAgo } },
    });
    if (!dup) {
      await prisma.errorLog.create({
        data: { message, stack, path, digest, userId: user?.id ?? null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
