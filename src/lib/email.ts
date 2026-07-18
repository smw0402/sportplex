// 이메일 발송 헬퍼 — Resend(https://resend.com) 사용
// 필요한 환경변수:
//   RESEND_API_KEY : Resend API 키 (re_...)
//   EMAIL_FROM     : 발신 주소 (예: "Sportplex <noreply@yourdomain.com>")
//                    미설정 시 Resend 테스트 주소(onboarding@resend.dev) 사용

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// 간단한 이벤트 메일 레이아웃
export function emailLayout(title: string, body: string, ctaText?: string, ctaLink?: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#1b5cf5;margin:0 0 12px">Sportplex</h2>
      <h3 style="margin:0 0 8px">${title}</h3>
      <p style="color:#444;line-height:1.6">${body}</p>
      ${
        ctaText && ctaLink
          ? `<p style="margin:24px 0"><a href="${ctaLink}" style="background:#1b5cf5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">${ctaText}</a></p>`
          : ""
      }
      <p style="color:#aaa;font-size:12px;margin-top:24px">알림 수신을 원치 않으시면 프로필 설정에서 변경하세요.</p>
    </div>`;
}

// 회원 이메일로 이벤트 알림 발송 (설정·유효 이메일일 때만). 실패는 조용히 무시.
export async function sendUserEmail(userId: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { prisma } = await import("@/lib/prisma");
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, deletedAt: true },
    });
    if (!u || !u.email || u.email.endsWith("@kakao.local") || u.deletedAt) return;
    await sendEmail({ to: u.email, subject, html });
  } catch {
    /* 무시 */
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "not_configured" };

  const from = process.env.EMAIL_FROM || "Sportplex <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      return { ok: false, reason: `send_failed_${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}
