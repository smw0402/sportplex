"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/app/actions/auth";

export default function DeleteAccount({ isSocial }: { isSocial: boolean }) {
  const [state, action, pending] = useActionState(deleteAccountAction, null);

  return (
    <details className="card border-red-100 p-6">
      <summary className="cursor-pointer font-bold text-red-600">⚠️ 회원 탈퇴</summary>

      <div className="mt-4 space-y-3">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          탈퇴하면 프로필·게시글·댓글·채팅·결제 내역 등 <b>모든 데이터가 영구 삭제</b>되며 복구할 수 없어요.
        </p>

        <form
          action={action}
          onSubmit={(e) => {
            if (!confirm("정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.")) e.preventDefault();
          }}
          className="space-y-3"
        >
          {isSocial ? (
            <div>
              <label className="label">
                확인을 위해 <b>탈퇴</b> 를 입력해주세요
              </label>
              <input name="confirm" className="input" placeholder="탈퇴" autoComplete="off" required />
            </div>
          ) : (
            <div>
              <label className="label">비밀번호 확인</label>
              <input
                name="password"
                type="password"
                className="input"
                placeholder="현재 비밀번호"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <button
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "처리 중…" : "회원 탈퇴하기"}
          </button>
        </form>
      </div>
    </details>
  );
}
