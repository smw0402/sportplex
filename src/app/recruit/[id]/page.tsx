import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  sportEmoji,
  serviceLabel,
  roleLabel,
  isProvider,
  RECRUIT_STATUS,
  PROPOSAL_STATUS,
} from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import {
  acceptProposalAction,
  rejectProposalAction,
  closeRecruitmentAction,
} from "@/app/actions/recruit";
import { reviewTargetFor } from "@/lib/reviews";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import ProposeForm from "./ProposeForm";
import ReviewForm from "@/components/ReviewForm";
import RecruitHeart from "@/components/RecruitHeart";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

export default async function RecruitDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // 조회수 증가 (중복 카운팅 — 열람할 때마다 +1)
  await prisma.recruitment.update({
    where: { id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  const r = await prisma.recruitment.findUnique({
    where: { id },
    include: {
      author: true,
      proposals: {
        include: { proposer: true, reviews: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true } },
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
    },
  });
  if (!r) notFound();

  const heartCount = r._count.likes;
  const iHearted = user ? r.likes.length > 0 : false;
  const bookmarked = user
    ? !!(await prisma.bookmark.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "RECRUITMENT", targetId: r.id } },
      }))
    : false;

  const isAuthor = user?.id === r.author.id;
  const myProposal = user ? r.proposals.find((p) => p.proposerId === user.id) : null;
  const canPropose =
    user && !isAuthor && isProvider(user.role) && r.status === "OPEN" && !myProposal;

  // 매칭 성사된 제안 + 후기 작성 자격 판단
  const acceptedProposal = r.proposals.find((p) => p.status === "ACCEPTED");
  const reviewTargetId =
    user && acceptedProposal
      ? reviewTargetFor(
          { status: acceptedProposal.status, proposerId: acceptedProposal.proposerId, recruitment: { authorId: r.author.id } },
          user.id
        )
      : null;
  const reviewTarget =
    reviewTargetId === r.author.id
      ? r.author
      : reviewTargetId === acceptedProposal?.proposerId
        ? acceptedProposal?.proposer
        : null;
  const myReview = acceptedProposal?.reviews.find((rv) => rv.authorId === user?.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/recruit" className="text-sm text-gray-500 hover:text-gray-700">
        ← 모집공고
      </Link>

      <article className="card p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>
            {RECRUIT_STATUS[r.status].label}
          </span>
          <span className="chip bg-gray-50 text-gray-600">
            {sportEmoji(r.sport)} {r.sport}
          </span>
          <span className="chip bg-brand-50 text-brand-600">{serviceLabel(r.serviceType)}</span>
        </div>

        <h1 className="mt-3 text-xl font-bold">{r.title}</h1>

        <Link href={`/u/${r.author.id}`} className="mt-3 flex items-center gap-2.5">
          <Avatar name={r.author.name} src={r.author.avatar} sport={r.author.sport} size={38} />
          <div>
            <p className="text-sm font-semibold">{r.author.name}</p>
            <p className="text-xs text-gray-400">
              {roleLabel(r.author.role)} · {timeAgo(r.createdAt)}
            </p>
          </div>
        </Link>

        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
          {r.content}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          <span>📍 {r.region ?? "지역무관"}</span>
          <span>💰 {r.budget ?? "협의"}</span>
          <span>👁 조회 {r.views}</span>
          <span>❤️ 하트 {heartCount}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <RecruitHeart
            recruitmentId={r.id}
            count={heartCount}
            liked={iHearted}
            canLike={!!user}
          />
          <BookmarkButton targetType="RECRUITMENT" targetId={r.id} saved={bookmarked} canSave={!!user} />
          <ShareButton path={`/recruit/${r.id}`} title={`${r.title} · Sportplex 모집공고`} text={r.content.slice(0, 60)} />
          {isAuthor && r.status === "OPEN" && (
            <form action={closeRecruitmentAction}>
              <input type="hidden" name="recruitmentId" value={r.id} />
              <button className="btn-outline text-sm text-gray-500">공고 마감하기</button>
            </form>
          )}
        </div>
      </article>

      {/* 매칭 성사 후기 (성사된 두 당사자만 상호 작성) */}
      {reviewTarget && (
        <section className="card border-2 border-brand-100 p-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="chip bg-brand-50 text-brand-700">🤝 매칭 성사</span>
          </div>
          <h2 className="mb-3 font-bold">후기 남기기</h2>
          {myReview ? (
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Stars value={myReview.rating} />
                <span className="text-sm font-semibold text-gray-600">{myReview.rating}.0</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-700">{myReview.content}</p>
              <p className="mt-2 text-xs text-gray-400">
                {reviewTarget.name} 님에게 남긴 내 후기예요.
              </p>
            </div>
          ) : (
            <ReviewForm proposalId={acceptedProposal!.id} targetName={reviewTarget.name} />
          )}
        </section>
      )}

      {/* 제안하기 (코치/감독/레슨선생님) */}
      {canPropose && (
        <section className="card p-6">
          <h2 className="mb-3 font-bold">✋ 이 요청에 제안하기</h2>
          <ProposeForm recruitmentId={r.id} />
        </section>
      )}

      {myProposal && !isAuthor && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">내가 보낸 제안</h2>
            <span className={`chip ${PROPOSAL_STATUS[myProposal.status].color}`}>
              {PROPOSAL_STATUS[myProposal.status].label}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{myProposal.message}</p>
          {myProposal.price && (
            <p className="mt-1 text-sm font-semibold text-brand-600">💰 {myProposal.price}</p>
          )}
        </section>
      )}

      {!user && (
        <p className="card p-4 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-brand-600">로그인</Link> 후 제안할 수 있어요.
        </p>
      )}

      {/* 받은 제안 목록 (작성자만) */}
      {isAuthor && (
        <section className="card p-6">
          <h2 className="mb-4 font-bold">받은 제안 {r.proposals.length}건</h2>
          {r.proposals.length === 0 && (
            <p className="text-sm text-gray-400">아직 받은 제안이 없습니다.</p>
          )}
          <div className="space-y-4">
            {r.proposals.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/u/${p.proposer.id}`} className="flex items-center gap-2.5">
                    <Avatar name={p.proposer.name} src={p.proposer.avatar} sport={p.proposer.sport} size={38} />
                    <div>
                      <p className="text-sm font-semibold">
                        {p.proposer.name}
                        {p.proposer.verified && <span className="ml-1 text-brand-500">✔</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {roleLabel(p.proposer.role)} · {p.proposer.region ?? ""}
                      </p>
                    </div>
                  </Link>
                  <span className={`chip ${PROPOSAL_STATUS[p.status].color}`}>
                    {PROPOSAL_STATUS[p.status].label}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{p.message}</p>
                {p.price && (
                  <p className="mt-1 text-sm font-semibold text-brand-600">💰 {p.price}</p>
                )}

                {p.status === "PENDING" && r.status === "OPEN" && (
                  <div className="mt-3 flex gap-2">
                    <form action={acceptProposalAction}>
                      <input type="hidden" name="proposalId" value={p.id} />
                      <button className="btn-primary text-sm">수락하고 채팅 시작</button>
                    </form>
                    <form action={rejectProposalAction}>
                      <input type="hidden" name="proposalId" value={p.id} />
                      <button className="btn-ghost text-sm">거절</button>
                    </form>
                  </div>
                )}

                {p.status === "ACCEPTED" && (
                  <Link href={`/chat`} className="btn-outline mt-3 text-sm">
                    💌 채팅으로 이동
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
