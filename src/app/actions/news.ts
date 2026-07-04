"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SPORT_KEYS } from "@/lib/constants";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export async function createNewsAction(_prev: unknown, formData: FormData) {
  if (!(await requireAdmin())) return { error: "권한이 없습니다." };

  const sport = String(formData.get("sport") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!sport || !title || !summary) {
    return { error: "종목, 제목, 요약을 입력해주세요." };
  }

  await prisma.newsItem.create({ data: { sport, title, summary, source, imageUrl } });
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNewsAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("newsId") ?? "");
  await prisma.newsItem.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/");
}

// AI가 생성한 초안 1건을 게시 (관리자 검수 후)
export async function publishNewsAction(formData: FormData) {
  if (!(await requireAdmin())) return;
  const sport = String(formData.get("sport") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || null;
  if (!sport || !title || !summary) return;
  await prisma.newsItem.create({ data: { sport, title, summary, source } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export type NewsDraft = { sport: string; title: string; summary: string; source?: string };

// 웹 검색 기반으로 실제 최신 스포츠 이슈 초안을 생성 (저장하지 않음 → 관리자 검수용)
export async function generateNewsDraftsAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; drafts?: NewsDraft[] }> {
  if (!(await requireAdmin())) return { error: "권한이 없습니다." };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY가 설정되지 않았어요. .env(및 배포 환경변수)에 키를 추가해주세요." };
  }

  const sportInput = String(formData.get("sport") ?? "").trim();
  const sport = SPORT_KEYS.includes(sportInput as never) ? sportInput : "";
  const count = 5;

  const targetLine = sport
    ? `국내·해외 "${sport}" 종목의 최근 주요 뉴스/이슈`
    : "축구·야구·농구·배구 등 인기 스포츠 종목 전반의 최근 주요 뉴스/이슈";

  const prompt = `당신은 스포츠 뉴스 편집자입니다. 웹 검색을 사용해 ${targetLine}를 찾아 최근 순으로 ${count}개를 한국어로 정리하세요.

규칙:
- 반드시 웹 검색으로 확인된 최신·실제 사실만 사용하세요. 추측하거나 지어내지 마세요.
- 오래된 뉴스보다 최근(가능한 한 최근 며칠~몇 주) 이슈를 우선하세요.
- 각 항목 필드: sport(종목), title(간결한 제목), summary(1~2문장 요약), source(출처 매체명).
- title/summary는 자연스러운 한국어로 작성하세요.
- sport 값은 반드시 다음 중 하나여야 합니다: ${SPORT_KEYS.join(", ")}

출력 형식: 오직 JSON 배열만 출력하세요. 마크다운 코드펜스나 다른 설명 없이 아래 형태로만:
[{"sport":"축구","title":"...","summary":"...","source":"..."}]`;

  const client = new Anthropic();
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }] as never;

  try {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    let response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      tools,
      messages,
    });

    // 서버 도구 루프가 10회를 넘겨 일시정지되면 이어서 진행
    let guard = 0;
    while (response.stop_reason === "pause_turn" && guard < 4) {
      messages.push({ role: "assistant", content: response.content as never });
      response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4000,
        tools,
        messages,
      });
      guard++;
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const drafts = parseDrafts(text, sport);
    if (drafts.length === 0) {
      return { error: "이슈를 정리하지 못했어요. 잠시 후 다시 시도해주세요." };
    }
    return { drafts };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 생성 중 오류가 발생했어요.";
    return { error: msg };
  }
}

function parseDrafts(text: string, fallbackSport: string): NewsDraft[] {
  let t = text;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1];
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  let arr: unknown;
  try {
    arr = JSON.parse(t);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: NewsDraft[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? "").trim();
    const summary = String(o.summary ?? "").trim();
    if (!title || !summary) continue;
    let sport = String(o.sport ?? "").trim();
    if (!SPORT_KEYS.includes(sport as never)) sport = fallbackSport || SPORT_KEYS[0];
    const source = String(o.source ?? "").trim() || undefined;
    out.push({ sport, title, summary, source });
  }
  return out.slice(0, 8);
}
