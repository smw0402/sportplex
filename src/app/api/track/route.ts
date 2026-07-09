import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { botLike } from "@/lib/botActivity";

// 접속·유입 로그 기록 (클라이언트 비콘)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = String(body?.path ?? "").slice(0, 300);
    const referrer = body?.referrer ? String(body.referrer).slice(0, 500) : null;
    if (!path) return NextResponse.json({ ok: false });

    const user = await getCurrentUser().catch(() => null);
    await prisma.accessLog.create({
      data: { path, referrer, userId: user?.id ?? null },
    });

    // 실제 방문 트래픽에 얹어 무작위 시점에 데모 계정 좋아요 1건 (약 7% 확률)
    if (Math.random() < 0.07) {
      await botLike(1).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
