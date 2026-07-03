import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { displayName } from "@/lib/constants";

async function ensureMember(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return null;
  if (room.userAId !== userId && room.userBId !== userId) return null;
  return room;
}

// 새 메시지 폴링 (?since=ISO 이후의 메시지만)
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
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// 메시지 전송
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await ensureMember(id, user.id)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "empty" }, { status: 400 });

  const room = await ensureMember(id, user.id);
  const m = await prisma.message.create({
    data: { roomId: id, senderId: user.id, content },
  });

  // 상대에게 알림 (같은 방에 안 읽은 메시지 알림이 없을 때만 → 도배 방지)
  if (room) {
    const recipientId = room.userAId === user.id ? room.userBId : room.userAId;
    const dup = await prisma.notification.findFirst({
      where: { userId: recipientId, type: "MESSAGE", link: `/chat/${id}`, read: false },
    });
    if (!dup) {
      await notify({
        userId: recipientId,
        actorId: user.id,
        type: "MESSAGE",
        message: `${displayName(user)}님이 새 메시지를 보냈어요.`,
        link: `/chat/${id}`,
      });
    }
  }

  return NextResponse.json({
    message: {
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    },
  });
}
