"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import LevelBadge from "@/components/LevelBadge";
import {
  addCommentAction,
  toggleCommentLikeAction,
  deleteCommentAction,
  recommendCommentAction,
} from "@/app/actions/board";
import { roleLabel, displayName } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

type Author = {
  id: string;
  name: string;
  nickname: string | null;
  role: string;
  avatar: string | null;
  sport: string | null;
  verified: boolean;
  points: number;
};
export type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  likeCount: number;
  liked: boolean;
  isReply: boolean;
  recommended: boolean;
};

export default function CommentItem({
  comment,
  postId,
  meId,
  isAdmin,
  canInteract,
  isPostAuthor,
}: {
  comment: CommentNode;
  postId: string;
  meId: string | null;
  isAdmin: boolean;
  canInteract: boolean;
  isPostAuthor: boolean;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const c = comment;
  const isOwner = meId === c.author.id;

  async function like() {
    if (!canInteract) {
      router.push("/login");
      return;
    }
    const fd = new FormData();
    fd.set("commentId", c.id);
    fd.set("postId", postId);
    await toggleCommentLikeAction(fd);
    router.refresh();
  }

  return (
    <div className={`flex gap-2.5 ${c.isReply ? "ml-9 mt-3" : ""}`}>
      {c.isReply && <span className="mt-2 select-none text-gray-300">↳</span>}
      <Link href={`/u/${c.author.id}`} className="shrink-0">
        <Avatar name={displayName(c.author)} src={c.author.avatar} sport={c.author.sport} size={c.isReply ? 30 : 36} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/u/${c.author.id}`} className="font-semibold hover:underline">
            {displayName(c.author)}
          </Link>
          {c.author.verified && <span className="ml-1 text-brand-500">✔</span>}
          <LevelBadge points={c.author.points} showName={false} className="ml-1.5 align-middle" />
          <span className="ml-1.5 text-xs text-gray-400">
            {roleLabel(c.author.role)} · {timeAgo(c.createdAt)}
          </span>
        </p>
        <div
          className={`mt-0.5 ${
            c.recommended ? "rounded-lg border border-green-200 bg-green-50 px-3 py-2" : ""
          }`}
        >
          {c.recommended && (
            <p className="mb-1 text-xs font-bold text-green-600">✅ 작성자 추천 답변 (+10P)</p>
          )}
          <p className="whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <button onClick={like} className={c.liked ? "font-semibold text-red-500" : "hover:text-red-500"}>
            {c.liked ? "❤️" : "🤍"} {c.likeCount > 0 ? c.likeCount : "좋아요"}
          </button>
          {!c.isReply && canInteract && (
            <button onClick={() => setReplying((v) => !v)} className="hover:text-brand-600">
              답글
            </button>
          )}
          {/* 글 작성자만: 답변 추천(채택) */}
          {isPostAuthor && !c.isReply && !isOwner && (
            <form action={recommendCommentAction}>
              <input type="hidden" name="commentId" value={c.id} />
              <button
                className={c.recommended ? "font-semibold text-green-600" : "hover:text-green-600"}
              >
                {c.recommended ? "✅ 추천됨" : "추천"}
              </button>
            </form>
          )}
          {canInteract && !isOwner && <ReportButton targetType="COMMENT" targetId={c.id} label="" />}
          {(isOwner || isAdmin) && (
            <form action={deleteCommentAction}>
              <input type="hidden" name="commentId" value={c.id} />
              <button className="hover:text-red-500">삭제</button>
            </form>
          )}
        </div>

        {replying && (
          <form
            action={addCommentAction}
            className="mt-2 flex gap-2"
            onSubmit={() => setTimeout(() => setReplying(false), 50)}
          >
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="parentId" value={c.id} />
            <input
              name="content"
              className="input !py-2 text-sm"
              placeholder={`${displayName(c.author)}님에게 답글…`}
              autoFocus
              required
            />
            <button className="btn-primary shrink-0 !py-2 text-sm">등록</button>
          </form>
        )}
      </div>
    </div>
  );
}
