"use client";

import { Suspense, useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import { loginAction } from "@/app/actions/auth";
import KakaoButton from "@/components/KakaoButton";

const ERROR_MESSAGES: Record<string, string> = {
  kakao: "카카오 로그인에 실패했어요. 다시 시도해주세요.",
  kakao_config: "카카오 로그인이 아직 설정되지 않았어요. (관리자 환경변수 필요)",
  suspended: "이용이 정지된 계정입니다. 고객센터로 문의해주세요.",
};

function LoginInner() {
  const [state, action, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const urlError = params.get("error");
  const [pkBusy, setPkBusy] = useState(false);
  const [pkError, setPkError] = useState<string | null>(null);

  async function loginWithPasskey() {
    setPkBusy(true);
    setPkError(null);
    try {
      const optRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const optionsJSON = await optRes.json();
      if (!optRes.ok) throw new Error(optionsJSON.error ?? "패스키 로그인을 시작할 수 없어요.");

      const assertion = await startAuthentication({ optionsJSON });

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error ?? "인증에 실패했어요.");
      router.push("/");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "패스키 로그인 실패";
      // 사용자가 취소한 경우는 조용히 무시
      if (!/cancel|abort|NotAllowed/i.test(msg)) setPkError(msg);
    } finally {
      setPkBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-extrabold">로그인</h1>
      <p className="mt-1 text-sm text-gray-500">Sportplex에 다시 오신 걸 환영해요.</p>

      {urlError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {ERROR_MESSAGES[urlError] ?? "로그인 중 문제가 발생했어요."}
        </p>
      )}

      {/* 카카오 로그인 */}
      <div className="mt-6">
        <KakaoButton label="카카오로 3초 만에 시작하기" />
      </div>

      {/* 패스키(Face ID / 지문 / 기기 PIN) 로그인 */}
      <button
        onClick={loginWithPasskey}
        disabled={pkBusy}
        className="btn-outline mt-3 w-full !py-3 text-base"
      >
        {pkBusy ? "인증 중..." : "🔐 Face ID · 지문으로 로그인"}
      </button>
      {pkError && <p className="mt-2 text-sm text-red-600">{pkError}</p>}

      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> 또는 비밀번호 <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={action} className="card space-y-4 p-6">
        <div>
          <label className="label">이메일</label>
          <input
            name="email"
            type="email"
            autoComplete="username"
            className="input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input name="password" type="password" autoComplete="current-password" className="input" required />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-gray-300" />
          로그인 상태 유지 (30일)
        </label>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <button className="btn-primary w-full !py-3" disabled={pending}>
          {pending ? "로그인 중..." : "로그인"}
        </button>
        <p className="text-center text-sm text-gray-500">
          계정이 없나요?{" "}
          <Link href="/signup" className="font-semibold text-brand-600">
            회원가입
          </Link>
        </p>

        <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
          🧪 데모 계정 — coach.kim@demo.com · parent.lee@demo.com (비밀번호: <b>demo1234</b>)
          <br />
          🔐 패스키는 로그인 후 <b>프로필 편집</b>에서 등록할 수 있어요.
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-10 text-center text-sm text-gray-400">불러오는 중…</div>}>
      <LoginInner />
    </Suspense>
  );
}
