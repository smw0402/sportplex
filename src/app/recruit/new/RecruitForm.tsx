"use client";

import { useActionState, useState } from "react";
import { createRecruitmentAction } from "@/app/actions/recruit";
import { SPORTS, SERVICE_TYPES } from "@/lib/constants";

export default function RecruitForm({ defaultSport }: { defaultSport?: string }) {
  const [state, action, pending] = useActionState(createRecruitmentAction, null);
  const [service, setService] = useState("LESSON");

  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label">어떤 서비스를 원하세요?</label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_TYPES.map((s) => (
            <label
              key={s.key}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                service === s.key
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={s.key}
                checked={service === s.key}
                onChange={() => setService(s.key)}
                className="hidden"
              />
              <div className="text-xl">{s.emoji}</div>
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">종목</label>
          <select name="sport" className="input" defaultValue={defaultSport ?? ""} required>
            <option value="" disabled>
              선택
            </option>
            {SPORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.emoji} {s.key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">지역</label>
          <input name="region" className="input" placeholder="서울 송파구" />
        </div>
      </div>

      <div>
        <label className="label">제목</label>
        <input name="title" className="input" placeholder="예: 초등 4학년 농구 기초 레슨 구해요" required />
      </div>
      <div>
        <label className="label">상세 내용</label>
        <textarea
          name="content"
          className="input min-h-36"
          placeholder="희망 일정, 수준, 목표 등을 적어주세요."
          required
        />
      </div>
      <div>
        <label className="label">예산 (선택)</label>
        <input name="budget" className="input" placeholder="예: 회당 5만원 / 협의 가능" />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button className="btn-primary w-full !py-3" disabled={pending}>
        {pending ? "등록 중..." : "모집공고 올리기"}
      </button>
    </form>
  );
}
