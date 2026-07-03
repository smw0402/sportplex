"use client";

import { useActionState, useState } from "react";
import { createReportAction } from "@/app/actions/report";
import { REPORT_REASONS } from "@/lib/constants";

export default function ReportButton({
  targetType,
  targetId,
  label = "신고",
  className = "",
}: {
  targetType: "USER" | "POST" | "COMMENT" | "RECRUITMENT";
  targetId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createReportAction, null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || "text-xs text-gray-400 hover:text-red-500"}
      >
        🚩 {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">🚩 신고하기</h3>

            {state?.ok ? (
              <div className="mt-4 space-y-4">
                <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                  신고가 접수됐어요. 운영팀이 확인 후 조치합니다.
                </p>
                <button onClick={() => setOpen(false)} className="btn-primary w-full">
                  닫기
                </button>
              </div>
            ) : (
              <form action={action} className="mt-4 space-y-3">
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="targetId" value={targetId} />
                <div>
                  <label className="label">신고 사유</label>
                  <select name="reason" className="input" required defaultValue="">
                    <option value="" disabled>
                      사유 선택
                    </option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">상세 내용 (선택)</label>
                  <textarea name="detail" className="input min-h-20" placeholder="구체적인 상황을 적어주세요." />
                </div>
                {state?.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">
                    취소
                  </button>
                  <button className="btn-primary flex-1 !bg-red-500 hover:!bg-red-600" disabled={pending}>
                    {pending ? "접수 중..." : "신고 접수"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
