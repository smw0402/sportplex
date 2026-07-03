import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel, displayName } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { getChatUnread } from "@/lib/chatUnread";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [rooms, unread] = await Promise.all([
    prisma.chatRoom.findMany({
      where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
      include: {
        userA: true,
        userB: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    getChatUnread(me.id),
  ]);

  rooms.sort((a, b) => {
    const ta = a.messages[0]?.createdAt ?? a.createdAt;
    const tb = b.messages[0]?.createdAt ?? b.createdAt;
    return tb.getTime() - ta.getTime();
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-extrabold">💌 채팅</h1>

      <div className="card divide-y divide-gray-100">
        {rooms.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">
            아직 대화가 없어요. 모집공고에서 제안을 수락하거나,
            <br />
            프로필에서 메시지를 보내 대화를 시작해보세요.
          </div>
        )}
        {rooms.map((room) => {
          const other = room.userAId === me.id ? room.userB : room.userA;
          const last = room.messages[0];
          const nUnread = unread.perRoom.get(room.id) ?? 0;
          return (
            <Link key={room.id} href={`/chat/${room.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <div className="relative shrink-0">
                <Avatar name={displayName(other)} src={other.avatar} sport={other.sport} size={48} />
                {nUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {nUnread > 99 ? "99+" : nUnread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`truncate ${nUnread > 0 ? "font-extrabold" : "font-semibold"}`}>
                    {displayName(other)}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      {roleLabel(other.role)}
                    </span>
                  </p>
                  {last && (
                    <span className="shrink-0 text-xs text-gray-400">{timeAgo(last.createdAt)}</span>
                  )}
                </div>
                <p className={`mt-0.5 truncate text-sm ${nUnread > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                  {last
                    ? `${last.senderId === me.id ? "나: " : ""}${last.content}`
                    : "대화를 시작해보세요"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
