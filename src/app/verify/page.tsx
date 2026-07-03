import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProvider, roleLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import VerifyForm from "./VerifyForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isProvider(user.role)) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="card p-8">
          <p className="text-3xl">🪪</p>
          <h1 className="mt-3 text-lg font-bold">지도자 인증은 코치·감독·레슨선생님만 신청할 수 있어요</h1>
          <p className="mt-2 text-sm text-gray-500">
            현재 <b>{roleLabel(user.role)}</b> 계정이에요.
          </p>
          <Link href="/" className="btn-primary mt-5">홈으로</Link>
        </div>
      </div>
    );
  }

  const latest = await prisma.verificationRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">🪪 지도자 인증</h1>
        <p className="mt-1 text-sm text-gray-500">
          인증된 지도자는 프로필·랭킹·검색에서 <span className="font-semibold text-brand-600">✔ 인증 뱃지</span>가
          표시되어 학생·학부모의 신뢰를 얻을 수 있어요.
        </p>
      </div>

      {user.verified ? (
        <div className="card border-2 border-brand-100 p-6 text-center">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 font-bold text-brand-700">인증된 지도자입니다</h2>
          <p className="mt-1 text-sm text-gray-500">프로필에 인증 뱃지가 표시되고 있어요.</p>
        </div>
      ) : latest?.status === "PENDING" ? (
        <div className="card p-6">
          <span className="chip bg-yellow-100 text-yellow-700">심사 대기중</span>
          <p className="mt-2 text-sm text-gray-600">
            {timeAgo(latest.createdAt)}에 접수된 신청을 관리자가 심사하고 있어요.
          </p>
        </div>
      ) : (
        <div className="card p-6">
          {latest?.status === "REJECTED" && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              이전 신청이 반려되었어요{latest.reviewNote ? ` — ${latest.reviewNote}` : ""}. 보완하여 다시 신청해주세요.
            </div>
          )}
          <VerifyForm />
        </div>
      )}
    </div>
  );
}
