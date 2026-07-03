"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { POST_CATEGORIES } from "@/lib/constants";

export default function CategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("category");

  function select(cat: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (cat) next.set("category", cat);
    else next.delete("category");
    router.push(`${pathname}?${next.toString()}`);
  }

  const base =
    "chip whitespace-nowrap border transition";
  const on = "border-brand-500 bg-brand-50 text-brand-700";
  const off = "border-gray-200 bg-white text-gray-600";

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button onClick={() => select(null)} className={`${base} ${!current ? on : off}`}>
        전체
      </button>
      {POST_CATEGORIES.map((c) => (
        <button
          key={c.key}
          onClick={() => select(c.key)}
          className={`${base} ${current === c.key ? on : off}`}
        >
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
  );
}
