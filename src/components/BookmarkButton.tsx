"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBookmarkAction } from "@/app/actions/bookmark";

export default function BookmarkButton({
  targetType,
  targetId,
  saved,
  canSave,
  variant = "button",
}: {
  targetType: "USER" | "POST" | "RECRUITMENT";
  targetId: string;
  saved: boolean;
  canSave: boolean;
  variant?: "button" | "icon";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(saved);

  function onClick() {
    if (!canSave) {
      router.push("/login");
      return;
    }
    setOn((v) => !v);
    const fd = new FormData();
    fd.set("targetType", targetType);
    fd.set("targetId", targetId);
    startTransition(async () => {
      await toggleBookmarkAction(fd);
      router.refresh();
    });
  }

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-label={on ? "찜 취소" : "찜하기"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-lg hover:bg-gray-50"
      >
        {on ? "🔖" : "📑"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`btn ${
        on ? "bg-amber-50 text-amber-600" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="text-base">{on ? "🔖" : "📑"}</span>
      {on ? "찜함" : "찜하기"}
    </button>
  );
}
