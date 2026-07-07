"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAYMENT_STATUS } from "@/lib/constants";
import { won } from "@/lib/format";

type Payment = {
  id: string;
  amount: number;
  status: string;
  payerId: string;
  payeeId: string;
  memo: string | null;
};

type Msg = {
  id: string;
  senderId: string;
  content: string;
  kind: string;
  createdAt: string;
  payment: Payment | null;
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
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMemo, setPayMemo] = useState("");
  const [busyPay, setBusyPay] = useState<string | null>(null);
  const lastAt = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollBox = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // 새 메시지 병합 + 기존 메시지(결제 상태) 갱신
  const merge = useCallback((incoming: Msg[], updates: Msg[] = []) => {
    setMessages((prev) => {
      let next = prev;
      if (updates.length) {
        const upMap = new Map(updates.map((m) => [m.id, m]));
        next = next.map((m) => upMap.get(m.id) ?? m);
      }
      if (incoming.length) {
        const seen = new Set(next.map((m) => m.id));
        const fresh = incoming.filter((m) => !seen.has(m.id));
        if (fresh.length) next = [...next, ...fresh];
      }
      const newestNew = incoming.at(-1)?.createdAt;
      if (newestNew) lastAt.current = newestNew;
      return next === prev ? prev : next;
    });
  }, []);

  // 폴링 (2초마다)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const q = lastAt.current ? `?since=${encodeURIComponent(lastAt.current)}` : "";
        const res = await fetch(`/api/chat/${roomId}${q}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) merge(data.messages ?? [], data.payments ?? []);
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
      else setText(content);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function requestPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Math.floor(Number(payAmount.replace(/[,\s]/g, "")));
    if (!Number.isFinite(amount) || amount < 1000) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "PAYMENT", amount, memo: payMemo.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        merge([data.message]);
        setPayOpen(false);
        setPayAmount("");
        setPayMemo("");
      }
    } finally {
      setSending(false);
    }
  }

  async function actOnPayment(paymentId: string, action: "pay" | "cancel") {
    setBusyPay(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const newStatus = action === "pay" ? "PAID" : "CANCELED";
        setMessages((prev) =>
          prev.map((m) =>
            m.payment?.id === paymentId
              ? { ...m, payment: { ...m.payment, status: newStatus } }
              : m
          )
        );
      }
    } finally {
      setBusyPay(null);
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
          if (m.kind === "PAYMENT" && m.payment) {
            return (
              <PaymentBubble
                key={m.id}
                payment={m.payment}
                meId={meId}
                mine={mine}
                busy={busyPay === m.payment.id}
                onPay={() => actOnPayment(m.payment!.id, "pay")}
                onCancel={() => actOnPayment(m.payment!.id, "cancel")}
                time={m.createdAt}
              />
            );
          }
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

      {/* 결제 요청 모달 */}
      {payOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <form
            onSubmit={requestPayment}
            className="card w-full max-w-sm space-y-3 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">💳 결제 요청 보내기</h3>
              <button type="button" onClick={() => setPayOpen(false)} className="text-gray-400">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              상대방에게 결제를 요청합니다. 상대가 &lsquo;결제하기&rsquo;를 누르면 결제 완료로 기록돼요.
            </p>
            <div>
              <label className="label">금액 (원)</label>
              <input
                inputMode="numeric"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="input"
                placeholder="예: 50000"
                autoFocus
              />
            </div>
            <div>
              <label className="label">메모 (선택)</label>
              <input
                value={payMemo}
                onChange={(e) => setPayMemo(e.target.value)}
                className="input"
                placeholder="예: 3회 레슨비"
              />
            </div>
            <button className="btn-primary w-full" disabled={sending}>
              결제 요청 보내기
            </button>
          </form>
        </div>
      )}

      <form
        onSubmit={send}
        className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 flex gap-2 bg-[var(--bg)] py-2 md:bottom-0"
      >
        <button
          type="button"
          onClick={() => setPayOpen(true)}
          aria-label="결제 요청"
          className="btn-outline shrink-0 !px-3"
          title="결제 요청 보내기"
        >
          💳
        </button>
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

function PaymentBubble({
  payment,
  meId,
  mine,
  busy,
  onPay,
  onCancel,
  time,
}: {
  payment: Payment;
  meId: string;
  mine: boolean;
  busy: boolean;
  onPay: () => void;
  onCancel: () => void;
  time: string;
}) {
  const iAmPayer = payment.payerId === meId;
  const st = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.REQUESTED;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="w-[80%] max-w-xs overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="flex items-center justify-between bg-brand-50 px-4 py-2">
          <span className="text-sm font-bold text-brand-700">💳 안전결제</span>
          <span className={`chip ${st.color}`}>{st.label}</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-xl font-extrabold">{won(payment.amount)}</p>
          {payment.memo && <p className="mt-0.5 text-sm text-gray-500">{payment.memo}</p>}

          {payment.status === "REQUESTED" && iAmPayer && (
            <div className="mt-3 flex gap-2">
              <button onClick={onPay} disabled={busy} className="btn-primary flex-1 !py-2 text-sm">
                {busy ? "처리 중…" : "결제하기"}
              </button>
              <button onClick={onCancel} disabled={busy} className="btn-outline !py-2 text-sm text-gray-500">
                거절
              </button>
            </div>
          )}
          {payment.status === "REQUESTED" && !iAmPayer && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">상대의 결제를 기다리는 중…</p>
              <button onClick={onCancel} disabled={busy} className="text-xs text-gray-400 hover:text-red-500">
                요청 취소
              </button>
            </div>
          )}
          {payment.status === "PAID" && (
            <p className="mt-2 text-xs font-medium text-green-600">✅ 결제가 완료되었어요.</p>
          )}
          {payment.status === "CANCELED" && (
            <p className="mt-2 text-xs text-gray-400">취소된 요청입니다.</p>
          )}
        </div>
        <p className="px-4 pb-2 text-[10px] text-gray-300">
          {new Date(time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
