import Link from "next/link";
import { COMPANY } from "@/lib/legal";

export const metadata = { title: "개인정보 처리방침 — Sportplex" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <article className="card space-y-6 p-6 sm:p-8 text-[15px] leading-relaxed text-gray-700">
        <header>
          <h1 className="text-2xl font-extrabold text-gray-900">개인정보 처리방침</h1>
          <p className="mt-1 text-sm text-gray-400">시행일: {COMPANY.effectiveDate}</p>
        </header>

        <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
          ※ 본 방침은 표준 템플릿으로, 실제 서비스 적용 전 법률 전문가의 검토가 필요합니다.
        </p>

        <p>
          {COMPANY.service}(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를
          다음과 같이 처리합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>필수</b>: 이메일, 비밀번호(암호화 저장), 이름, 회원 유형(학생/학부모/코치/감독/레슨선생님)
            </li>
            <li>
              <b>선택</b>: 주 종목, 활동·거주 지역, 프로필·커버 사진, 한 줄 소개, 경력 정보
            </li>
            <li>
              <b>지도자 인증 신청 시</b>: 실명, 자격·경력 증빙 자료(이미지 포함)
            </li>
            <li>
              <b>패스키(생체인증) 이용 시</b>: 인증기기의 공개키 및 자격증명 식별자 (지문·얼굴 등 생체정보 자체는
              이용자 기기에만 저장되며 회사 서버로 전송·수집되지 않습니다)
            </li>
            <li>
              <b>자동 수집</b>: 서비스 이용 기록, 접속 로그, 기기·브라우저 정보, 쿠키(로그인 유지 등)
            </li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 가입·식별, 본인 확인 및 계정 관리</li>
            <li>코치·선생님과 학생·학부모 간 매칭 및 중개 서비스 제공</li>
            <li>회원 간 채팅·문의 응대, 분쟁 조정 지원</li>
            <li>지도자 인증 심사, 부정 이용 방지 및 서비스 안전성 확보</li>
            <li>서비스 개선, 통계 분석, (선택 동의 시) 마케팅·이벤트 정보 제공</li>
          </ul>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 시 또는 수집·이용 목적 달성 시 지체 없이 파기합니다. 다만 관련 법령에서 보존을 요구하는 경우 해당
          기간 동안 보관합니다(예: 전자상거래법상 계약·청약철회 기록 5년, 소비자 불만·분쟁 처리 기록 3년 등).
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 매칭 서비스의 특성상 회원이 직접 등록한
          프로필·경력·후기 등은 다른 회원에게 공개되며, 법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우 제공될
          수 있습니다.
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          회사는 서비스 제공을 위해 클라우드 인프라·결제 등 일부 업무를 외부에 위탁할 수 있으며, 위탁 시 수탁자와
          처리 항목을 본 방침을 통해 고지합니다.
        </Section>

        <Section title="6. 이용자의 권리">
          이용자는 언제든지 자신의 개인정보를 조회·수정·삭제하거나 처리 정지·동의 철회(회원 탈퇴)를 요청할 수 있습니다.
          필수 항목에 대한 동의를 거부할 권리가 있으나, 이 경우 회원 가입 및 서비스 이용이 제한될 수 있습니다.
        </Section>

        <Section title="7. 개인정보 보호책임자">
          <ul className="space-y-1 text-sm text-gray-600">
            <li>개인정보 보호책임자: {COMPANY.privacyOfficer}</li>
            <li>문의: {COMPANY.email}</li>
          </ul>
        </Section>

        <p className="border-t border-gray-100 pt-4 text-sm text-gray-400">
          함께 보기: <Link href="/terms" className="font-medium text-brand-600">이용약관</Link>
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-bold text-gray-900">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </section>
  );
}
