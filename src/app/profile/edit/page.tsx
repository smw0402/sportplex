import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCareerAction, deleteCareerAction } from "@/app/actions/profile";
import ProfileForm from "./ProfileForm";
import PasskeyManager from "@/components/PasskeyManager";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [careers, credentials] = await Promise.all([
    prisma.career.findMany({
      where: { userId: user.id },
      orderBy: [{ startYear: "desc" }, { order: "asc" }],
    }),
    prisma.credential.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">프로필 편집</h1>
        <Link href={`/u/${user.id}`} className="text-sm text-gray-500">
          ← 내 프로필
        </Link>
      </div>

      <ProfileForm
        user={{
          name: user.name,
          nickname: user.nickname,
          sport: user.sport,
          region: user.region,
          school: user.school,
          team: user.team,
          bio: user.bio,
          avatar: user.avatar,
          cover: user.cover,
          themeColor: user.themeColor,
          instagram: user.instagram,
          youtube: user.youtube,
        }}
      />

      {/* 패스키(생체 인증) 관리 */}
      <PasskeyManager
        credentials={credentials.map((c) => ({
          id: c.id,
          deviceName: c.deviceName,
          createdAt: c.createdAt.toISOString(),
        }))}
      />

      {/* 경력 관리 */}
      <section className="card p-6">
        <h2 className="mb-3 font-bold">🏅 경력 관리</h2>

        <div className="space-y-2">
          {careers.length === 0 && (
            <p className="text-sm text-gray-400">아직 등록한 경력이 없습니다.</p>
          )}
          {careers.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-gray-500">
                  {c.org && `${c.org} · `}
                  {c.startYear ?? ""}
                  {c.startYear && ` ~ ${c.endYear ?? "현재"}`}
                </p>
              </div>
              <form action={deleteCareerAction}>
                <input type="hidden" name="careerId" value={c.id} />
                <button className="text-sm text-red-500 hover:underline">삭제</button>
              </form>
            </div>
          ))}
        </div>

        <form action={addCareerAction} className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700">경력 추가</p>
          <input name="title" className="input" placeholder="경력 제목 (예: OO고 농구부 코치)" required />
          <input name="org" className="input" placeholder="소속 (예: OO고등학교)" />
          <div className="grid grid-cols-2 gap-3">
            <input name="startYear" type="number" className="input" placeholder="시작 연도 (2019)" />
            <input name="endYear" type="number" className="input" placeholder="종료 연도 (비우면 현재)" />
          </div>
          <textarea name="detail" className="input min-h-20" placeholder="상세 내용 (선택)" />
          <button className="btn-primary w-full">경력 추가</button>
        </form>
      </section>
    </div>
  );
}
