# 🚀 Sportplex 배포 가이드 (Vercel + Neon Postgres + Vercel Blob)

코드는 이미 프로덕션 구성으로 전환돼 있습니다:
- **DB**: PostgreSQL (`prisma/schema.prisma` provider = `postgresql`)
- **이미지 업로드**: `BLOB_READ_WRITE_TOKEN`이 있으면 Vercel Blob, 없으면 로컬 디스크(자동 분기)
- **패스키**: `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN`만 도메인에 맞추면 휴대폰 Face ID까지 작동

아래 순서대로 진행하세요.

---

## 1) Postgres 만들기 (Neon, 무료 · 2분)
1. https://neon.tech 가입 → **New Project** 생성 (리전은 `Asia Pacific (Singapore)` 등 가까운 곳)
2. 대시보드의 **Connection string**(`postgresql://...?sslmode=require`) 복사

## 2) 로컬 `.env` 설정 후 DB 초기화
`.env` 파일을 열어 값 채우기 (`.env.example` 참고):
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   # 1)에서 복사한 값
AUTH_SECRET="..."                                                 # openssl rand -base64 32
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_ORIGIN="http://localhost:3000"
```
그다음 테이블 생성 + 데모 데이터:
```bash
npx prisma db push      # Neon에 테이블 생성
npm run db:seed         # (선택) 데모 데이터
npm run dev             # 로컬에서도 이제 Neon Postgres로 동작
```

## 3) GitHub에 올리기
```bash
git init && git add -A && git commit -m "Sportplex"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```
> `.env`는 `.gitignore`에 있어 커밋되지 않습니다(비밀키 안전).

## 4) Vercel 배포
1. https://vercel.com 가입 → **Add New → Project → GitHub 저장소 선택**
2. **Storage → Blob** 생성 → 프로젝트에 연결(자동으로 `BLOB_READ_WRITE_TOKEN` 주입) 또는 토큰 복사
3. **Settings → Environment Variables** 에 추가:
   ```
   DATABASE_URL          = <Neon 연결 문자열>
   AUTH_SECRET           = <openssl로 생성한 값>
   BLOB_READ_WRITE_TOKEN = <Blob 토큰>   # Blob 연결 시 자동 생성됐다면 생략 가능
   WEBAUTHN_RP_ID        = <배포 도메인>          예: sportplex.vercel.app
   WEBAUTHN_ORIGIN       = https://<배포 도메인>  예: https://sportplex.vercel.app
   ```
4. **Deploy** (빌드 시 `postinstall`이 `prisma generate` 자동 실행)
5. 커스텀 도메인 연결 시(Settings → Domains) `WEBAUTHN_*` 값을 그 도메인으로 업데이트 후 재배포

> 스키마를 바꾸면(모델 추가 등) 다시 `npx prisma db push`로 Neon에 반영하세요.

---

## ✅ 배포 후 체크리스트
- [ ] 회원가입/로그인 정상
- [ ] 휴대폰에서 **홈 화면에 추가** → 전체화면 앱으로 실행
- [ ] 휴대폰 **Face ID/지문 로그인** (HTTPS 도메인 필요 → Vercel은 기본 HTTPS)
- [ ] 프로필/뉴스 **이미지 업로드**가 재배포 후에도 유지 (Blob 저장 확인)
- [ ] 관리자(admin@sportplex.com)로 뉴스 등록·신고 처리
- [ ] `src/lib/legal.ts` 사업자 정보 기입 + 약관 법률 검토

## 📱 사용자 안내 — 홈 화면 앱 설치
- **아이폰(Safari)**: 공유 → "홈 화면에 추가"
- **안드로이드(Chrome)**: 메뉴(⋮) → "앱 설치"
