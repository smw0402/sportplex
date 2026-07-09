import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

// 탈퇴(소프트 삭제) 후 30일이 지난 계정을 완전 삭제 (관련 데이터 cascade)
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const targets = await prisma.user.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
  });

  let purged = 0;
  for (const t of targets) {
    await prisma.user.delete({ where: { id: t.id } }).catch(() => {});
    purged++;
  }

  return NextResponse.json({ ok: true, purged });
}
