// 이메일 발송 헬퍼 — Resend(https://resend.com) 사용
// 필요한 환경변수:
//   RESEND_API_KEY : Resend API 키 (re_...)
//   EMAIL_FROM     : 발신 주소 (예: "Sportplex <noreply@yourdomain.com>")
//                    미설정 시 Resend 테스트 주소(onboarding@resend.dev) 사용

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
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
