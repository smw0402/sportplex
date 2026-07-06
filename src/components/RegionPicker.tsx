"use client";

import { useState } from "react";
import { REGIONS, SIDO_LIST, parseRegion } from "@/lib/regions";

// 시/도 → 시/군/구 → 읍/면/동 계단식 선택. 합쳐서 hidden name="region" 으로 전송.
export default function RegionPicker({
  name = "region",
  defaultValue,
  label = "지역",
}: {
  name?: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const init = parseRegion(defaultValue);
  const [sido, setSido] = useState(init.sido);
  const [sigungu, setSigungu] = useState(init.sigungu);
  const [dong, setDong] = useState(init.dong);

  const sigunguList = sido ? REGIONS[sido] ?? [] : [];
  const combined = [sido, sigungu, dong.trim()].filter(Boolean).join(" ");

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={combined} />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input"
          value={sido}
          onChange={(e) => {
            setSido(e.target.value);
            setSigungu("");
          }}
        >
          <option value="">시/도</option>
          {SIDO_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="input disabled:bg-gray-100 disabled:text-gray-400"
          value={sigungu}
          disabled={!sido || sigunguList.length === 0}
          onChange={(e) => setSigungu(e.target.value)}
        >
          <option value="">
            {sido && sigunguList.length === 0 ? "해당 없음" : "시/군/구"}
          </option>
          {sigunguList.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <input
        className="input mt-2"
        value={dong}
        onChange={(e) => setDong(e.target.value)}
        placeholder="읍/면/동 (예: 역삼동 · 선택)"
      />
    </div>
  );
}
