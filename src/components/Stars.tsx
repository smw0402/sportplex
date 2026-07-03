// 별점 표시 (읽기 전용). 0.5 단위 반올림 없이 채움 개수만 단순 표시.
export default function Stars({
  value,
  size = "text-sm",
}: {
  value: number;
  size?: string;
}) {
  const full = Math.round(value);
  return (
    <span className={`${size} leading-none tracking-tight`} aria-label={`별점 ${value}`}>
      <span className="text-amber-400">{"★".repeat(full)}</span>
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
