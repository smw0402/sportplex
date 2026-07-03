import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isClient, roleLabel } from "@/lib/constants";
import RecruitForm from "./RecruitForm";

export const dynamic = "force-dynamic";

export default async function NewRecruitPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { sport } = await searchParams;

  // 모집공고는 학생·학부모만 작성 가능
  if (!isClient(user.role)) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="card p-8">
          <p className="text-3xl">🙅</p>
          <h1 className="mt-3 text-lg font-bold">모집공고는 학생·학부모만 올릴 수 있어요</h1>
          <p className="mt-2 text-sm text-gray-500">
            현재 <b>{roleLabel(user.role)}</b> 계정으로 로그인되어 있어요.
            <br />
            코치·감독·레슨선생님은 학생·학부모가 올린 모집공고에 <b>제안</b>해주세요.
          </p>
          <Link href="/recruit" className="btn-primary mt-5">
            모집공고 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-extrabold">📢 레슨·상담 요청 올리기</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        원하는 조건을 올리면 코치·감독·레슨선생님이 직접 제안합니다.
      </p>
      <RecruitForm defaultSport={sport ?? user.sport ?? undefined} />
    </div>
  );
}
