"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSchoolAction } from "@/app/actions/adminExtra";
import { SCHOOL_CATEGORIES } from "@/lib/constants";

export default function SchoolForm() {
  const [state, action, pending] = useActionState(createSchoolAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-bold">➕ 학교 추가</summary>
      <form action={action} className="mt-4 space-y-3" key={state?.ok ? "reset" : "form"}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">학교명 *</label>
            <input name="name" className="input" placeholder="예: 한국체육대학교" required />
          </div>
          <div>
            <label className="label">구분</label>
            <select name="category" className="input" defaultValue="HIGH">
              {SCHOOL_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">지역</label>
            <input name="region" className="input" placeholder="예: 서울" />
          </div>
          <div>
            <label className="label">종목 (쉼표 구분)</label>
            <input name="sports" className="input" placeholder="예: 축구, 농구, 육상" />
          </div>
        </div>
        <div>
          <label className="label">홈페이지</label>
          <input name="homepage" className="input" placeholder="https://" />
        </div>
        <div>
          <label className="label">메모</label>
          <input name="note" className="input" placeholder="입시 특기자 전형·모집요강 등" />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">✅ {state.name} 등록됨</p>
        )}

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "저장 중…" : "학교 등록"}
        </button>
      </form>
    </details>
  );
}
