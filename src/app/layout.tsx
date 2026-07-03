import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatUnread } from "@/lib/chatUnread";

export const metadata: Metadata = {
  title: "Sportplex — 스포츠 코칭·커뮤니티",
  description:
    "선수·지도자가 소통하는 스포츠 커뮤니티, 코치·레슨 매칭까지 한 번에.",
  applicationName: "Sportplex",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/apple-icon" },
  // iOS 홈 화면 앱(웹앱) 모드
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sportplex",
  },
  // 구형 iOS 홈화면 전체화면 호환 명시
  other: { "apple-mobile-web-app-capable": "yes" },
  // 전화번호 등 자동 링크 방지(디자인 깨짐 방지)
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#1b5cf5",
  width: "device-width",
  initialScale: 1,
  // 노치·다이내믹아일랜드까지 화면 꽉 채우기
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const sessionUser = user
    ? {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        sport: user.sport,
        isAdmin: user.isAdmin,
      }
    : null;

  const [unread, chat] = user
    ? await Promise.all([
        prisma.notification.count({ where: { userId: user.id, read: false } }),
        getChatUnread(user.id),
      ])
    : [0, { total: 0 }];

  return (
    <html lang="ko">
      <body>
        <NavBar user={sessionUser} unread={unread} chatUnread={chat.total} />
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
