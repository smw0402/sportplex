"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { deleteCredentialAction } from "@/app/actions/profile";

type Cred = { id: string; deviceName: string | null; createdAt: string };

export default function PasskeyManager({ credentials }: { credentials: Cred[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function registerPasskey() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/webauthn/register/options", { method: "POST" });
      const optionsJSON = await optRes.json();
      if (!optRes.ok) throw new Error(optionsJSON.error ?? "등록을 시작할 수 없어요.");

      const reg = await startRegistration({ optionsJSON });

      // 기기 이름 추정 (브라우저/OS 힌트)
      const deviceName =
        /iphone|ipad/i.test(navigator.userAgent)
          ? "iPhone/iPad (Face ID·지문)"
          : /android/i.test(navigator.userAgent)
            ? "Android (지문·잠금)"
            : /mac/i.test(navigator.userAgent)
              ? "Mac (Touch ID)"
              : "이 기기";

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: reg, deviceName }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error ?? "패스키 등록 실패");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "패스키 등록 실패";
      if (!/cancel|abort|NotAllowed/i.test(msg)) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <h2 className="font-bold">🔐 패스키 (Face ID · 지문 · 기기 잠금)</h2>
      <p className="mt-1 text-sm text-gray-500">
        이 기기를 등록하면 다음부터 비밀번호 없이 Face ID·지문·기기 PIN으로 로그인할 수 있어요.
      </p>

      <div className="mt-4 space-y-2">
        {credentials.length === 0 && (
          <p className="text-sm text-gray-400">아직 등록된 패스키가 없어요.</p>
        )}
        {credentials.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3">
            <span className="text-lg">🔑</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.deviceName ?? "패스키"}</p>
              <p className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleDateString("ko-KR")} 등록
              </p>
            </div>
            <form action={deleteCredentialAction}>
              <input type="hidden" name="credentialId" value={c.id} />
              <button className="text-sm text-red-500 hover:underline">삭제</button>
            </form>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button onClick={registerPasskey} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? "등록 중..." : "+ 이 기기로 패스키 등록"}
      </button>
    </section>
  );
}
