"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/recover";

const fieldClass =
  "w-full rounded-xl bg-gray-100 px-4 py-3.5 text-[15px] outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => router.push("/login"), 1800);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-green-50 p-5 text-center text-sm text-green-700">
        ✅ 비밀번호가 변경되었어요. 잠시 후 로그인 화면으로 이동합니다.
        <div className="mt-3">
          <Link href="/login" className="font-bold text-brand-600">
            바로 로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1.5 block text-sm font-bold">새 비밀번호</label>
        <input name="password" type="password" autoComplete="new-password" className={fieldClass} placeholder="6자 이상" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-bold">새 비밀번호 확인</label>
        <input name="confirm" type="password" autoComplete="new-password" className={fieldClass} placeholder="한 번 더 입력" required />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button
        className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "변경 중..." : "비밀번호 변경하기"}
      </button>
    </form>
  );
}
