"use client";

import { useActionState, useState } from "react";
import { createReviewAction } from "@/app/actions/review";

export default function ReviewForm({
  proposalId,
  targetName,
}: {
  proposalId: string;
  targetName: string;
}) {
  const [state, action, pending] = useActionState(createReviewAction, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
        ✅ 후기를 남겼어요. 소중한 평가 감사합니다!
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm text-gray-600">
        <b>{targetName}</b> 님과의 매칭은 어떠셨나요?
      </p>

      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className={`text-3xl leading-none transition ${
              n <= shown ? "text-amber-400" : "text-gray-300"
            }`}
            aria-label={`${n}점`}
          >
            ★
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm font-semibold text-gray-500">{rating}점</span>}
      </div>

      <textarea
        name="content"
        className="input min-h-24"
        placeholder="지도 방식, 친절도, 실력 등 솔직한 후기를 남겨주세요."
        required
      />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button className="btn-primary w-full" disabled={pending || rating === 0}>
        {pending ? "등록 중..." : "후기 남기기"}
      </button>
    </form>
  );
}
