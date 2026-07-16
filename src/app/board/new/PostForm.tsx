"use client";

import { useActionState } from "react";
import { createPostAction } from "@/app/actions/board";
import { SPORTS } from "@/lib/constants";

export default function PostForm({ defaultSport }: { defaultSport?: string }) {
  const [state, action, pending] = useActionState(createPostAction, null);

  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label">종목 (선택)</label>
        <select name="sport" className="input" defaultValue={defaultSport ?? ""}>
          <option value="">종목 무관 / 잡담</option>
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.emoji} {s.key}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">제목</label>
        <input name="title" className="input" placeholder="제목을 입력하세요" required />
      </div>
      <div>
        <label className="label">내용</label>
        <textarea
          name="content"
          className="input min-h-40"
          placeholder="자유롭게 이야기를 나눠보세요."
          required
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button className="btn-primary w-full !py-3" disabled={pending}>
        {pending ? "등록 중..." : "등록"}
      </button>
    </form>
  );
}
