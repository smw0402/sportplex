"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// 페이지 이동마다 접속·유입 로그를 남기는 비콘 (통계용)
export default function AccessLogger() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    // 관리자/API 경로는 통계에서 제외, 동일 경로 중복 방지
    if (!pathname || pathname.startsWith("/admin") || pathname === last.current) return;
    last.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    });
    // 이탈 시에도 안전하게 전송
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      /* 통계 실패는 무시 */
    }
  }, [pathname]);

  return null;
}
