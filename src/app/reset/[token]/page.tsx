import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valid = !!row && !row.usedAt && row.expiresAt > new Date();

  return (
    <div className="mx-auto max-w-sm px-2 py-12">
      <h1 className="text-center text-2xl font-extrabold">비밀번호 재설정</h1>
      <p className="mt-2 text-center text-sm text-gray-500">새로 사용할 비밀번호를 입력하세요.</p>

      <div className="mt-8">
        {valid ? (
          <ResetForm token={token} />
        ) : (
          <div className="rounded-xl bg-red-50 p-5 text-center text-sm text-red-600">
            만료되었거나 잘못된 링크예요. 재설정을 다시 요청해주세요.
            <div className="mt-3">
              <Link href="/find" className="font-bold text-brand-600">
                다시 요청하기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
