"use client";

export default function KakaoButton({ label = "카카오로 시작하기" }: { label?: string }) {
  return (
    <a
      href="/api/auth/kakao"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-base font-semibold text-[#191600] transition hover:brightness-95 active:scale-[0.98]"
    >
      <span className="text-lg" aria-hidden>
        💬
      </span>
      {label}
    </a>
  );
}
