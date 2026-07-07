"use client";

import { useState } from "react";

// 자주 틀리는 한국어 맞춤법 간이 규칙 (완전한 검사기는 아니며 대표적 오류를 잡아줍니다)
const RULES: { wrong: string; right: string; note?: string }[] = [
  { wrong: "됬", right: "됐", note: "'되었'의 준말은 '됐'" },
  { wrong: "되요", right: "돼요" },
  { wrong: "되서", right: "돼서" },
  { wrong: "안되", right: "안 돼", note: "문맥에 따라 '안 돼/안 되-'" },
  { wrong: "몇일", right: "며칠" },
  { wrong: "왠만", right: "웬만" },
  { wrong: "웬지", right: "왠지" },
  { wrong: "금새", right: "금세" },
  { wrong: "오랫만", right: "오랜만" },
  { wrong: "어의없", right: "어이없" },
  { wrong: "희안", right: "희한" },
  { wrong: "역활", right: "역할" },
  { wrong: "설레임", right: "설렘" },
  { wrong: "바램", right: "바람", note: "희망의 뜻은 '바람'" },
  { wrong: "어떻해", right: "어떡해" },
  { wrong: "할께", right: "할게" },
  { wrong: "할꺼", right: "할 거" },
  { wrong: "들어나", right: "드러나" },
  { wrong: "문안하", right: "무난하" },
  { wrong: "뵈요", right: "봬요" },
  { wrong: "낳는게", right: "낫는 게", note: "더 좋다는 뜻은 '낫다'" },
  { wrong: "뭐에요", right: "뭐예요" },
  { wrong: "예기", right: "얘기" },
  { wrong: "곰곰히", right: "곰곰이" },
  { wrong: "일일히", right: "일일이" },
  { wrong: "깨끗히", right: "깨끗이" },
  { wrong: "간간히", right: "간간이" },
];

export default function SpellCheck() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<
    { wrong: string; right: string; note?: string; count: number }[] | null
  >(null);

  function check() {
    const found: { wrong: string; right: string; note?: string; count: number }[] = [];
    for (const r of RULES) {
      const count = text.split(r.wrong).length - 1;
      if (count > 0) found.push({ ...r, count });
    }
    setResults(found);
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="input min-h-32"
        placeholder="검사할 문장을 붙여넣으세요. (뉴스·공지 등 발행 전 점검용)"
      />
      <div className="flex items-center gap-3">
        <button onClick={check} className="btn-primary">맞춤법 검사</button>
        <span className="text-xs text-gray-400">{text.length}자</span>
      </div>

      {results && (
        results.length === 0 ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            ✅ 자주 틀리는 표현은 발견되지 않았어요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {results.map((r) => (
              <li key={r.wrong} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm">
                <span className="font-semibold text-red-500 line-through">{r.wrong}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-green-700">{r.right}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {r.count}회{r.note ? ` · ${r.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )
      )}
      <p className="text-xs text-gray-400">
        ※ 대표적인 오류만 잡아주는 간이 검사기입니다. 정밀 검사가 필요하면 국립국어원 맞춤법 검사기를 함께 활용하세요.
      </p>
    </div>
  );
}
