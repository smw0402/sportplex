"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNewsAction } from "@/app/actions/news";
import { SPORTS } from "@/lib/constants";
import ImageUpload from "@/components/ImageUpload";

export default function NewsForm() {
  const [state, action, pending] = useActionState(createNewsAction, null);
  const router = useRouter();

  // 등록 성공 시 목록 갱신
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-gray-50 p-4" key={state?.ok ? "reset" : "form"}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">종목</label>
          <select name="sport" className="input" required defaultValue="">
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
          <label className="label">출처 (선택)</label>
          <input name="source" className="input" placeholder="예: 스포츠플렉스" />
        </div>
      </div>
      <div>
        <label className="label">헤드라인 (제목)</label>
        <input name="title" className="input" placeholder="뉴스 헤드라인" required />
      </div>
      <div>
        <label className="label">요약</label>
        <textarea name="summary" className="input min-h-16" placeholder="목록/미리보기용 한두 문장 요약" required />
      </div>
      <div>
        <label className="label">기사 본문 (선택)</label>
        <textarea
          name="body"
          className="input min-h-40"
          placeholder="기사 전체 내용을 입력하세요. (비우면 요약만 표시)"
        />
      </div>
      <ImageUpload name="imageUrl" variant="cover" label="대표 이미지 (선택)" />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "등록 중..." : "뉴스 등록"}
      </button>
    </form>
  );
}
