"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { displayName } from "@/lib/constants";
import { notify } from "@/lib/notify";

const RECOMMEND_POINTS = 10;
const POST_POINTS = 2; // 글 작성
const COMMENT_POINTS = 1; // 댓글 작성
const LIKE_POINTS = 1; // 받은 좋아요

// 내공 가감 (음수 방지)
async function addPoints(userId: string, delta: number) {
  if (delta >= 0) {
    await prisma.user.update({ where: { id: userId }, data: { points: { increment: delta } } });
  } else {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    const next = Math.max(0, (u?.points ?? 0) + delta);
    await prisma.user.update({ where: { id: userId }, data: { points: next } });
  }
}

export async function createPostAction(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const sport = String(formData.get("sport") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) return { error: "제목과 내용을 입력해주세요." };

  const post = await prisma.post.create({
    data: { sport, title, content, authorId: user.id },
  });
  await addPoints(user.id, POST_POINTS); // 글 작성 내공
  redirect(`/board/${post.id}`);
}

export async function addCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!postId || !content) return;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;

  // 답글이면 부모 댓글이 같은 글에 속하는지 확인(답글의 답글은 한 단계로 평탄화)
  let normalizedParent = parentId;
  let replyTargetAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) return;
    normalizedParent = parent.parentId ?? parent.id; // 대대댓글 방지 → 최상위 부모로
    replyTargetAuthorId = parent.authorId;
  }

  await prisma.comment.create({
    data: { postId, content, authorId: user.id, parentId: normalizedParent },
  });
  await addPoints(user.id, COMMENT_POINTS); // 댓글/답글 작성 내공

  // 알림: 답글 → 부모 댓글 작성자 / 댓글 → 글 작성자
  const actorName = displayName(user);
  if (normalizedParent && replyTargetAuthorId) {
    await notify({
      userId: replyTargetAuthorId,
      actorId: user.id,
      type: "REPLY",
      message: `${actorName}님이 회원님의 댓글에 답글을 남겼어요.`,
      link: `/board/${postId}`,
    });
  } else {
    await notify({
      userId: post.authorId,
      actorId: user.id,
      type: "COMMENT",
      message: `${actorName}님이 회원님의 글에 댓글을 남겼어요.`,
      link: `/board/${postId}`,
    });
  }
  revalidatePath(`/board/${postId}`);
}

// 댓글/답글 좋아요 토글
export async function toggleCommentLikeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const commentId = String(formData.get("commentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  if (!commentId) return;

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: user.id } },
  });
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    if (comment && comment.authorId !== user.id) await addPoints(comment.authorId, -LIKE_POINTS);
  } else {
    await prisma.commentLike.create({ data: { commentId, userId: user.id } });
    if (comment) {
      if (comment.authorId !== user.id) await addPoints(comment.authorId, LIKE_POINTS);
      await notify({
        userId: comment.authorId,
        actorId: user.id,
        type: "COMMENT_LIKE",
        message: `${displayName(user)}님이 회원님의 댓글을 좋아합니다.`,
        link: `/board/${comment.postId}`,
      });
    }
  }
  if (postId) revalidatePath(`/board/${postId}`);
}

// 글 작성자가 답변(댓글)을 추천 → 답변자에게 포인트 + 알림
export async function recommendCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const commentId = String(formData.get("commentId") ?? "");
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment) return;
  // 글 작성자만, 본인 댓글은 추천 불가
  if (comment.post.authorId !== user.id) return;
  if (comment.authorId === user.id) return;

  const willRecommend = !comment.recommended;
  await prisma.$transaction([
    prisma.comment.update({ where: { id: commentId }, data: { recommended: willRecommend } }),
    prisma.user.update({
      where: { id: comment.authorId },
      data: { points: { increment: willRecommend ? RECOMMEND_POINTS : -RECOMMEND_POINTS } },
    }),
  ]);

  if (willRecommend) {
    await notify({
      userId: comment.authorId,
      actorId: user.id,
      type: "RECOMMEND",
      message: `${displayName(user)}님이 회원님의 답변을 추천했어요! (+${RECOMMEND_POINTS}P)`,
      link: `/board/${comment.postId}`,
    });
  }
  revalidatePath(`/board/${comment.postId}`);
}

// 좋아요 토글
export async function toggleLikeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    if (post && post.authorId !== user.id) await addPoints(post.authorId, -LIKE_POINTS);
  } else {
    await prisma.postLike.create({ data: { postId, userId: user.id } });
    if (post) {
      if (post.authorId !== user.id) await addPoints(post.authorId, LIKE_POINTS);
      await notify({
        userId: post.authorId,
        actorId: user.id,
        type: "POST_LIKE",
        message: `${displayName(user)}님이 회원님의 글을 좋아합니다.`,
        link: `/board/${postId}`,
      });
    }
  }
  revalidatePath(`/board/${postId}`);
  revalidatePath("/board");
}

// 본인 글(또는 관리자) 삭제
export async function deletePostAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const postId = String(formData.get("postId") ?? "");
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;
  if (post.authorId !== user.id && !user.isAdmin) return;
  await prisma.post.delete({ where: { id: postId } });
  redirect("/board");
}

// 본인 댓글(또는 관리자) 삭제
export async function deleteCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const commentId = String(formData.get("commentId") ?? "");
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return;
  if (comment.authorId !== user.id && !user.isAdmin) return;
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/board/${comment.postId}`);
}
