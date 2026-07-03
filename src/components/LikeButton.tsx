"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLikeAction } from "@/app/actions/board";

export default function LikeButton({
  postId,
  count,
  liked,
  canLike,
}: {
  postId: string;
  count: number;
  liked: boolean;
  canLike: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // 낙관적 표시
  const [optimistic, setOptimistic] = useState({ liked, count });

  function onClick() {
    if (!canLike) {
      router.push("/login");
      return;
    }
    setOptimistic((s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }));
    const fd = new FormData();
    fd.set("postId", postId);
    startTransition(async () => {
      await toggleLikeAction(fd);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`btn ${
        optimistic.liked
          ? "bg-red-50 text-red-600"
          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="text-base">{optimistic.liked ? "❤️" : "🤍"}</span>
      좋아요 {optimistic.count}
    </button>
  );
}
