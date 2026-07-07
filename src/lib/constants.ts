export const SPORTS = [
  // 구기/엘리트 종목
  { key: "축구", emoji: "⚽" },
  { key: "농구", emoji: "🏀" },
  { key: "야구", emoji: "⚾" },
  { key: "배구", emoji: "🏐" },
  { key: "테니스", emoji: "🎾" },
  { key: "골프", emoji: "⛳" },
  { key: "배드민턴", emoji: "🏸" },
  { key: "탁구", emoji: "🏓" },
  { key: "스쿼시", emoji: "🎾" },
  { key: "볼링", emoji: "🎳" },
  // 무도/격투
  { key: "태권도", emoji: "🥋" },
  { key: "복싱", emoji: "🥊" },
  { key: "주짓수", emoji: "🥋" },
  { key: "검도", emoji: "⚔️" },
  // 생활체육/피트니스
  { key: "수영", emoji: "🏊" },
  { key: "헬스/PT", emoji: "💪" },
  { key: "필라테스", emoji: "🧘" },
  { key: "요가", emoji: "🧘‍♀️" },
  { key: "크로스핏", emoji: "🏋️" },
  { key: "러닝/마라톤", emoji: "🏃" },
  { key: "클라이밍", emoji: "🧗" },
  { key: "스피닝/사이클", emoji: "🚴" },
  { key: "댄스", emoji: "💃" },
  { key: "발레", emoji: "🩰" },
  { key: "스케이트", emoji: "⛸️" },
  { key: "스키/보드", emoji: "⛷️" },
] as const;

export const SPORT_KEYS = SPORTS.map((s) => s.key);

export function sportEmoji(sport?: string | null) {
  return SPORTS.find((s) => s.key === sport)?.emoji ?? "🏅";
}

export const ROLES = [
  { key: "STUDENT", label: "학생", group: "client" },
  { key: "PARENT", label: "학부모", group: "client" },
  { key: "COACH", label: "코치", group: "provider" },
  { key: "DIRECTOR", label: "감독", group: "provider" },
  { key: "TEACHER", label: "운동레슨 선생님", group: "provider" },
  { key: "MENTOR", label: "멘토", group: "provider" },
] as const;

export type RoleKey = (typeof ROLES)[number]["key"];

// 서비스 제공(지도자) 역할 키 목록 — DB 조회 등에 사용
export const PROVIDER_ROLE_KEYS = ROLES.filter((r) => r.group === "provider").map(
  (r) => r.key
);

export function roleLabel(role?: string | null) {
  return ROLES.find((r) => r.key === role)?.label ?? "회원";
}

// 커뮤니티 표시 이름: 닉네임이 있으면 닉네임, 없으면 이름
export function displayName(u?: { nickname?: string | null; name?: string | null } | null) {
  return u?.nickname?.trim() || u?.name || "회원";
}

// 서비스를 "제공"하는 쪽인지 (코치/감독/레슨선생님/멘토)
export function isProvider(role?: string | null) {
  return ROLES.some((r) => r.key === role && r.group === "provider");
}
// 서비스를 "받는" 쪽인지 (학생/학부모)
export function isClient(role?: string | null) {
  return ROLES.some((r) => r.key === role && r.group === "client");
}

// 커뮤니티 카테고리
export const POST_CATEGORIES = [
  { key: "FREE", label: "자유", emoji: "💬" },
  { key: "QUESTION", label: "질문", emoji: "❓" },
  { key: "INFO", label: "정보·팁", emoji: "💡" },
  { key: "TEAMUP", label: "같이운동", emoji: "🤝" },
  { key: "REVIEW", label: "후기", emoji: "⭐" },
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number]["key"];

export function categoryMeta(key?: string | null) {
  return POST_CATEGORIES.find((c) => c.key === key) ?? POST_CATEGORIES[0];
}

// 신고 사유
export const REPORT_REASONS = [
  "스팸/광고",
  "욕설/비방",
  "음란/불쾌감",
  "허위/사기",
  "자격·경력 사칭",
  "개인정보 노출",
  "기타",
] as const;

export const REPORT_TARGET_LABEL: Record<string, string> = {
  USER: "회원",
  POST: "게시글",
  COMMENT: "댓글",
  RECRUITMENT: "모집공고",
};

export const SERVICE_TYPES = [
  { key: "LESSON", label: "운동 레슨", emoji: "🏃" },
  { key: "COUNSELING", label: "상담(카운슬링)", emoji: "💬" },
] as const;

export function serviceLabel(t?: string | null) {
  return SERVICE_TYPES.find((s) => s.key === t)?.label ?? t ?? "";
}

export const RECRUIT_STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "모집중", color: "bg-green-100 text-green-700" },
  MATCHED: { label: "매칭완료", color: "bg-brand-100 text-brand-700" },
  CLOSED: { label: "마감", color: "bg-gray-100 text-gray-500" },
};

export const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "대기중", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "수락됨", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "거절됨", color: "bg-red-100 text-red-600" },
};

export const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: "결제 요청", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "결제 완료", color: "bg-green-100 text-green-700" },
  CANCELED: { label: "취소됨", color: "bg-gray-100 text-gray-500" },
  REFUNDED: { label: "환불됨", color: "bg-red-100 text-red-600" },
};

export const INQUIRY_CATEGORIES = [
  { key: "GENERAL", label: "일반 문의" },
  { key: "PAYMENT", label: "결제·환불" },
  { key: "REPORT", label: "신고·제재" },
  { key: "PARTNER", label: "제휴·광고" },
  { key: "ETC", label: "기타" },
] as const;

export function inquiryCategoryLabel(k?: string | null) {
  return INQUIRY_CATEGORIES.find((c) => c.key === k)?.label ?? k ?? "일반 문의";
}

export const INQUIRY_STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "미답변", color: "bg-yellow-100 text-yellow-700" },
  ANSWERED: { label: "답변완료", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "종료", color: "bg-gray-100 text-gray-500" },
};

export const SCHOOL_CATEGORIES = [
  { key: "MIDDLE", label: "중학교" },
  { key: "HIGH", label: "고등학교" },
  { key: "UNIV", label: "대학교" },
  { key: "CLUB", label: "클럽·기타" },
] as const;

export function schoolCategoryLabel(k?: string | null) {
  return SCHOOL_CATEGORIES.find((c) => c.key === k)?.label ?? k ?? "";
}
