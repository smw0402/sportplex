"use client";

import { useActionState } from "react";
import { submitVerificationAction } from "@/app/actions/verify";
import ImageUpload from "@/components/ImageUpload";

export default function VerifyForm() {
  const [state, action, pending] = useActionState(submitVerificationAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
        ✅ 인증 신청이 접수됐어요. 관리자 심사 후 인증 뱃지가 부여됩니다.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">실명</label>
        <input name="realName" className="input" placeholder="홍길동" />
      </div>
      <div>
        <label className="label">자격·경력 증빙 내용</label>
        <textarea
          name="credential"
          className="input min-h-28"
          placeholder="보유 자격증, 지도 경력, 소속 등을 적어주세요. (예: 생활스포츠지도사 2급, OO고 농구부 코치 5년)"
          required
        />
      </div>
      <ImageUpload name="evidenceUrl" variant="cover" label="증빙 이미지 (자격증·재직증명 등, 선택)" />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button className="btn-primary w-full !py-3" disabled={pending}>
        {pending ? "신청 중..." : "인증 신청하기"}
      </button>
    </form>
  );
}
