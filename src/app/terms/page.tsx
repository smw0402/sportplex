import Link from "next/link";
import { TERMS_MD } from "@/lib/termsContent";

export const metadata = { title: "이용약관 — Sportplex" };

type TopItem = { text: string; sub: string[] };
type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ol"; items: TopItem[] };

// 약관 마크다운(장 ##, 조 ###, 번호목록 + 1단계 중첩)을 블록으로 파싱
function parse(md: string): Block[] {
  const blocks: Block[] = [];
  let list: TopItem[] | null = null;
  const flush = () => {
    if (list && list.length) blocks.push({ type: "ol", items: list });
    list = null;
  };

  for (const raw of md.split("\n")) {
    if (raw.trim() === "") continue; // 빈 줄은 목록을 끊지 않음
    if (raw.startsWith("### ")) { flush(); blocks.push({ type: "h3", text: raw.slice(4) }); continue; }
    if (raw.startsWith("## ")) { flush(); blocks.push({ type: "h2", text: raw.slice(3) }); continue; }
    if (raw.startsWith("# ")) { flush(); blocks.push({ type: "h1", text: raw.slice(2) }); continue; }

    const sub = raw.match(/^\s+\d+\.\s+(.*)$/); // 들여쓴 하위 항목
    const top = raw.match(/^\d+\.\s+(.*)$/); // 최상위 번호 항목
    if (sub) {
      if (!list) list = [{ text: "", sub: [] }];
      list[list.length - 1].sub.push(sub[1]);
    } else if (top) {
      if (!list) list = [];
      list.push({ text: top[1], sub: [] });
    } else {
      flush();
      blocks.push({ type: "p", text: raw.trim() });
    }
  }
  flush();
  return blocks;
}

export default function TermsPage() {
  const blocks = parse(TERMS_MD);

  return (
    <div className="mx-auto max-w-3xl">
      <article className="card space-y-3 p-6 sm:p-8 text-[15px] leading-relaxed text-gray-700">
        {blocks.map((b, i) => {
          if (b.type === "h1")
            return <h1 key={i} className="text-2xl font-extrabold text-gray-900">{b.text}</h1>;
          if (b.type === "h2")
            return (
              <h2 key={i} className="mt-8 border-t border-gray-100 pt-6 text-lg font-extrabold text-gray-900">
                {b.text}
              </h2>
            );
          if (b.type === "h3")
            return <h3 key={i} className="mt-4 font-bold text-gray-900">{b.text}</h3>;
          if (b.type === "p")
            return <p key={i} className="text-gray-700">{b.text}</p>;
          if (b.type !== "ol") return null;
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5 text-gray-700 marker:text-gray-400">
              {b.items.map((it, j) => (
                <li key={j}>
                  {it.text}
                  {it.sub.length > 0 && (
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-gray-600 marker:text-gray-400">
                      {it.sub.map((s, k) => (
                        <li key={k}>{s}</li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          );
        })}

        <p className="border-t border-gray-100 pt-4 text-sm text-gray-400">
          함께 보기: <Link href="/privacy" className="font-medium text-brand-600">개인정보 처리방침</Link>
        </p>
      </article>
    </div>
  );
}
