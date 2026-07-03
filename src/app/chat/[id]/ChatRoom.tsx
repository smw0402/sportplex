"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function ChatRoom({
  roomId,
  meId,
  initialMessages,
}: {
  roomId: string;
  meId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastAt = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollBox = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // 새 메시지 병합 (중복 제거)
  const merge = useCallback((incoming: Msg[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      const next = [...prev, ...fresh];
      lastAt.current = next.at(-1)?.createdAt;
      return next;
    });
  }, []);

  // 폴링 (2초마다 새 메시지 확인)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const q = lastAt.current ? `?since=${encodeURIComponent(lastAt.current)}` : "";
        const res = await fetch(`/api/chat/${roomId}${q}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) merge(data.messages ?? []);
      } catch {
        /* 네트워크 일시 오류 무시 */
      }
    };
    const interval = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [roomId, merge]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok && data.message) merge([data.message]);
      else setText(content); // 실패 시 입력 복원
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div ref={scrollBox} className="flex-1 space-y-2.5 overflow-y-auto px-1 pb-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            첫 메시지를 보내 대화를 시작해보세요 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[15px] ${
                  mine
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm border border-gray-100 bg-white text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-gray-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 flex gap-2 bg-[var(--bg)] py-2 md:bottom-0"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          placeholder="메시지를 입력하세요"
          autoComplete="off"
        />
        <button className="btn-primary shrink-0" disabled={sending || !text.trim()}>
          전송
        </button>
      </form>
    </>
  );
}
