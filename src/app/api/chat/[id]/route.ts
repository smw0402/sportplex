import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { displayName } from "@/lib/constants";
import { won } from "@/lib/format";

async function ensureMember(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return null;
  if (room.userAId !== userId && room.userBId !== userId) return null;
  return room;
}

type MsgWithPayment = {
  id: string;
  senderId: string;
  content: string;
  kind: string;
  createdAt: Date;
  payment: {
    id: string;
    amount: number;
    status: string;
    payerId: string;
    payeeId: string;
    memo: string | null;
  } | null;
};

function serialize(m: MsgWithPayment) {
  return {
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    kind: m.kind,
    createdAt: m.createdAt.toISOString(),
    payment: m.payment
      ? {
          id: m.payment.id,
          amount: m.payment.amount,
          status: m.payment.status,
          payerId: m.payment.payerId,
          payeeId: m.payment.payeeId,
          memo: m.payment.memo,
        }
      : null,
  };
}

// 새 메시지 폴링 (?since=ISO 이후의 메시지만). 결제 메시지는 상태가 변하므로 최근 건도 함께 갱신
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await ensureMember(id, user.id)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const since = new URL(req.url).searchParams.get("since");
  const messages = await prisma.message.findMany({
    where: { roomId: id, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
    orderBy: { createdAt: "asc" },
    include: { payment: true },
  });

  // 결제 상태가 바뀌었을 수 있으니 결제 메시지는 항상 최신 상태를 함께 내려줌
  const paymentMsgs = since
    ? await prisma.message.findMany({
        where: { roomId: id, kind: "PAYMENT" },
        orderBy: { createdAt: "asc" },
        include: { payment: true },
      })
    : [];

  return NextResponse.json({
    messages: messages.map(serialize),
    payments: paymentMsgs.map(serialize),
  });
}

// 메시지 전송 (텍스트 또는 결제 요청)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const room = await ensureMember(id, user.id);
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind ?? "TEXT");
  const otherId = room.userAId === user.id ? room.userBId : room.userAId;

  // ── 결제 요청 (보낸 사람 = 정산받는 payee, 상대 = 결제하는 payer) ──
  if (kind === "PAYMENT") {
    const amount = Math.floor(Number(body?.amount));
    const memo = String(body?.memo ?? "").trim() || null;
    if (!Number.isFinite(amount) || amount < 1000 || amount > 10_000_000)
      return NextResponse.json({ error: "amount" }, { status: 400 });

    const payment = await prisma.payment.create({
      data: {
        roomId: id,
        payeeId: user.id,
        payerId: otherId,
        amount,
        memo,
        status: "REQUESTED",
        method: "가상결제",
      },
    });
    const m = await prisma.message.create({
      data: {
        roomId: id,
        senderId: user.id,
        kind: "PAYMENT",
        paymentId: payment.id,
        content: `💳 ${won(amount)} 결제 요청${memo ? ` · ${memo}` : ""}`,
      },
      include: { payment: true },
    });
    await notify({
      userId: otherId,
      actorId: user.id,
      type: "MESSAGE",
      message: `${displayName(user)}님이 ${won(amount)} 결제를 요청했어요. 💳`,
      link: `/chat/${id}`,
    });
    return NextResponse.json({ message: serialize(m) });
  }

  // ── 일반 텍스트 ──
  const content = String(body?.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "empty" }, { status: 400 });

  const m = await prisma.message.create({
    data: { roomId: id, senderId: user.id, content },
    include: { payment: true },
  });

  // 상대에게 알림 (안 읽은 메시지 알림이 없을 때만 → 도배 방지)
  const dup = await prisma.notification.findFirst({
    where: { userId: otherId, type: "MESSAGE", link: `/chat/${id}`, read: false },
  });
  if (!dup) {
    await notify({
      userId: otherId,
      actorId: user.id,
      type: "MESSAGE",
      message: `${displayName(user)}님이 새 메시지를 보냈어요.`,
      link: `/chat/${id}`,
    });
  }

  return NextResponse.json({ message: serialize(m) });
}
