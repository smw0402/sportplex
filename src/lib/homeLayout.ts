import { prisma } from "@/lib/prisma";

// 홈 화면에서 순서/표시 여부를 조정할 수 있는 블록 정의
export const HOME_BLOCKS = [
  { key: "popular", label: "🔥 인기글", desc: "커뮤니티 인기 게시글 Top 5" },
  { key: "news", label: "📰 종목 뉴스", desc: "직접 등록한 스포츠 뉴스" },
  { key: "recruits", label: "📢 최신 모집공고", desc: "모집중인 레슨·상담 요청" },
  { key: "coaches", label: "⭐ 추천 코치·선생님", desc: "인증·신규 지도자 추천" },
] as const;

export type HomeBlockKey = (typeof HOME_BLOCKS)[number]["key"];
export type HomeLayoutItem = { key: string; visible: boolean };

export const DEFAULT_HOME_LAYOUT: HomeLayoutItem[] = HOME_BLOCKS.map((b) => ({
  key: b.key,
  visible: true,
}));

const KNOWN = new Set(HOME_BLOCKS.map((b) => b.key));

// 저장된 설정을 읽어와 유효한 블록만, 누락된 블록은 뒤에 추가
export async function getHomeLayout(): Promise<HomeLayoutItem[]> {
  const row = await prisma.setting
    .findUnique({ where: { key: "home_layout" } })
    .catch(() => null);

  let stored: HomeLayoutItem[] = [];
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) {
        stored = parsed
          .filter((i) => i && typeof i.key === "string" && KNOWN.has(i.key))
          .map((i) => ({ key: i.key, visible: i.visible !== false }));
      }
    } catch {
      /* 손상된 값은 무시하고 기본값 사용 */
    }
  }

  // 저장에 없는(새로 추가된) 블록은 맨 뒤에 붙임
  const seen = new Set(stored.map((i) => i.key));
  for (const b of HOME_BLOCKS) {
    if (!seen.has(b.key)) stored.push({ key: b.key, visible: true });
  }
  return stored.length ? stored : DEFAULT_HOME_LAYOUT;
}
