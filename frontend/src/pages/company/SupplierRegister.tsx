import { useState } from "react";
import { Link } from "react-router";
import {
  Building2,
  ArrowLeft,
  CheckCircle,
  Upload,
  Globe,
  Phone,
  Mail,
  User,
  FileText,
  Package,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const steps = ["기본 정보", "상품/카테고리", "인증서류", "검토 완료"];

const categories = [
  "상의 (티셔츠/블라우스/니트)",
  "하의 (팬츠/스커트/데님)",
  "원피스/세트",
  "아우터 (코트/자켓/가디건)",
  "이너/언더웨어",
  "스포츠/애슬레저",
  "액세서리 (가방/모자/스카프)",
  "신발",
  "패션잡화",
  "OEM/자체제작",
];

export function SupplierRegister() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    ceoName: "",
    businessNumber: "",
    country: "한국",
    address: "",
    phone: "",
    email: "",
    website: "",
    selectedCategories: [] as string[],
    productCount: "",
    moq: "",
    description: "",
    certBiz: false,
    certISO: false,
    certFDA: false,
    certKFDA: false,
    agree: false,
  });

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleCat = (cat: string) => {
    set(
      "selectedCategories",
      form.selectedCategories.includes(cat)
        ? form.selectedCategories.filter((c) => c !== cat)
        : [...form.selectedCategories, cat]
    );
  };

  const canNext = () => {
    if (step === 0)
      return (
        form.companyName && form.ceoName && form.businessNumber && form.phone && form.email
      );
    if (step === 1) return form.selectedCategories.length > 0 && form.productCount;
    if (step === 2) return form.certBiz && form.agree;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center font-[Inter,sans-serif]">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">등록 신청 완료!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          셀러 등록 신청이 접수되었습니다.<br />
          스타일허브 검증팀이 <strong className="text-foreground">영업일 3~5일</strong> 이내로 심사 후 이메일로 결과를 안내드립니다.
        </p>
        <div className="bg-secondary border border-primary/20 rounded-lg p-5 text-left text-sm mb-8 space-y-2">
          <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-primary" /> 심사 절차 안내
          </div>
          <div className="flex gap-3 text-muted-foreground"><span className="text-primary font-mono">1.</span> 서류 적합성 검토 (1~2일)</div>
          <div className="flex gap-3 text-muted-foreground"><span className="text-primary font-mono">2.</span> 현장 실사 or 화상 인터뷰 (1~2일)</div>
          <div className="flex gap-3 text-muted-foreground"><span className="text-primary font-mono">3.</span> 최종 승인 및 플랫폼 등재</div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            to="/suppliers"
            className="px-6 py-2.5 border border-border rounded font-medium text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            공급업체 목록 보기
          </Link>
          <Link
            to="/"
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-semibold text-sm transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <Link
        to="/suppliers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} /> 셀러 목록으로
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Building2 size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">셀러 등록 신청</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        스타일허브 인증 셀러로 등록하고 전국 B2B 바이어와 연결되세요.
      </p>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 ${i < step ? "bg-green-400" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-lg p-6">
        {/* STEP 0: 기본 정보 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <User size={16} className="text-primary" /> 기본 정보
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  회사명 <span className="text-primary">*</span>
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="(주)동대문패션"
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  대표자명 <span className="text-primary">*</span>
                </label>
                <input
                  value={form.ceoName}
                  onChange={(e) => set("ceoName", e.target.value)}
                  placeholder="홍길동"
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  사업자등록번호 <span className="text-primary">*</span>
                </label>
                <input
                  value={form.businessNumber}
                  onChange={(e) => set("businessNumber", e.target.value)}
                  placeholder="000-00-00000"
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">국가</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white transition-colors"
                >
                  {["한국", "일본", "대만", "중국", "미국", "기타"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">사업장 주소</label>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="서울특별시 강남구 테헤란로 123"
                className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  담당자 연락처 <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="02-1234-5678"
                    className="w-full border border-border rounded pl-8 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  이메일 <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full border border-border rounded pl-8 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">웹사이트 (선택)</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://www.company.com"
                  className="w-full border border-border rounded pl-8 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: 제품/카테고리 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <Package size={16} className="text-primary" /> 상품 및 카테고리
            </h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                주요 카테고리 <span className="text-primary">*</span>
                <span className="text-muted-foreground font-normal ml-1">(중복 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active = form.selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCat(cat)}
                      className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  취급 상품 수 <span className="text-primary">*</span>
                </label>
                <input
                  value={form.productCount}
                  onChange={(e) => set("productCount", e.target.value)}
                  placeholder="예: 200"
                  type="number"
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">최소 주문 수량 (MOQ)</label>
                <input
                  value={form.moq}
                  onChange={(e) => set("moq", e.target.value)}
                  placeholder="예: 50벌"
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">브랜드/업체 소개</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="주요 상품 라인, 생산 역량, 주요 거래처, 브랜드 특장점 등을 자유롭게 입력하세요."
                className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: 인증서류 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <FileText size={16} className="text-primary" /> 인증 및 서류 제출
            </h2>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground mb-2">보유 인증 체크 <span className="text-primary">*</span></div>
              {[
                { key: "certBiz", label: "사업자등록증", required: true, desc: "필수 서류" },
                { key: "certISO", label: "KC 인증 (섬유·의류)", required: false, desc: "어린이·특수 의류 해당" },
                { key: "certFDA", label: "환경부 재활용 인증", required: false, desc: "친환경 소재 제품 해당" },
                { key: "certKFDA", label: "브랜드 상표등록증", required: false, desc: "자체 브랜드 운영 업체" },
              ].map(({ key, label, required, desc }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 border rounded p-4 cursor-pointer transition-colors ${
                    form[key as keyof typeof form]
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!form[key as keyof typeof form]}
                    onChange={(e) => set(key as keyof typeof form, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {label}
                      {required && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold">필수</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
              <Upload size={24} className="mx-auto text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
              <div className="text-sm font-medium text-foreground mb-1">서류 파일 업로드</div>
              <div className="text-xs text-muted-foreground">PDF, JPG, PNG · 파일당 최대 10MB</div>
              <button className="mt-3 text-xs text-primary border border-primary rounded px-3 py-1 hover:bg-primary hover:text-white transition-colors">
                파일 선택
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => set("agree", e.target.checked)}
                className="w-4 h-4 mt-0.5"
              />
              <div className="text-sm text-foreground">
                <span className="font-semibold">스타일허브 셀러 이용약관 및 개인정보 처리방침에 동의합니다.</span>
                <div className="text-xs text-muted-foreground mt-1">
                  제출된 정보는 공급업체 검증 목적으로만 사용되며 제3자에게 제공되지 않습니다.
                </div>
              </div>
            </label>
          </div>
        )}

        {/* STEP 3: 검토 완료 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-primary" /> 신청 내용 최종 확인
            </h2>
            <div className="bg-secondary rounded-lg p-5 space-y-3 text-sm">
              {[
                ["회사명", form.companyName],
                ["대표자", form.ceoName],
                ["사업자등록번호", form.businessNumber],
                ["국가", form.country],
                ["연락처", form.phone],
                ["이메일", form.email],
                ["카테고리", form.selectedCategories.join(", ") || "-"],
                ["취급 상품 수", form.productCount ? `${form.productCount}벌` : "-"],
                ["MOQ", form.moq || "-"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="text-muted-foreground w-36 flex-shrink-0">{label}</span>
                  <span className="font-medium text-foreground">{value || "-"}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs text-amber-700 leading-relaxed">
              심사 결과는 입력하신 이메일(<strong>{form.email}</strong>)로 영업일 3~5일 내 안내됩니다. 추가 서류 요청 시 별도 연락을 드릴 수 있습니다.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={15} /> 이전
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-sm transition-colors ${
              canNext()
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {step === 3 ? "신청 제출하기" : "다음"}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
