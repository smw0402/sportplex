"use client";

import { useActionState } from "react";
import { generateNewsDraftsAction, publishNewsAction } from "@/app/actions/news";
import { SPORTS, sportEmoji } from "@/lib/constants";

export default function AiNewsGenerator() {
  const [state, action, pending] = useActionState(generateNewsDraftsAction, null);

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
      <div className="flex items-center gap-1.5">
        <h3 className="font-bold">🤖 AI 이슈 생성</h3>
        <span className="chip bg-white text-gray-500">웹 검색 기반</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        AI가 웹에서 최신 이슈를 찾아 초안을 만들어요. <b>확인 후 게시</b>하면 홈에 노출됩니다.
      </p>

      <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="label">종목</label>
          <select name="sport" className="input" defaultValue="">
            <option value="">전체(인기 종목)</option>
            {SPORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.emoji} {s.key}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" disabled={pending}>
          {pending ? "검색·정리 중… (최대 1분)" : "이슈 생성"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      {state?.drafts && state.drafts.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-500">
            생성된 초안 {state.drafts.length}건 — 게시할 항목을 선택하세요
          </p>
          {state.drafts.map((d, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="chip bg-gray-50 text-gray-600">
                  {sportEmoji(d.sport)} {d.sport}
                </span>
                {d.source && <span>· {d.source}</span>}
              </div>
              <p className="mt-1 text-sm font-semibold">{d.title}</p>
              <p className="mt-0.5 text-sm text-gray-600">{d.summary}</p>
              <form action={publishNewsAction} className="mt-2">
                <input type="hidden" name="sport" value={d.sport} />
                <input type="hidden" name="title" value={d.title} />
                <input type="hidden" name="summary" value={d.summary} />
                <input type="hidden" name="source" value={d.source ?? ""} />
                <button className="btn-primary !py-1.5 text-xs">게시하기</button>
              </form>
            </div>
          ))}
          <p className="text-[11px] text-gray-400">
            ※ AI 결과는 부정확할 수 있어요. 사실·표현을 확인한 뒤 게시해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
