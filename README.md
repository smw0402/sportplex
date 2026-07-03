# ⚡ Sportplex

전국 스포츠 코칭·레슨 매칭 플랫폼. 학생·학부모와 **코치·감독·운동레슨 선생님**을 연결합니다.
(김과외의 스포츠 버전)

## 주요 기능

- 🏠 **홈** — 종목별 스포츠 이슈/뉴스 피드 + 추천 코치 + 최신 모집공고
- 💬 **질문게시판** — 종목별 Q&A 게시판 (글/댓글)
- 📢 **모집공고** — 학생·학부모가 **상담(카운슬링)·레슨** 요청 → 코치·선생님이 **제안** → 수락 시 자동 매칭
- 👤 **프로필** — 인스타그램 스타일 프로필 + 경력 등록 (코치/감독/레슨선생님/학생/학부모)
- 💌 **채팅** — 계정 간 1:1 실시간 대화 (제안 수락 또는 프로필에서 시작)

## 기술 스택

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma + SQLite** (로컬에서 별도 설치 없이 동작)
- 쿠키 기반 세션 인증 (bcrypt + HMAC 서명)

## 실행 방법

```bash
npm install          # 의존성 설치
npm run setup        # DB 생성 + 데모 데이터 시드 (db push + seed)
npm run dev          # 개발 서버 → http://localhost:3000
```

DB를 다시 깔끔하게 시드하려면: `npm run db:seed`

## 데모 계정 (비밀번호: `demo1234`)

| 이메일 | 역할 | 종목 |
|---|---|---|
| `coach.kim@demo.com` | 코치 | 농구 |
| `teacher.park@demo.com` | 레슨선생님 | 수영 |
| `director.choi@demo.com` | 감독 | 축구 |
| `parent.lee@demo.com` | 학부모 | - |
| `student.jung@demo.com` | 학생 | 테니스 |

### 매칭 흐름 체험하기
1. `parent.lee@demo.com` 로 로그인 → 모집공고 "초4 아들 농구 기초 레슨…" 에 코치 제안이 들어와 있음 → **수락하고 채팅 시작**
2. `coach.kim@demo.com` 로 로그인 → 모집공고에서 다른 요청에 **제안 보내기**

## 폴더 구조

```
src/
  app/
    page.tsx              홈 (스포츠 이슈 피드)
    board/                질문게시판
    recruit/              모집공고 + 제안
    u/[id]/               프로필
    profile/edit/         프로필·경력 편집
    chat/                 채팅 목록 / 방
    login, signup/        인증
    actions/              서버 액션 (auth, board, recruit, profile, chat)
  components/             NavBar, Avatar, SportFilter
  lib/                    prisma, auth, chat, constants, format
prisma/
  schema.prisma          데이터 모델
  seed.ts                데모 데이터
```
