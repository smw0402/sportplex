import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { inquiryCategoryLabel, INQUIRY_STATUS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { COMPANY } from "@/lib/legal";
import SupportForm from "@/components/SupportForm";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();

  const myInquiries = user
    ? await prisma.inquiry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">📨 1:1 문의</h1>
        <p className="mt-1 text-sm text-gray-500">
          궁금한 점이나 불편한 점을 남겨주세요. 입력하신 이메일({COMPANY.email} 담당)로 답변드립니다.
        </p>
      </div>

      <SupportForm defaultName={user?.name} defaultEmail={user?.email} />

      {user && myInquiries.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">내 문의 내역</h2>
          {myInquiries.map((q) => {
            const st = INQUIRY_STATUS[q.status] ?? INQUIRY_STATUS.OPEN;
            return (
              <div key={q.id} className="card p-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`chip ${st.color}`}>{st.label}</span>
                  <span className="chip bg-gray-100 text-gray-600">
                    {inquiryCategoryLabel(q.category)}
                  </span>
                  <span className="text-gray-400">· {timeAgo(q.createdAt)}</span>
                </div>
                <p className="mt-2 font-semibold">{q.subject}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{q.message}</p>
                {q.reply && (
                  <div className="mt-3 rounded-xl bg-brand-50 p-3">
                    <p className="text-xs font-semibold text-brand-700">운영팀 답변</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{q.reply}</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
