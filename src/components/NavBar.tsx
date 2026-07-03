"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { roleLabel, isClient } from "@/lib/constants";

type SessionUser = {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
  sport?: string | null;
  isAdmin?: boolean;
} | null;

// 하단 탭 + 데스크톱 상단 메뉴 (랭킹은 모집공고 안으로 이동, 프로필은 상단 아바타)
const NAV = [
  { href: "/", label: "홈", short: "홈", icon: "🏠" },
  { href: "/board", label: "커뮤니티", short: "커뮤니티", icon: "💬" },
  { href: "/recruit", label: "모집공고", short: "모집공고", icon: "📢" },
  { href: "/chat", label: "채팅", short: "채팅", icon: "💌" },
];

export default function NavBar({
  user,
  unread = 0,
  chatUnread = 0,
}: {
  user: SessionUser;
  unread?: number;
  chatUnread?: number;
}) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const badgeFor = (href: string) => (href === "/chat" ? chatUnread : 0);

  const Bell = user ? (
    <Link
      href="/notifications"
      aria-label="알림"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 ${
        active("/notifications") ? "bg-brand-50" : ""
      }`}
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  ) : null;

  return (
    <>
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 pt-safe backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-1.5 font-extrabold text-lg">
            <span className="text-brand-600">⚡</span>
            <span className="tracking-tight">
              sport<span className="text-brand-600">plex</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active(n.href) ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {n.label}
                {badgeFor(n.href) > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badgeFor(n.href) > 99 ? "99+" : badgeFor(n.href)}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* 검색 (데스크톱) */}
          <form action="/search" className="ml-auto hidden w-64 md:block">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                🔍
              </span>
              <input
                name="q"
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                placeholder="코치·종목·공고 검색"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:ml-3">
            {/* 검색 (모바일) */}
            <Link
              href="/search"
              aria-label="검색"
              className={`flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 md:hidden ${
                active("/search") ? "bg-brand-50" : ""
              }`}
            >
              🔍
            </Link>

            {Bell}

            {user ? (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden btn !bg-gray-900 !px-3 !py-2 text-xs text-white hover:!bg-gray-700 sm:inline-flex"
                  >
                    🛠️ 관리자
                  </Link>
                )}
                <Link
                  href={isClient(user.role) ? "/recruit/new" : "/board/new"}
                  className="hidden btn-primary !px-3 !py-2 text-xs sm:inline-flex"
                >
                  {isClient(user.role) ? "+ 레슨 요청" : "+ 질문 작성"}
                </Link>
                {/* 프로필: 상단 아바타 클릭 */}
                <Link href={`/u/${user.id}`} className="ml-0.5 flex items-center gap-2" aria-label="내 프로필">
                  <Avatar name={user.name} src={user.avatar} sport={user.sport} size={34} />
                  <span className="hidden text-sm font-semibold sm:block">
                    {user.name}
                    <span className="ml-1 text-xs font-normal text-gray-400">{roleLabel(user.role)}</span>
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost shrink-0 !px-2.5 !py-1.5 text-xs sm:text-sm">
                  로그인
                </Link>
                <Link href="/signup" className="btn-primary shrink-0 !px-2.5 !py-1.5 text-xs sm:text-sm">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 하단 탭 (모바일) — 홈·커뮤니티·모집공고·채팅 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white pb-safe md:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                active(n.href) ? "text-brand-600" : "text-gray-500"
              }`}
            >
              <span className="relative text-lg leading-none">
                {n.icon}
                {badgeFor(n.href) > 0 && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badgeFor(n.href) > 99 ? "99+" : badgeFor(n.href)}
                  </span>
                )}
              </span>
              {n.short}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
