import Link from "next/link";

const TABS = [
  { href: "/admin", label: "📊 대시보드", key: "dashboard" },
  { href: "/admin/stats", label: "📈 통계", key: "stats" },
  { href: "/admin/members", label: "👥 고객 관리", key: "members" },
  { href: "/admin/payments", label: "💳 결제 관리", key: "payments" },
  { href: "/admin/inquiries", label: "📨 1:1 문의", key: "inquiries" },
  { href: "/admin/news", label: "📰 콘텐츠", key: "news" },
  { href: "/admin/schools", label: "🏫 학교 DB", key: "schools" },
  { href: "/admin/layout", label: "🧩 레이아웃", key: "layout" },
  { href: "/admin/logs", label: "🐞 오류 로그", key: "logs" },
];

export default function AdminNav({ active }: { active: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <h1 className="text-xl font-extrabold">🛠️ 관리자</h1>
        <span className="chip bg-gray-900 text-white">ADMIN</span>
      </div>
      <nav className="ml-auto -mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`chip whitespace-nowrap border ${
              active === t.key
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
