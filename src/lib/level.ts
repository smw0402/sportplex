// 내공(포인트) 기반 성장형 등급 — 네이버 지식iN 벤치마킹
// 자연 → 천체로 자라나는 레벨 사다리
export const LEVELS = [
  { level: 1, name: "씨앗", icon: "🌱", min: 0 },
  { level: 2, name: "새싹", icon: "🌿", min: 10 },
  { level: 3, name: "잎새", icon: "🍃", min: 30 },
  { level: 4, name: "나무", icon: "🌳", min: 60 },
  { level: 5, name: "꽃", icon: "🌸", min: 100 },
  { level: 6, name: "열매", icon: "🍎", min: 170 },
  { level: 7, name: "별", icon: "⭐", min: 280 },
  { level: 8, name: "샛별", icon: "🌟", min: 450 },
  { level: 9, name: "달", icon: "🌙", min: 700 },
  { level: 10, name: "태양", icon: "☀️", min: 1100 },
  { level: 11, name: "은하", icon: "🌌", min: 1700 },
  { level: 12, name: "우주신", icon: "🪐", min: 2600 },
] as const;

export type LevelInfo = {
  level: number;
  name: string;
  icon: string;
  min: number;
  nextMin: number | null; // 다음 등급 필요 내공 (최고면 null)
  toNext: number; // 다음 등급까지 남은 내공
  progress: number; // 현재 등급 구간 진행률 0~1
  isMax: boolean;
};

export function levelOf(points: number): LevelInfo {
  const p = Math.max(0, points | 0);
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (p >= LEVELS[i].min) idx = i;
  }
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const isMax = next === null;
  const nextMin = next?.min ?? null;
  const span = next ? next.min - cur.min : 1;
  const progress = isMax ? 1 : Math.min(1, (p - cur.min) / span);
  const toNext = isMax ? 0 : Math.max(0, next!.min - p);
  return {
    level: cur.level,
    name: cur.name,
    icon: cur.icon,
    min: cur.min,
    nextMin,
    toNext,
    progress,
    isMax,
  };
}
