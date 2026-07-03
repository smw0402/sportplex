import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel } from "@/lib/constants";
import Avatar from "@/components/Avatar";
import ChatRoom from "./ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const room = await prisma.chatRoom.findUnique({
    where: { id },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!room) notFound();
  if (room.userAId !== me.id && room.userBId !== me.id) notFound();

  // 방을 열면 읽음 처리
  await prisma.chatRoom.update({
    where: { id: room.id },
    data: room.userAId === me.id ? { lastReadAAt: new Date() } : { lastReadBAt: new Date() },
  });

  const other = room.userAId === me.id ? room.userB : room.userA;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "calc(100vh - 9rem)" }}>
      {/* 헤더 */}
      <div className="card sticky top-16 z-10 mb-3 flex items-center gap-3 p-3">
        <Link href="/chat" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <Link href={`/u/${other.id}`} className="flex items-center gap-2.5">
          <Avatar name={other.name} src={other.avatar} sport={other.sport} size={40} />
          <div>
            <p className="font-semibold leading-tight">{other.name}</p>
            <p className="text-xs text-gray-400">
              {roleLabel(other.role)}
              {other.sport && ` · ${other.sport}`}
            </p>
          </div>
        </Link>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> 실시간
        </span>
      </div>

      <ChatRoom
        roomId={room.id}
        meId={me.id}
        initialMessages={room.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
