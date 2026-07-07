"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 오류를 서버 로그에 기록 (관리자 오류 로그 탭에서 확인)
    try {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message || "클라이언트 오류",
          stack: error.stack ?? null,
          digest: error.digest ?? null,
          path: typeof window !== "undefined" ? window.location.pathname : null,
        }),
        keepalive: true,
      });
    } catch {
      /* 무시 */
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-lg font-bold">문제가 발생했어요</h1>
      <p className="mt-1 text-sm text-gray-500">
        일시적인 오류일 수 있어요. 잠시 후 다시 시도해주세요.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">다시 시도</button>
        <Link href="/" className="btn-outline">홈으로</Link>
      </div>
    </div>
  );
}
