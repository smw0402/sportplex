"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { ROLES, SPORTS } from "@/lib/constants";
import RegionPicker from "@/components/RegionPicker";
import KakaoButton from "@/components/KakaoButton";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, null);
  const [role, setRole] = useState("STUDENT");

  // 약관 동의 상태
  const [agree, setAgree] = useState({
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  });
  const requiredOk = agree.age && agree.terms && agree.privacy;
  const allChecked = requiredOk && agree.marketing;
  const toggle = (k: keyof typeof agree) => setAgree((a) => ({ ...a, [k]: !a[k] }));
  const toggleAll = () => {
    const next = !allChecked;
    setAgree({ age: next, terms: next, privacy: next, marketing: next });
  };

  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="text-2xl font-extrabold">회원가입</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sportplex에서 코치·감독·레슨선생님과 학생·학부모를 연결하세요.
      </p>

      {/* 카카오 간편 가입 */}
      <div className="mt-6">
        <KakaoButton label="카카오로 3초 만에 시작하기" />
        <p className="mt-2 text-center text-xs text-gray-400">
          카카오로 시작하면 이용약관·개인정보 처리방침에 동의한 것으로 간주됩니다.
        </p>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> 또는 이메일로 가입 <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={action} className="card space-y-4 p-6">
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
                <input
                  type="radio"
                  name="role"
                  value={r.key}
                  checked={role === r.key}
                  onChange={() => setRole(r.key)}
                  className="hidden"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">이름</label>
            <input name="name" autoComplete="name" className="input" placeholder="홍길동" required />
          </div>
          <div>
            <label className="label">닉네임</label>
            <input name="nickname" autoComplete="nickname" className="input" placeholder="커뮤니티 표시 이름" />
          </div>
        </div>
        <p className="-mt-2 text-xs text-gray-400">닉네임은 커뮤니티 글·댓글에 표시돼요. (비우면 이름으로 표시)</p>

        <div>
          <label className="label">주 종목</label>
          <select name="sport" className="input" defaultValue="">
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
            <input name="school" className="input" placeholder="예: 한국체육대학교" />
          </div>
          <div>
            <label className="label">소속 팀·클럽</label>
            <input name="team" className="input" placeholder="예: 서울FC 유소년" />
          </div>
        </div>
        <RegionPicker />

        <div>
          <label className="label">이메일</label>
          <input name="email" type="email" autoComplete="username" className="input" placeholder="you@email.com" required />
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input name="password" type="password" autoComplete="new-password" className="input" placeholder="6자 이상" required />
        </div>

        {/* 약관 동의 */}
        <div className="rounded-xl border border-gray-200 p-4">
          <label className="flex cursor-pointer items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="h-5 w-5 rounded border-gray-300"
            />
            전체 동의 (선택 항목 포함)
          </label>

          <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
            <ConsentRow
              name="agreeAge"
              checked={agree.age}
              onChange={() => toggle("age")}
              required
            >
              만 14세 이상입니다
            </ConsentRow>
            <ConsentRow
              name="agreeTerms"
              checked={agree.terms}
              onChange={() => toggle("terms")}
              required
            >
              <Link href="/terms" target="_blank" className="font-medium text-brand-600 underline">
                이용약관
              </Link>
              에 동의
            </ConsentRow>
            <ConsentRow
              name="agreePrivacy"
              checked={agree.privacy}
              onChange={() => toggle("privacy")}
              required
            >
              <Link href="/privacy" target="_blank" className="font-medium text-brand-600 underline">
                개인정보 수집·이용
              </Link>
              에 동의
            </ConsentRow>
            <ConsentRow
              name="marketing"
              checked={agree.marketing}
              onChange={() => toggle("marketing")}
            >
              마케팅·이벤트 정보 수신 동의
            </ConsentRow>
          </div>

          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
            Sportplex는 회원 간 거래를 중개하는 <b>통신판매중개자</b>로서 거래의 당사자가 아니며, 회원(코치 등)의 행위로
            인한 책임은 해당 회원에게 있습니다. 자세한 내용은 이용약관 제3조·제4조를 확인하세요.
          </p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <button className="btn-primary w-full !py-3" disabled={pending || !requiredOk}>
          {pending ? "가입 중..." : !requiredOk ? "필수 약관에 동의해주세요" : "가입하고 시작하기"}
        </button>
        <p className="text-center text-sm text-gray-500">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-brand-600">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}

function ConsentRow({
  name,
  checked,
  onChange,
  required,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      {/* 체크 시에만 폼에 전송됨 */}
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300"
      />
      <span className={required ? "text-brand-600" : "text-gray-400"}>
        [{required ? "필수" : "선택"}]
      </span>
      <span>{children}</span>
    </label>
  );
}
