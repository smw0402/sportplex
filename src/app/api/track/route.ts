import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
