import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PAYMENT_STATUS, displayName } from "@/lib/constants";
import { won, ymd, timeAgo } from "@/lib/format";
import { refundPaymentAction } from "@/app/actions/adminExtra";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "전체" },
  { key: "REQUESTED", label: "결제 요청" },
  { key: "PAID", label: "결제 완료" },
  { key: "REFUNDED", label: "환불" },
  { key: "CANCELED", label: "취소" },
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const { status = "" } = await searchParams;

  const [payments, paidAgg, paidCount, reqCount] = await Promise.all([
    prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: { payer: true, payee: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "REQUESTED" } }),
  ]);

  const revenue = paidAgg._sum.amount ?? 0;
  const fee = Math.round(revenue * 0.1); // 예시 수수료 10%

  return (
    <div className="space-y-5">
      <AdminNav active="payments" />

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="총 결제액(완료)" value={won(revenue)} accent />
        <Stat label="예상 수수료(10%)" value={won(fee)} />
        <Stat label="결제 완료 건수" value={`${paidCount}건`} />
        <Stat label="미결제 요청" value={`${reqCount}건`} />
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key || "all"}
            href={f.key ? `/admin/payments?status=${f.key}` : "/admin/payments"}
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

      <div className="card divide-y divide-gray-100">
        {payments.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">결제 내역이 없습니다.</p>
        )}
        {payments.map((p) => {
          const st = PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.REQUESTED;
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`chip ${st.color}`}>{st.label}</span>
                  <span className="text-gray-400">{ymd(p.createdAt)} · {timeAgo(p.createdAt)}</span>
                </div>
                <p className="mt-1 text-lg font-extrabold">{won(p.amount)}</p>
                <p className="text-xs text-gray-500">
                  <Link href={`/u/${p.payerId}`} className="hover:underline">{displayName(p.payer)}</Link>
                  {" → "}
                  <Link href={`/u/${p.payeeId}`} className="hover:underline">{displayName(p.payee)}</Link>
                  {p.memo && ` · ${p.memo}`}
                </p>
              </div>
              {p.status === "PAID" && (
                <form action={refundPaymentAction}>
                  <input type="hidden" name="paymentId" value={p.id} />
                  <button className="btn-outline !py-1.5 text-xs text-red-500">환불 처리</button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        ※ 현재 결제는 안전결제(에스크로) 데모 단계입니다. 실제 카드·계좌 정산 연동(토스페이먼츠/PortONE 등)은
        가맹점 심사 후 연결됩니다.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? "bg-brand-50" : ""}`}>
      <p className={`text-lg font-extrabold ${accent ? "text-brand-700" : ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}
