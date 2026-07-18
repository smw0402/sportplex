"use client";

import { useActionState, useState } from "react";
import { saveOnboardingAction } from "@/app/actions/auth";
import { ROLES, SPORTS } from "@/lib/constants";
import RegionPicker from "@/components/RegionPicker";

export default function OnboardingForm({
  defaultRole,
  defaultSport,
  defaultRegion,
}: {
  defaultRole: string;
  defaultSport: string | null;
  defaultRegion: string | null;
}) {
  const [state, action, pending] = useActionState(saveOnboardingAction, null);
  const [role, setRole] = useState(defaultRole);

  return (
    <form action={action} className="card space-y-5 p-6">
      <div>
        <label className="label">나는…</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label
              key={r.key}
              className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm font-medium leading-tight [word-break:keep-all] transition ${
                role === r.key
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <input type="radio" name="role" value={r.key} checked={role === r.key} onChange={() => setRole(r.key)} className="hidden" />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">관심 종목</label>
        <select name="sport" className="input" defaultValue={defaultSport ?? ""}>
          <option value="">선택 안 함</option>
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.emoji} {s.key}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">선택하면 홈에서 이 종목 소식·코치·공고를 먼저 보여드려요.</p>
      </div>

      <RegionPicker defaultValue={defaultRegion} />

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <button className="btn-primary w-full !py-3" disabled={pending}>
        {pending ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
