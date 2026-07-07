import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { inquiryCategoryLabel, INQUIRY_STATUS } from "@/lib/constants";
import { timeAgo, ymd } from "@/lib/format";
import { answerInquiryAction, closeInquiryAction } from "@/app/actions/adminExtra";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "OPEN", label: "미답변" },
  { key: "ANSWERED", label: "답변완료" },
  { key: "CLOSED", label: "종료" },
  { key: "", label: "전체" },
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const { status = "OPEN" } = await searchParams;

  const [inquiries, openCount] = await Promise.all([
    prisma.inquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.inquiry.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="space-y-5">
      <AdminNav active="inquiries" />

      <div className="flex items-center justify-between">
        <h2 className="font-bold">📨 1:1 문의 · 미답변 <span className="text-red-500">{openCount}</span></h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key || "all"}
            href={f.key ? `/admin/inquiries?status=${f.key}` : "/admin/inquiries?status="}
            className={`chip border ${
              status === f.key
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {inquiries.length === 0 && (
          <div className="card p-8 text-center text-sm text-gray-400">문의가 없습니다.</div>
        )}
        {inquiries.map((q) => {
          const st = INQUIRY_STATUS[q.status] ?? INQUIRY_STATUS.OPEN;
          return (
            <div key={q.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`chip ${st.color}`}>{st.label}</span>
                <span className="chip bg-gray-100 text-gray-600">{inquiryCategoryLabel(q.category)}</span>
                <span className="text-gray-400">{ymd(q.createdAt)} · {timeAgo(q.createdAt)}</span>
              </div>
              <p className="mt-2 font-semibold">{q.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{q.message}</p>
              <p className="mt-2 text-xs text-gray-400">
                {q.name} ·{" "}
                <a href={`mailto:${q.email}?subject=[Sportplex] ${encodeURIComponent(q.subject)} 답변`} className="text-brand-600 hover:underline">
                  {q.email}
                </a>
                {q.userId && (
                  <>
                    {" · "}
                    <Link href={`/u/${q.userId}`} className="text-brand-600 hover:underline">회원 프로필</Link>
                  </>
                )}
              </p>

              {q.reply && (
                <div className="mt-3 rounded-xl bg-brand-50 p-3">
                  <p className="text-xs font-semibold text-brand-700">
                    답변 {q.repliedAt ? `· ${timeAgo(q.repliedAt)}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{q.reply}</p>
                </div>
              )}

              {q.status !== "CLOSED" && (
                <form action={answerInquiryAction} className="mt-3 space-y-2">
                  <input type="hidden" name="inquiryId" value={q.id} />
                  <textarea
                    name="reply"
                    defaultValue={q.reply ?? ""}
                    className="input min-h-20"
                    placeholder="답변을 입력하세요. (회원이면 알림, 이메일은 상단 주소로 발송)"
                    required
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary text-sm">답변 등록</button>
                    <button
                      formAction={closeInquiryAction}
                      className="btn-outline text-sm text-gray-500"
                      formNoValidate
                    >
                      종료 처리
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        ※ 답변 등록 시 회원에게는 앱 알림이 전송됩니다. 이메일 자동 발송(SMTP/SendGrid)은 발신 도메인 인증 후
        연동할 수 있으며, 지금은 상단 이메일 주소로 직접 회신하실 수 있습니다.
      </p>
    </div>
  );
}
