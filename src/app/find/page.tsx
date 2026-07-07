"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { findEmailAction, requestPasswordResetAction } from "@/app/actions/recover";

const fieldClass =
  "w-full rounded-xl bg-gray-100 px-4 py-3.5 text-[15px] outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

export default function FindPage() {
  const [tab, setTab] = useState<"id" | "pw">("id");

  return (
    <div className="mx-auto max-w-sm px-2 py-12">
      <h1 className="text-center text-2xl font-extrabold">아이디 · 비밀번호 찾기</h1>
      <p className="mt-2 text-center text-sm text-gray-500">가입한 이메일로 계정을 확인할 수 있어요.</p>

      <div className="mt-8 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab("id")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            tab === "id" ? "bg-white shadow-sm" : "text-gray-500"
          }`}
        >
          아이디(이메일) 찾기
        </button>
        <button
          onClick={() => setTab("pw")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            tab === "pw" ? "bg-white shadow-sm" : "text-gray-500"
          }`}
        >
          비밀번호 재설정
        </button>
      </div>

      <div className="mt-6">{tab === "id" ? <FindId /> : <ResetPw />}</div>

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-brand-600">
          ← 로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}

function FindId() {
  const [state, action, pending] = useActionState(findEmailAction, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold">가입 시 이름</label>
        <input name="name" className={fieldClass} placeholder="홍길동" required />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button
        className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "찾는 중..." : "아이디 찾기"}
      </button>

      {state?.ok && (
        <div className="rounded-xl bg-gray-50 p-4">
          {state.emails.length === 0 ? (
            <p className="text-sm text-gray-500">일치하는 계정을 찾지 못했어요. 이름을 확인해주세요.</p>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold">가입된 이메일</p>
              <ul className="space-y-1.5">
                {state.emails.map((e, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{e.masked}</span>
                    <span className="text-xs text-gray-400">가입 {e.joined}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-400">
                보안을 위해 이메일 일부만 표시돼요. 기억나지 않으면 비밀번호 재설정을 이용하세요.
              </p>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function ResetPw() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold">가입 이메일</label>
        <input name="email" type="email" className={fieldClass} placeholder="kim@test.com" required />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          ✅ 입력하신 이메일이 가입돼 있다면, 비밀번호 재설정 링크를 보냈어요. 메일함(스팸함 포함)을 확인해주세요.
          <br />
          <span className="text-xs text-green-600">링크는 30분간 유효합니다.</span>
        </div>
      ) : (
        <button
          className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "발송 중..." : "재설정 링크 받기"}
        </button>
      )}
    </form>
  );
}
