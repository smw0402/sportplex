import { sportEmoji } from "@/lib/constants";

export default function Avatar({
  name,
  src,
  sport,
  size = 40,
}: {
  name: string;
  src?: string | null;
  sport?: string | null;
  size?: number;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover bg-gray-100"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = name?.trim()?.[0] ?? "?";
  return (
    <div
      className="rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={name}
    >
      {sport ? sportEmoji(sport) : initial}
    </div>
  );
}
