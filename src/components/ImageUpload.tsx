"use client";

import { useRef, useState } from "react";

export default function ImageUpload({
  name,
  defaultValue,
  variant = "avatar",
  label,
}: {
  name: string;
  defaultValue?: string | null;
  variant?: "avatar" | "cover";
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  const isAvatar = variant === "avatar";

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input type="hidden" name={name} value={url} />

      <div className={isAvatar ? "flex items-center gap-4" : "space-y-2"}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative overflow-hidden border border-gray-200 bg-gray-50 transition hover:opacity-90 ${
            isAvatar ? "h-20 w-20 rounded-full" : "h-28 w-full rounded-xl"
          }`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
              {isAvatar ? "📷" : "🖼️"}
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
              업로드 중…
            </span>
          )}
        </button>

        <div className={isAvatar ? "" : "flex items-center gap-2"}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-ghost text-sm"
            disabled={busy}
          >
            {url ? "사진 변경" : "사진 올리기"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-sm text-red-500 hover:underline"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
