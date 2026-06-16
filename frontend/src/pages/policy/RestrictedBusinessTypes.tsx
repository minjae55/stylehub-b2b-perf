import { Link } from "react-router";
import { AlertCircle, ChevronRight, Phone, Mail } from "lucide-react";

const restrictedCategories = [
  {
    title: "가입 불가 업태",
    color: "bg-red-50 border-red-200",
    titleColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-700",
    items: [
      { name: "음식업·요식업", reason: "의류 도매와 무관한 업종" },
      { name: "건설업", reason: "의류 도매와 무관한 업종" },
      { name: "금융업·보험업", reason: "의류 도매와 무관한 업종" },
      { name: "의료업·병원업", reason: "의류 도매와 무관한 업종" },
      { name: "교육업·학원업", reason: "의류 도매와 무관한 업종" },
      { name: "부동산업", reason: "의류 도매와 무관한 업종" },
      { name: "운수업·물류업", reason: "셀러 자격 미해당 (배송 파트너 별도 문의)" },
      { name: "농업·어업·임업", reason: "의류 도매와 무관한 업종" },
      { name: "광업·채굴업", reason: "의류 도매와 무관한 업종" },
      { name: "숙박업·관광업", reason: "의류 도매와 무관한 업종" },
    ],
  },
  {
    title: "가입 불가 업종",
    color: "bg-orange-50 border-orange-200",
    titleColor: "text-orange-700",
    badgeColor: "bg-orange-100 text-orange-700",
    items: [
      { name: "성인용품 판매업", reason: "플랫폼 취급 상품 범위 외" },
      { name: "무기류·위험물 제조·판매업", reason: "법적 규제 대상" },
      { name: "의약품·의료기기 제조·판매업", reason: "별도 인허가 필요 업종" },
      { name: "화학약품·농약 제조·판매업", reason: "법적 규제 대상" },
      { name: "도박·사행성 관련업", reason: "법적 규제 대상" },
      { name: "불법 복제품·모조품 판매업", reason: "지적재산권 침해 우려" },
      { name: "다단계·방문판매업", reason: "플랫폼 운영 방침과 상충" },
      { name: "개인 사업자 미등록 개인", reason: "사업자등록증 필수" },
      { name: "해외 소재 법인 (비한국 사업자)", reason: "국내 사업자등록 필수" },
      { name: "법원 회생·파산 진행 중 기업", reason: "계약 안정성 사유" },
    ],
  },
  {
    title: "조건부 가입 제한 (사전 심사 필요)",
    color: "bg-amber-50 border-amber-200",
    titleColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-700",
    items: [
      { name: "화장품·뷰티 용품 제조·판매업", reason: "의류 외 카테고리 — 사전 심사 후 결정" },
      { name: "스포츠용품 전문 판매업 (의류 비포함)", reason: "의류 카테고리 포함 여부 확인 필요" },
      { name: "수입 의류 브랜드 국내 총판", reason: "원산지·통관 서류 추가 확인 필요" },
      { name: "소셜커머스 단독 운영 셀러", reason: "자사 또는 자체 쇼핑몰 운영 여부 확인" },
      { name: "신규 창업 (사업자 발급 3개월 미만)", reason: "영업 이력 확인 후 한도 거래 허용" },
    ],
  },
];

const faqItems = [
  {
    q: "사업자등록이 없어도 가입할 수 있나요?",
    a: "아니요. 스타일허브 셀러 가입은 유효한 국내 사업자등록증이 반드시 필요합니다. 사업자등록 후 가입을 진행해 주세요.",
  },
  {
    q: "가입 불가 업종이지만 의류도 함께 판매합니다. 어떻게 해야 하나요?",
    a: "주 업종이 가입 불가 업종에 해당하더라도, 의류 판매를 별도 사업자로 운영 중이라면 해당 사업자로 가입 신청이 가능합니다. 고객센터로 문의해 주세요.",
  },
  {
    q: "조건부 가입 제한 업종은 어떻게 심사를 받나요?",
    a: "일반 셀러 가입과 동일한 방식으로 신청 후 '조건부 심사 대상'으로 분류되며, 담당자가 추가 서류를 요청드립니다. 영업일 기준 3~5일 소요됩니다.",
  },
  {
    q: "가입 승인 후 업종이 제한 목록에 추가되면 어떻게 되나요?",
    a: "기존 승인 셀러는 소명 기간(30일)을 부여한 후 정책에 따라 재심사를 진행합니다. 사전에 이메일로 안내드립니다.",
  },
];

export function RestrictedBusinessTypes() {
  return (
    <div className="max-w-[960px] mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary transition-colors">홈</Link>
          <ChevronRight size={14} />
          <span>가입 불가 업태/업종</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">가입 불가 업태 및 업종 안내</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              스타일허브는 국내 여성복 B2B 도매 플랫폼으로, 아래에 해당하는 업태·업종은 셀러 회원 가입이 제한됩니다.
              <br />가입 전 반드시 확인해 주시기 바랍니다. 바이어 가입에는 별도 제한이 없습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex items-start gap-3">
        <AlertCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm text-foreground">
          <strong>가입 후 허위 정보 적발 시 즉시 계정 정지 및 거래 취소 처리됩니다.</strong>
          <br />
          <span className="text-muted-foreground">불명확한 경우 고객센터에 문의하시면 사전 검토를 도와드립니다.</span>
        </div>
      </div>

      {/* Restricted Categories */}
      <div className="space-y-6 mb-10">
        {restrictedCategories.map((section) => (
          <div key={section.title} className={`border rounded-lg overflow-hidden ${section.color}`}>
            <div className="px-5 py-3.5 border-b border-current/10">
              <h2 className={`font-bold text-base ${section.titleColor}`}>{section.title}</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div key={item.name} className="bg-white rounded-lg border border-white/80 p-3.5 flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${section.badgeColor}`}>불가</span>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">자주 묻는 질문</h2>
        <div className="space-y-3">
          {faqItems.map((item) => (
            <div key={item.q} className="bg-white border border-border rounded-lg p-5">
              <div className="font-semibold text-foreground mb-2 flex items-start gap-2">
                <span className="text-primary font-bold flex-shrink-0">Q.</span>
                {item.q}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed pl-5">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <div className="bg-white border border-border rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground mb-1">가입 가능 여부가 불확실하신가요?</h3>
          <p className="text-sm text-muted-foreground">고객센터에 문의하시면 사전 검토를 도와드립니다.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <a href="tel:15880000" className="flex items-center gap-2 border border-border text-foreground hover:border-primary hover:text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Phone size={15} />
            1588-0000
          </a>
          <a href="mailto:support@stylehub.co.kr" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Mail size={15} />
            이메일 문의
          </a>
        </div>
      </div>

      {/* Back Links */}
      <div className="mt-8 flex items-center gap-4 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">← 홈으로</Link>
        <Link to="/auth?tab=signup&role=seller" className="text-primary font-semibold hover:underline">셀러 가입하기 →</Link>
      </div>
    </div>
  );
}
