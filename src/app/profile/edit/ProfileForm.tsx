"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { SPORTS, THEME_COLORS } from "@/lib/constants";
import ImageUpload from "@/components/ImageUpload";
import RegionPicker from "@/components/RegionPicker";

type U = {
  name: string;
  nickname: string | null;
  sport: string | null;
  region: string | null;
  school: string | null;
  team: string | null;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  themeColor: string | null;
  instagram: string | null;
  youtube: string | null;
};

export default function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const [theme, setTheme] = useState(user.themeColor ?? "brand");

  return (
    <form action={action} className="card space-y-4 p-6">
      <ImageUpload name="cover" defaultValue={user.cover} variant="cover" label="커버 사진" />
      <ImageUpload name="avatar" defaultValue={user.avatar} variant="avatar" label="프로필 사진" />

      {/* 테마 색상 */}
      <div>
        <label className="label">프로필 테마 색상</label>
        <p className="-mt-1 mb-2 text-xs text-gray-400">커버 사진이 없을 때 이 색상이 배경으로 쓰여요.</p>
        <input type="hidden" name="themeColor" value={theme} />
        <div className="flex flex-wrap gap-2.5">
          {THEME_COLORS.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setTheme(c.key)}
              aria-label={c.label}
              className={`h-9 w-9 rounded-full ring-2 ring-offset-2 transition ${
                theme === c.key ? "ring-gray-800" : "ring-transparent hover:ring-gray-300"
              }`}
              style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">이름</label>
          <input name="name" className="input" defaultValue={user.name} required />
        </div>
        <div>
          <label className="label">닉네임</label>
          <input name="nickname" className="input" defaultValue={user.nickname ?? ""} placeholder="커뮤니티 표시 이름" />
        </div>
      </div>
      <div>
        <label className="label">주 종목</label>
        <select name="sport" className="input" defaultValue={user.sport ?? ""}>
          <option value="">선택 안 함</option>
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.emoji} {s.key}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">소속 학교</label>
          <input name="school" className="input" defaultValue={user.school ?? ""} placeholder="예: 한국체육대학교" />
        </div>
        <div>
          <label className="label">소속 팀·클럽</label>
          <input name="team" className="input" defaultValue={user.team ?? ""} placeholder="예: 서울FC 유소년" />
        </div>
      </div>
      <RegionPicker defaultValue={user.region} />
      <div>
        <label className="label">한 줄 소개</label>
        <textarea name="bio" className="input min-h-24" defaultValue={user.bio ?? ""} placeholder="나를 소개해보세요." />
      </div>

      {/* 소셜 링크 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">📷 인스타그램</label>
          <input name="instagram" className="input" defaultValue={user.instagram ?? ""} placeholder="아이디 (@ 제외)" />
        </div>
        <div>
          <label className="label">▶️ 유튜브</label>
          <input name="youtube" className="input" defaultValue={user.youtube ?? ""} placeholder="채널 URL" />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button className="btn-primary w-full !py-3" disabled={pending}>
        {pending ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}
