import { levelOf } from "@/lib/level";

// 인라인 등급 뱃지 (닉네임 옆)
export default function LevelBadge({
  points,
  showName = true,
  className = "",
}: {
  points: number;
  showName?: boolean;
  className?: string;
}) {
  const lv = levelOf(points);
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700 ${className}`}
      title={`${lv.name} · 내공 ${points}`}
    >
      <span>{lv.icon}</span>
      <span>Lv.{lv.level}</span>
      {showName && <span className="font-semibold">{lv.name}</span>}
    </span>
  );
}
