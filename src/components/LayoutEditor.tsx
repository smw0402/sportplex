"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomeLayoutAction } from "@/app/actions/adminExtra";
import { HOME_BLOCKS, type HomeLayoutItem } from "@/lib/homeLayout";

const LABELS: Record<string, { label: string; desc: string }> = Object.fromEntries(
  HOME_BLOCKS.map((b) => [b.key, { label: b.label, desc: b.desc }])
);

export default function LayoutEditor({ initial }: { initial: HomeLayoutItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<HomeLayoutItem[]>(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setSaved(false);
  }

  function toggle(key: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, visible: !i.visible } : i)));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("layout", JSON.stringify(items));
      await saveHomeLayoutAction(fd);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        홈 화면 섹션을 드래그해 순서를 바꾸고, 스위치로 노출 여부를 정하세요. 저장하면 즉시 홈에 반영됩니다.
      </p>

      <ul className="space-y-2">
        {items.map((it, idx) => {
          const meta = LABELS[it.key] ?? { label: it.key, desc: "" };
          return (
            <li
              key={it.key}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) move(dragIdx, idx);
                setDragIdx(null);
              }}
              className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition ${
                dragIdx === idx ? "border-brand-400 opacity-60" : "border-gray-200"
              } ${!it.visible ? "opacity-60" : ""}`}
            >
              <span className="cursor-grab text-gray-300 active:cursor-grabbing" title="드래그해서 이동">
                ⠿
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{meta.label}</p>
                <p className="text-xs text-gray-400">{meta.desc}</p>
              </div>

              {/* 순서 버튼 (모바일 대체 조작) */}
              <div className="flex flex-col">
                <button onClick={() => move(idx, idx - 1)} className="px-1 text-gray-400 hover:text-brand-600" aria-label="위로">▲</button>
                <button onClick={() => move(idx, idx + 1)} className="px-1 text-gray-400 hover:text-brand-600" aria-label="아래로">▼</button>
              </div>

              {/* 표시 토글 */}
              <button
                onClick={() => toggle(it.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  it.visible ? "bg-brand-600" : "bg-gray-300"
                }`}
                aria-label="표시 여부"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    it.visible ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "저장 중…" : "레이아웃 저장"}
        </button>
        {saved && <span className="text-sm text-green-600">✅ 저장됨 — 홈에 반영되었어요.</span>}
      </div>
    </div>
  );
}
