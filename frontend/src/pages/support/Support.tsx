import {useState} from "react";
import {ChevronDown, ChevronUp, Clock, Mail, MessageSquare, Phone, Send} from "lucide-react";
import {Link} from "react-router";

// ── 데이터 ────────────────────────────────────────────────────────────────────

const faqs = [
    // 공통
    {
        category: "계정·가입",
        q: "가입 후 계정이 바로 활성화되지 않는 이유가 무엇인가요?",
        a: "StyleHub는 신뢰할 수 있는 B2B 거래 환경을 위해 담당자 검토 후 계정을 활성화합니다. 사업자등록증 및 국세청 인증 완료 후 영업일 기준 1~2일 내에 활성화 안내 메일을 발송해 드립니다.",
    },
    {
        category: "계정·가입",
        q: "직원으로 가입했는데 로그인이 안 됩니다.",
        a: "직원 계정은 소속 기업 대표자의 승인이 완료되어야 로그인할 수 있습니다. 대표자에게 마이페이지 > 직원 관리에서 승인을 요청해 주세요.",
    },
    // 셀러
    {
        category: "셀러",
        q: "셀러로 가입 시 어떤 서류가 필요한가요?",
        a: "사업자등록증 사본과 국세청 4종 진위확인(사업자번호·상호·대표자명·개업일자)이 필요합니다. 직원 가입 시 대표자 위임장과 재직증명서가 추가로 필요합니다.",
    },
    {
        category: "셀러",
        q: "정산은 어떻게 이루어지나요?",
        a: "바이어의 주문 확정 후 영업일 기준 3일 내에 등록된 정산 계좌로 입금됩니다. 정산 내역은 마이페이지 > 정산 관리에서 실시간으로 확인하실 수 있습니다.",
    },
    {
        category: "셀러",
        q: "상품 취급 카테고리는 가입 후 변경할 수 있나요?",
        a: "마이페이지 > 내 정보 > 취급 카테고리에서 언제든지 수정 가능합니다. 변경된 카테고리는 즉시 바이어 매칭에 반영됩니다.",
    },
    // 바이어
    {
        category: "바이어",
        q: "소싱 요청은 어떻게 하나요?",
        a: "마이페이지 > 소싱 요청에서 원하는 상품 카테고리, 수량, 희망 가격대를 입력하면 조건에 맞는 셀러에게 자동으로 알림이 발송됩니다. 셀러가 견적을 보내면 비교 후 거래를 진행하시면 됩니다.",
    },
    {
        category: "바이어",
        q: "주문 취소 또는 반품이 가능한가요?",
        a: "B2B 도매 거래 특성상 주문 확정 이후 취소·반품은 원칙적으로 불가합니다. 단, 상품 하자 또는 오배송의 경우에는 수령 후 24시간 이내에 고객센터로 사진과 함께 접수해 주시면 처리해 드립니다.",
    },
    // 거래·결제
    {
        category: "거래·결제",
        q: "거래 중 분쟁이 발생하면 어떻게 처리되나요?",
        a: "고객센터에 분쟁 접수 시 담당 매니저가 셀러·바이어 양측의 의견을 청취하고 중재합니다. 에스크로로 보관된 결제 대금은 분쟁이 해결될 때까지 보호됩니다.",
    },
    {
        category: "거래·결제",
        q: "세금계산서 발행은 어떻게 되나요?",
        a: "거래 완료 후 셀러가 등록된 사업자 정보로 세금계산서를 자동 발행합니다. 발행된 세금계산서는 마이페이지 > 거래 내역에서 확인 및 다운로드할 수 있습니다.",
    },
];

const announcements = [
    {date: "2024.07.01", tag: "서비스", title: "셀러 취급 카테고리 다중 선택 기능 업데이트", important: true},
    {date: "2024.06.20", tag: "시스템", title: "7월 4일 정기 점검 예정 (새벽 02:00–04:00)", important: false},
    {date: "2024.06.15", tag: "정책", title: "B2B 거래 표준 약관 개정 안내 (2024.07.01 시행)", important: true},
    {date: "2024.06.05", tag: "이벤트", title: "신규 셀러 입점 수수료 3개월 면제 프로모션", important: true},
    {date: "2024.05.28", tag: "서비스", title: "소싱 요청 매칭 알고리즘 개선 안내", important: false},
];

