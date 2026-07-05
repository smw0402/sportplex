import Link from "next/link";

const TABS = [
  { href: "/admin", label: "📊 대시보드", key: "dashboard" },
  { href: "/admin/members", label: "👥 회원 관리", key: "members" },
  { href: "/admin/news", label: "📰 뉴스 관리", key: "news" },
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
