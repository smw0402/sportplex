"use client";

import { useState } from "react";

export default function ShareButton({
  path,
  title,
  text,
  variant = "button",
}: {
  path: string; // 예: /u/abc 또는 /recruit/abc
  title: string;
  text?: string;
  variant?: "button" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    // 모바일: OS 공유 시트(카카오톡 등 포함), 데스크톱: 링크 복사
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch {
        /* 취소 시 무시 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        aria-label="공유하기"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-lg hover:bg-gray-50"
      >
        {copied ? "✅" : "🔗"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="btn border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    >
      <span className="text-base">{copied ? "✅" : "🔗"}</span>
      {copied ? "링크 복사됨" : "공유"}
    </button>
  );
}
