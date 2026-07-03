"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SPORTS } from "@/lib/constants";

export default function SportFilter({ param = "sport" }: { param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get(param);

  function select(sport: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (sport) next.set(param, sport);
    else next.delete(param);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => select(null)}
        className={`chip whitespace-nowrap border ${
          !current ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600"
        }`}
      >
        전체
      </button>
      {SPORTS.map((s) => (
        <button
          key={s.key}
          onClick={() => select(s.key)}
          className={`chip whitespace-nowrap border ${
            current === s.key
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white text-gray-600"
          }`}
        >
          {s.emoji} {s.key}
        </button>
      ))}
    </div>
  );
}
