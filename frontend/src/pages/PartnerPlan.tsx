import { useState } from "react";
import { Link } from "react-router";
import { Check, Zap, TrendingUp, Crown, ChevronRight, ArrowRight, BarChart2, Search, Star } from "lucide-react";

const plans = [
  {
    key: "basic",
    name: "Basic",
    price: 0,
    unit: "무료",
    desc: "플랫폼을 처음 시작하는 업체를 위한 기본 플랜",
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    badgeBg: "#F3F4F6",
    badgeColor: "#374151",
    icon: <Zap size={22} />,
    features: [
      { text: "기본 검색 노출", included: true },
      { text: "바이어 문의 수신", included: true },
      { text: "검색 상위 노출", included: false },
      { text: "카테고리 최상단 고정", included: false },
      { text: "파트너 배지 표시", included: false },
      { text: "월간 노출 통계", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 49000,
    unit: "월",
    desc: "노출을 높이고 바이어에게 먼저 발견되고 싶은 업체",
    color: "#0f3460",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    badgeBg: "#DBEAFE",
    badgeColor: "#1E40AF",
    icon: <TrendingUp size={22} />,
    highlight: true,
    features: [
      { text: "기본 검색 노출", included: true },
      { text: "바이어 문의 수신", included: true },
      { text: "검색 상위 노출", included: true },
      { text: "카테고리 최상단 고정", included: false },
      { text: "Pro 배지 표시", included: true },
      { text: "월간 노출 통계", included: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: 99000,
    unit: "월",
    desc: "최대 노출과 데이터로 비즈니스를 성장시키는 업체",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    badgeBg: "#FEF3C7",
    badgeColor: "#92400E",
    icon: <Crown size={22} />,
    features: [
      { text: "기본 검색 노출", included: true },
      { text: "바이어 문의 수신", included: true },
      { text: "검색 상위 노출", included: true },
      { text: "카테고리 최상단 고정", included: true },
      { text: "Premium 배지 표시", included: true },
      { text: "월간 노출 통계", included: true },
    ],
  },
];

const benefits = [
  { icon: <Search size={20} />, title: "검색 상위 노출", desc: "바이어가 검색할 때 상단에 먼저 표시됩니다." },
  { icon: <Star size={20} />, title: "파트너 배지", desc: "신뢰도를 높이는 Pro/Premium 배지가 업체 카드에 표시됩니다." },
  { icon: <TrendingUp size={20} />, title: "카테고리 고정", desc: "원하는 카테고리 최상단에 업체가 고정 노출됩니다." },
  { icon: <BarChart2 size={20} />, title: "노출 통계", desc: "월간 노출수·문의수 데이터를 대시보드에서 확인하세요." },
];

export function PartnerPlan() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", name: "", phone: "", email: "", agree: false });
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  if (submitted) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-border rounded-xl p-12">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">신청이 완료되었습니다</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            <strong>{plans.find((p) => p.key === selectedPlan)?.name}</strong> 플랜 신청을 받았습니다.<br />
            영업일 기준 1~2일 내로 이메일로 안내드릴게요.
          </p>
          <Link to="/seller" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors">
            셀러 페이지로 <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[Inter,sans-serif]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f3460] text-white py-16">
        <div className="max-w-[1100px] mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium mb-6 tracking-wide">
            <Crown size={13} /> PARTNER PROGRAM
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            더 많은 바이어에게<br />
            <span className="text-blue-300">먼저 발견되세요</span>
          </h1>
          <p className="text-white/65 text-base max-w-[480px] mx-auto">
            파트너 플랜으로 검색 상위 노출, 카테고리 고정, 배지 표시까지 — 경쟁 업체보다 앞서 나가세요.
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-14">

        {/* Benefits */}
        <div className="grid grid-cols-4 gap-4 mb-14">
          {benefits.map((b) => (
            <div key={b.title} className="bg-white border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                {b.icon}
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">{b.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">플랜 선택</h2>
          <p className="text-sm text-muted-foreground">신청할 플랜을 선택하세요</p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-14">
          {plans.map((plan) => (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                selectedPlan === plan.key
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border hover:border-primary/40"
              }`}
              style={{ background: plan.bg }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
                  인기
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: plan.badgeBg, color: plan.color }}>
                  {plan.icon}
                </div>
                <div>
                  <div className="font-bold text-foreground">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">{plan.desc}</div>
                </div>
              </div>

              <div className="mb-5">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-foreground">무료</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">₩{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.unit}</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-xs">
                    {f.included ? (
                      <Check size={13} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <span className="w-[13px] h-[13px] flex-shrink-0 flex items-center justify-center">
                        <span className="block w-2 h-px bg-muted-foreground/40 rounded" />
                      </span>
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.key && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-primary text-xs font-semibold">
                  <Check size={13} /> 선택됨
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-[560px] mx-auto">
          <div className="bg-white border border-border rounded-xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-1">신청 정보 입력</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedPlan
                ? <span>선택한 플랜: <strong className="text-primary">{plans.find((p) => p.key === selectedPlan)?.name}</strong></span>
                : "위에서 플랜을 먼저 선택해주세요"}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">업체명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="예: 스타일컴퍼니"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">담당자명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="홍길동"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">연락처 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">이메일 <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="example@email.com"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => update("agree", e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  이용약관 및 개인정보 처리방침에 동의합니다. <span className="text-primary underline cursor-pointer">내용 보기</span>
                </span>
              </label>

              <button
                onClick={() => { if (selectedPlan && form.company && form.name && form.phone && form.email && form.agree) setSubmitted(true); }}
                disabled={!selectedPlan || !form.company || !form.name || !form.phone || !form.email || !form.agree}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                파트너 신청하기 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
