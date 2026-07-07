import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { displayName } from "@/lib/constants";
import { won } from "@/lib/format";

// 결제 승인/취소 (안전결제 데모). action: pay | cancel
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (payment.payerId !== user.id && payment.payeeId !== user.id)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (payment.status !== "REQUESTED")
    return NextResponse.json({ error: "not_requested" }, { status: 400 });

  if (action === "pay") {
    // 결제는 payer(결제하는 사람)만 가능
    if (payment.payerId !== user.id)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const updated = await prisma.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await notify({
      userId: payment.payeeId,
      actorId: user.id,
      type: "MESSAGE",
      message: `${displayName(user)}님이 ${won(payment.amount)} 결제를 완료했어요. ✅`,
      link: payment.roomId ? `/chat/${payment.roomId}` : "/chat",
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  if (action === "cancel") {
    const updated = await prisma.payment.update({
      where: { id },
      data: { status: "CANCELED" },
    });
    const other = payment.payerId === user.id ? payment.payeeId : payment.payerId;
    await notify({
      userId: other,
      actorId: user.id,
      type: "MESSAGE",
      message: `${displayName(user)}님이 ${won(payment.amount)} 결제 요청을 취소했어요.`,
      link: payment.roomId ? `/chat/${payment.roomId}` : "/chat",
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
