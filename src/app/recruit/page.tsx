import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  sportEmoji,
  serviceLabel,
  RECRUIT_STATUS,
  SERVICE_TYPES,
} from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import SportFilter from "@/components/SportFilter";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function RecruitPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; service?: string }>;
}) {
  const { sport, service } = await searchParams;

  const recruits = await prisma.recruitment.findMany({
    where: {
      ...(sport ? { sport } : {}),
      ...(service ? { serviceType: service } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { author: true, _count: { select: { proposals: true, likes: true } } },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold">📢 모집공고</h1>
          <p className="text-sm text-gray-500">
            학생·학부모가 올린 상담·레슨 요청에 코치·선생님이 제안해요.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/ranking" className="btn-outline">
            🏆 랭킹
          </Link>
          <Link href="/recruit/new" className="btn-primary">
            + 요청
          </Link>
        </div>
      </div>

      {/* 지도자 랭킹 진입 배너 */}
      <Link
        href="/ranking"
        className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-5 py-4 text-white hover:opacity-95"
      >
        <div>
          <p className="text-sm font-bold">🏆 지도자 랭킹</p>
          <p className="text-xs text-brand-100">별점·후기·매칭으로 뽑은 우수 지도자를 확인하세요</p>
        </div>
        <span className="text-lg">→</span>
      </Link>

      <SportFilter />

      <div className="flex gap-2">
        <ServiceTab label="전체" href="/recruit" active={!service} sport={sport} />
        {SERVICE_TYPES.map((s) => (
          <ServiceTab
            key={s.key}
            label={`${s.emoji} ${s.label}`}
            href={`/recruit?service=${s.key}`}
            active={service === s.key}
            sport={sport}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {recruits.length === 0 && (
          <div className="card col-span-full p-10 text-center text-sm text-gray-400">
            등록된 모집공고가 없습니다.
          </div>
        )}
        {recruits.map((r) => (
          <Link key={r.id} href={`/recruit/${r.id}`} className="card-link p-5 ">
            <div className="flex items-center gap-1.5">
              <span className={`chip ${RECRUIT_STATUS[r.status].color}`}>
                {RECRUIT_STATUS[r.status].label}
              </span>
              <span className="chip bg-gray-50 text-gray-600">
                {sportEmoji(r.sport)} {r.sport}
              </span>
              <span className="chip bg-brand-50 text-brand-600">
                {serviceLabel(r.serviceType)}
              </span>
            </div>
            <h3 className="mt-2.5 font-bold leading-snug">{r.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{r.content}</p>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>📍 {r.region ?? "지역무관"}</span>
              <span>💰 {r.budget ?? "협의"}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex items-center gap-2">
                <Avatar name={r.author.name} src={r.author.avatar} sport={r.author.sport} size={26} />
                <span className="text-xs text-gray-500">
                  {r.author.name} · {timeAgo(r.createdAt)}
                </span>
              </div>
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span>👁 {r.views}</span>
                <span className="text-red-500">❤️ {r._count.likes}</span>
                <span className="text-brand-600">제안 {r._count.proposals}</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ServiceTab({
  label,
  href,
  active,
  sport,
}: {
  label: string;
  href: string;
  active: boolean;
  sport?: string;
}) {
  const url = sport ? `${href}${href.includes("?") ? "&" : "?"}sport=${sport}` : href;
  return (
    <Link
      href={url}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium ${
        active ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}
