"use client";

import { useActionState } from "react";
import { createProposalAction } from "@/app/actions/recruit";

export default function ProposeForm({ recruitmentId }: { recruitmentId: string }) {
  const [state, action, pending] = useActionState(createProposalAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
        ✅ 제안을 보냈어요! 작성자가 수락하면 채팅이 열립니다.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="recruitmentId" value={recruitmentId} />
      <div>
        <label className="label">제안 메시지</label>
        <textarea
          name="message"
          className="input min-h-28"
          placeholder="자기소개, 지도 방식, 가능한 일정 등을 적어주세요."
          required
        />
      </div>
      <div>
        <label className="label">제안 금액 (선택)</label>
        <input name="price" className="input" placeholder="예: 회당 4만원" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "보내는 중..." : "제안 보내기"}
      </button>
    </form>
  );
}
