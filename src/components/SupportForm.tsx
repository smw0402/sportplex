"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInquiryAction } from "@/app/actions/support";
import { INQUIRY_CATEGORIES } from "@/lib/constants";

export default function SupportForm({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(createInquiryAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">이름</label>
          <input name="name" defaultValue={defaultName} className="input" placeholder="홍길동" />
        </div>
        <div>
          <label className="label">이메일 (답변 받을 주소)</label>
          <input name="email" type="email" defaultValue={defaultEmail} className="input" placeholder="you@email.com" />
        </div>
      </div>
      <div>
        <label className="label">문의 유형</label>
        <select name="category" className="input" defaultValue="GENERAL">
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">제목</label>
        <input name="subject" className="input" placeholder="문의 제목" required />
      </div>
      <div>
        <label className="label">내용</label>
        <textarea name="message" className="input min-h-32" placeholder="문의 내용을 자세히 적어주세요." required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ 문의가 접수되었어요. 입력하신 이메일로 답변드릴게요.
        </p>
      )}

      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "접수 중…" : "문의 보내기"}
      </button>
    </form>
  );
}
