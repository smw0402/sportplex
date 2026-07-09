import { NextResponse } from "next/server";
import { botLike } from "@/lib/botActivity";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

// 데모(isBot) 계정 자동 좋아요 — 매 실행마다 무작위 개수 수행
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 무작위 개수(기본 3~14). ?n= 으로 상한 지정 가능
  const max = Math.max(1, Number(new URL(req.url).searchParams.get("n")) || 14);
  const count = 3 + Math.floor(Math.random() * Math.max(1, max - 2));
  const done = await botLike(count);

  return NextResponse.json({ ok: true, done });
}
