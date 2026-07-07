"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/app/actions/admin";
import { ROLES, SPORTS } from "@/lib/constants";
import RegionPicker from "@/components/RegionPicker";

export default function AdminCreateUser() {
  const [state, action, pending] = useActionState(createUserAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-bold">➕ 계정 생성 (마케팅·데모용)</summary>

      <form
        action={action}
        className="mt-4 space-y-3"
        key={state?.ok ? "reset" : "form"}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">이메일 *</label>
            <input name="email" type="email" className="input" placeholder="user@email.com" required />
          </div>
          <div>
            <label className="label">비밀번호 *</label>
            <input name="password" className="input" placeholder="6자 이상" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">이름 *</label>
            <input name="name" className="input" placeholder="홍길동" required />
          </div>
          <div>
            <label className="label">닉네임</label>
            <input name="nickname" className="input" placeholder="커뮤니티 표시 이름" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">역할</label>
            <select name="role" className="input" defaultValue="STUDENT">
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">주 종목</label>
            <select name="sport" className="input" defaultValue="">
              <option value="">선택 안 함</option>
              {SPORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.emoji} {s.key}
                </option>
              ))}
            </select>
          </div>
        </div>

        <RegionPicker />

        <div>
          <label className="label">한 줄 소개</label>
          <input name="bio" className="input" placeholder="프로필 소개 (선택)" />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="verified" className="h-4 w-4 rounded border-gray-300" />
            인증 지도자 ✔
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isAdmin" className="h-4 w-4 rounded border-gray-300" />
            관리자 권한
          </label>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            ✅ {state.email} 계정을 생성했어요.
          </p>
        )}

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "생성 중..." : "계정 생성"}
        </button>
      </form>
    </details>
  );
}
