"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { SPORTS } from "@/lib/constants";
import ImageUpload from "@/components/ImageUpload";

type U = {
  name: string;
  nickname: string | null;
  sport: string | null;
  region: string | null;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
};

export default function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="card space-y-4 p-6">
      <ImageUpload name="cover" defaultValue={user.cover} variant="cover" label="커버 사진" />
      <ImageUpload name="avatar" defaultValue={user.avatar} variant="avatar" label="프로필 사진" />
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
      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="label">지역</label>
          <input name="region" className="input" defaultValue={user.region ?? ""} placeholder="서울 강남구" />
        </div>
      </div>
      <div>
        <label className="label">한 줄 소개</label>
        <textarea name="bio" className="input min-h-24" defaultValue={user.bio ?? ""} placeholder="나를 소개해보세요." />
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
