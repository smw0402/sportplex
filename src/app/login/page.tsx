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

const fieldClass =
  "w-full rounded-xl bg-gray-100 px-4 py-3.5 text-[15px] outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

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
      if (!/cancel|abort|NotAllowed/i.test(msg)) setPkError(msg);
    } finally {
      setPkBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-2 py-12">
      <h1 className="text-center text-3xl font-extrabold">로그인</h1>
      <p className="mt-2 text-center text-sm text-gray-500">Sportplex에 다시 오신 걸 환영해요.</p>

      {(urlError || pkError) && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {pkError ?? ERROR_MESSAGES[urlError!] ?? "로그인 중 문제가 발생했어요."}
        </p>
      )}

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold">이메일</label>
          <input
            name="email"
            type="email"
            autoComplete="username"
            className={fieldClass}
            placeholder="kim@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">비밀번호</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className={fieldClass}
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>

        <input type="hidden" name="remember" value="on" />

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <button
          className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-bold text-white transition hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/find" className="text-sm text-gray-400 hover:text-gray-600">
          아이디/비번 찾기
        </Link>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> 또는 <span className="h-px flex-1 bg-gray-200" />
      </div>

      <KakaoButton label="카카오로 시작하기" />

      <button
        onClick={loginWithPasskey}
        disabled={pkBusy}
        className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-brand-600"
      >
        {pkBusy ? "인증 중..." : "🔐 Face ID · 지문으로 로그인"}
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-brand-600">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm py-12 text-center text-sm text-gray-400">불러오는 중…</div>}>
      <LoginInner />
    </Suspense>
  );
}