const CATEGORIES_FAQ = ["전체", "계정·가입", "셀러", "바이어", "거래·결제"] as const;
type FaqCategory = typeof CATEGORIES_FAQ[number];

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function Support() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [faqCat, setFaqCat] = useState<FaqCategory>("전체");
    const [form, setForm] = useState({name: "", email: "", category: "", message: ""});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const filteredFaqs = faqCat === "전체"
        ? faqs
        : faqs.filter((f) => f.category === faqCat);

    const handleSubmit = async () => {
        if (!form.name || !form.email || !form.category || !form.message) return;
        setSubmitting(true);
        // TODO: POST /api/support/inquiries
        await new Promise((r) => setTimeout(r, 800));
        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <div className="font-[Inter,sans-serif]">

            {/* Hero */}
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0d1f0d] text-white py-14">
                <div className="max-w-[1280px] mx-auto px-6">
                    <span
                        className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
                        고객센터
                    </span>
                    <h1 className="text-4xl font-bold mb-3">무엇을 도와드릴까요?</h1>
                    <p className="text-white/60 text-sm">
                        StyleHub 전담 상담팀이 평일 09:00–18:00 운영 중입니다.
                    </p>
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-10">

                {/* 연락처 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        {
                            icon: <Phone size={26}/>,
                            title: "전화 상담",
                            detail: "1588-0000",
                            sub: "평일 09:00–18:00",
                            action: "전화하기"
                        },
                        {
                            icon: <MessageSquare size={26}/>,
                            title: "1:1 채팅",
                            detail: "실시간 상담",
                            sub: "평균 응답 5분 이내",
                            action: "채팅 시작",
                            to: "/support/inquiry"
                        },
                        {
                            icon: <Mail size={26}/>,
                            title: "이메일 문의",
                            detail: "help@stylehub.kr",
                            sub: "24시간 접수 · 1영업일 내 답변",
                            action: "메일 보내기"
                        },
                    ].map((c) => (
                        <div key={c.title}
                             className="bg-white border border-border rounded-xl p-6 text-center hover:border-primary hover:shadow-md transition-all group">
                            <div
                                className="text-primary mx-auto mb-3 inline-block group-hover:scale-110 transition-transform">
                                {c.icon}
                            </div>
                            <h3 className="font-semibold text-foreground mb-1 text-sm">{c.title}</h3>
                            <div className="text-base font-bold text-primary mb-1">{c.detail}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-4">
                                <Clock size={11}/> {c.sub}
                            </div>
                            {c.to ? (
                                <Link
                                    to={c.to}
                                    className="block text-center border border-primary text-primary hover:bg-primary hover:text-white text-xs px-5 py-2 rounded-lg font-semibold transition-colors w-full"
                                >
                                    {c.action}
                                </Link>
                            ) : (
                                <button
                                    className="border border-primary text-primary hover:bg-primary hover:text-white text-xs px-5 py-2 rounded-lg font-semibold transition-colors w-full"
                                >
                                    {c.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="max-w-[1280px] mx-auto">

                    {/* 공지사항 */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-5">공지사항</h2>
                        <div className="bg-white border border-border rounded-xl overflow-hidden">
                            {announcements.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 px-5 py-4 border-b border-muted last:border-0 hover:bg-secondary transition-colors cursor-pointer"
                                >
                                    <span
                                        className="text-xs text-muted-foreground font-mono w-24 shrink-0">{a.date}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                        a.important
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                    {a.tag}
                                </span>
                                    <span
                                        className="text-sm text-foreground hover:text-primary transition-colors flex-1">
                                    {a.title}
                                </span>
                                    {a.important && (
                                        <span className="text-[10px] text-primary font-bold shrink-0">중요</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* FAQ + 문의 폼 */}
                <div className="grid grid-cols-[1fr_380px] gap-8 mb-14 py-3 my-10">

                    {/* FAQ */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-5">자주 묻는 질문</h2>

                        {/* 카테고리 탭 */}
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {CATEGORIES_FAQ.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setFaqCat(cat);
                                        setOpenFaq(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                        faqCat === cat
                                            ? "bg-primary text-white"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {filteredFaqs.map((faq, i) => (
                                <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary transition-colors"
                                    >
                                        <div className="flex items-center gap-2 pr-4">
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold shrink-0">
                                                {faq.category}
                                            </span>
                                            <span className="font-medium text-foreground text-sm">{faq.q}</span>
                                        </div>
                                        {openFaq === i
                                            ? <ChevronUp size={15} className="text-primary shrink-0"/>
                                            : <ChevronDown size={15} className="text-muted-foreground shrink-0"/>
                                        }
                                    </button>
                                    {openFaq === i && (
                                        <div
                                            className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-muted pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 1:1 문의 폼 */}
                    <section className="bg-white border border-border rounded-xl p-6 self-start sticky top-6">
                        <h2 className="text-lg font-bold text-foreground mb-1">1:1 문의하기</h2>
                        <p className="text-xs text-muted-foreground mb-5">1영업일 내 이메일로 답변드립니다.</p>

                        {submitted ? (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-3">✅</div>
                                <p className="font-semibold text-foreground mb-1">문의가 접수되었습니다</p>
                                <p className="text-xs text-muted-foreground">
                                    1영업일 내 <span className="text-primary font-medium">{form.email}</span>로 답변드리겠습니다.
                                </p>
                                <button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setForm({name: "", email: "", category: "", message: ""});
                                    }}
                                    className="mt-5 text-xs text-primary hover:underline"
                                >
                                    새 문의 작성
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {[
                                    {label: "이름", type: "text", key: "name", placeholder: "홍길동"},
                                    {label: "이메일", type: "email", key: "email", placeholder: "your@company.com"},
                                ].map(({label, type, key, placeholder}) => (
                                    <div key={key}>
                                        <label
                                            className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                                        <input
                                            type={type}
                                            value={form[key as keyof typeof form]}
                                            onChange={(e) => setForm({...form, [key]: e.target.value})}
                                            placeholder={placeholder}
                                            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">문의
                                        유형</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({...form, category: e.target.value})}
                                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
                                    >
                                        <option value="">선택하세요</option>
                                        <option>계정·가입 문의</option>
                                        <option>셀러 입점·정산</option>
                                        <option>바이어 소싱·주문</option>
                                        <option>거래 분쟁</option>
                                        <option>세금계산서</option>
                                        <option>기타</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">문의
                                        내용</label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({...form, message: e.target.value})}
                                        placeholder="문의 내용을 상세히 입력해주세요."
                                        rows={5}
                                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!form.name || !form.email || !form.category || !form.message || submitting}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <span
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    ) : (
                                        <><Send size={14}/> 문의 제출</>
                                    )}
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}