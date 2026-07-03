import Link from "next/link";
import { COMPANY } from "@/lib/legal";

export const metadata = { title: "이용약관 — Sportplex" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <article className="card space-y-6 p-6 sm:p-8 text-[15px] leading-relaxed text-gray-700">
        <header>
          <h1 className="text-2xl font-extrabold text-gray-900">이용약관</h1>
          <p className="mt-1 text-sm text-gray-400">시행일: {COMPANY.effectiveDate}</p>
        </header>

        <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
          ※ 본 약관은 표준 템플릿으로, 실제 서비스 적용 전 법률 전문가의 검토가 필요합니다.
        </p>

        <Section title="제1조 (목적)">
          본 약관은 {COMPANY.service}(이하 &ldquo;회사&rdquo;)가 제공하는 스포츠 코칭·레슨 중개 플랫폼 및 관련 제반
          서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로
          합니다.
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ul className="list-disc space-y-1 pl-5">
            <li>&ldquo;회원&rdquo;이란 본 약관에 동의하고 서비스에 가입한 자를 말합니다.</li>
            <li>
              &ldquo;이용회원&rdquo;이란 상담·레슨 등 서비스를 구하는 학생·학부모 회원을, &ldquo;지도회원&rdquo;이란
              코치·감독·운동레슨 선생님 등 서비스를 제공하는 회원을 말합니다.
            </li>
            <li>
              &ldquo;중개 거래&rdquo;란 이용회원과 지도회원 사이에 성립하는 상담·레슨 등의 계약을 말하며, 회사는 그
              거래의 당사자가 아닙니다.
            </li>
          </ul>
        </Section>

        <Section title="제3조 (회사의 지위 — 통신판매중개자)">
          <p className="font-semibold text-gray-900">
            회사는 회원 간 중개 거래가 이루어질 수 있도록 거래 시스템(게시판·모집공고·매칭·채팅 등)을 제공하는
            <span className="text-brand-700"> 통신판매중개자</span>이며, 중개 거래의 당사자가 아닙니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              상담·레슨 계약은 이용회원과 지도회원 사이에서 직접 성립·이행되며, 회사는 그 계약의 성립, 이행, 품질,
              안전, 적법성, 환불 등에 관하여 보증하거나 책임지지 않습니다.
            </li>
            <li>
              회사가 제공하는 &ldquo;인증 지도자 뱃지&rdquo;, 별점·후기, 랭킹 등은 회원이 제출·작성한 자료에 기반한
              참고 정보일 뿐, 해당 회원의 자격·신원·실력·안전을 회사가 보증하는 것이 아닙니다.
            </li>
          </ul>
        </Section>

        <Section title="제4조 (회사의 책임 제한)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회사는 회원이 게재·제공한 정보의 진실성·정확성·적법성, 그리고 회원 간 중개 거래 및 그 과정에서 발생하는
              일체의 분쟁에 대하여 책임을 지지 않습니다.
            </li>
            <li className="font-semibold text-gray-900">
              회사는 지도회원을 포함한 회원의 불법행위, 자격·경력의 허위·과장, 안전사고, 상해, 추행·폭언 등 위법행위,
              계약 불이행으로 인하여 다른 회원 또는 제3자에게 발생한 손해에 대하여 책임을 지지 않으며, 그 책임은 해당
              행위를 한 회원에게 있습니다.
            </li>
            <li>
              회원은 상대 회원의 자격·경력·평판 등을 스스로 확인하고, 본인의 책임과 판단 하에 거래하여야 합니다.
              미성년자가 관련된 거래의 경우 친권자 등 법정대리인의 보호·감독 하에 이루어져야 합니다.
            </li>
            <li>
              회사는 천재지변, 회원의 귀책사유, 제3자의 행위 등 회사의 합리적 통제를 벗어난 사유로 인한 손해에 대하여
              책임을 지지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="제5조 (회원의 의무 및 금지행위)">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원은 가입 정보 및 자격·경력을 사실대로 등록하여야 하며, 허위 등록 시 이용이 제한될 수 있습니다.</li>
            <li>회원은 관련 법령, 본 약관, 회사의 안내 사항을 준수하여야 합니다.</li>
            <li>
              타인의 권리 침해, 허위·불법 정보 게시, 미성년자 대상 부적절 행위, 플랫폼 외부 직거래 유도를 통한 분쟁
              유발 등은 금지되며, 위반 시 계정 정지·삭제 및 법적 조치의 대상이 될 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section title="제6조 (게시물 및 후기)">
          회원이 작성한 게시물·후기 등의 책임은 작성자에게 있으며, 회사는 관련 법령 위반 또는 신고가 접수된 게시물을
          사전 통지 없이 삭제하거나 접근을 제한할 수 있습니다.
        </Section>

        <Section title="제7조 (서비스의 변경·중단)">
          회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 무료로 제공되는 서비스의
          변경·중단으로 인한 손해에 대하여는 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.
        </Section>

        <Section title="제8조 (계약 해지 및 이용 제한)">
          회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 회원이 본 약관을 위반한 경우 이용을 제한하거나 회원 자격을
          정지·상실시킬 수 있습니다.
        </Section>

        <Section title="제9조 (준거법 및 관할)">
          본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생한 경우 관할 법원은 민사소송법에
          따릅니다.
        </Section>

        <Section title="사업자 정보 (통신판매중개자 고지)">
          <ul className="space-y-1 text-sm text-gray-600">
            <li>상호: {COMPANY.bizName}</li>
            <li>대표자: {COMPANY.ceo}</li>
            <li>사업자등록번호: {COMPANY.bizNo}</li>
            <li>통신판매업 신고번호: {COMPANY.mailOrderNo}</li>
            <li>주소: {COMPANY.address}</li>
            <li>고객센터: {COMPANY.phone} / {COMPANY.email}</li>
          </ul>
          <p className="mt-2 text-sm">
            {COMPANY.service}는 통신판매중개자로서 중개 거래의 당사자가 아니며, 회원 간 거래에 대한 의무와 책임은 각
            거래 당사자에게 있습니다.
          </p>
        </Section>

        <p className="border-t border-gray-100 pt-4 text-sm text-gray-400">
          함께 보기: <Link href="/privacy" className="font-medium text-brand-600">개인정보 처리방침</Link>
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
