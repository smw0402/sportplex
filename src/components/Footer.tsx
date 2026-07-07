import Link from "next/link";
import { COMPANY } from "@/lib/legal";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 text-xs leading-relaxed text-gray-400 md:pb-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-gray-500">
          <Link href="/terms" className="hover:text-brand-600">이용약관</Link>
          <Link href="/privacy" className="font-semibold text-gray-700 hover:text-brand-600">
            개인정보 처리방침
          </Link>
          <Link href="/support" className="hover:text-brand-600">1:1 문의</Link>
          <span className="text-gray-300">|</span>
          <span>문의 {COMPANY.email}</span>
        </div>

        <p className="mt-3">
          {COMPANY.service} · 대표 {COMPANY.ceo} · 문의 {COMPANY.email}
        </p>

        <p className="mt-3 text-gray-400">
          {COMPANY.service}는 회원 간 스포츠 코칭·레슨 거래를 중개하는 <b>통신판매중개자</b>이며 거래의 당사자가
          아닙니다. 회원 간 거래·분쟁 및 회원(코치 등)의 행위로 인한 책임은 해당 회원에게 있습니다.
        </p>
      </div>
    </footer>
  );
}
