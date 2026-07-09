import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel, displayName } from "@/lib/constants";
import { levelOf } from "@/lib/level";
import { timeAgo } from "@/lib/format";
import { setUserSuspendAction, setUserVerifiedAction } from "@/app/actions/admin";
import Avatar from "@/components/Avatar";
import AdminNav from "@/components/AdminNav";
import AdminCreateUser from "@/components/AdminCreateUser";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const { q = "" } = await searchParams;
  const keyword = q.trim();

  const users = await prisma.user.findMany({
    where: keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { nickname: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const total = await prisma.user.count();

  return (
    <div className="space-y-5">
      <AdminNav active="members" />

      <AdminCreateUser />

      <div className="flex items-center justify-between">
        <h2 className="font-bold">👥 회원 {total}명</h2>
      </div>

      <form action="/admin/members" className="flex gap-2">
        <input
          name="q"
          defaultValue={keyword}
          className="input"
          placeholder="이름·닉네임·이메일 검색"
        />
        <button className="btn-primary shrink-0">검색</button>
      </form>

      <div className="card divide-y divide-gray-100">
        {users.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">회원이 없습니다.</p>
        )}
        {users.map((u) => {
          const lv = levelOf(u.points);
          const isMe = u.id === me.id;
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
              <Link href={`/u/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={displayName(u)} src={u.avatar} sport={u.sport} size={42} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {displayName(u)}
                    {u.verified && <span className="text-brand-500">✔</span>}
                    {u.isAdmin && <span className="chip bg-gray-900 text-white">ADMIN</span>}
                    {u.suspended && <span className="chip bg-red-100 text-red-600">정지</span>}
                    {u.deletedAt && <span className="chip bg-gray-200 text-gray-500">탈퇴</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {u.email} · {roleLabel(u.role)} · {lv.icon} Lv.{lv.level} · 가입 {timeAgo(u.createdAt)}
                  </p>
                </div>
              </Link>

              {!isMe && (
                <div className="flex shrink-0 gap-1.5">
                  {/* 인증 토글 */}
                  <form action={setUserVerifiedAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="verified" value={u.verified ? "0" : "1"} />
                    <button className="btn-outline !px-2.5 !py-1.5 text-xs">
                      {u.verified ? "인증 해제" : "인증"}
                    </button>
                  </form>
                  {/* 정지 토글 */}
                  <form action={setUserSuspendAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="suspend" value={u.suspended ? "0" : "1"} />
                    <button
                      className="btn !px-2.5 !py-1.5 text-xs text-white hover:opacity-90"
                      style={{ background: u.suspended ? "#16a34a" : "#dc2626" }}
                    >
                      {u.suspended ? "정지 해제" : "정지"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
