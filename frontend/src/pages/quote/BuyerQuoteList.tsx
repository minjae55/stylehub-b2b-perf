import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  FlaskConical,
  Package,
  ReceiptText,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type QuoteStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

type SampleAvailable = "AVAILABLE" | "UNAVAILABLE";

type QuoteItem = {
  optionSummary: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Quote = {
  quoteId: number;
  quoteNo: string;
  sourcingRequestNo: string;
  sellerName: string;
  brandName: string;
  productName: string;
  categoryName: string;
  material: string;
  leadTimeDays: number;
  deliveryCompany: string;
  shippingFee: number | null;
  validUntil: string;
  sampleAvailable: SampleAvailable;
  sellerMemo?: string;
  subtotalAmount: number;
  totalAmount: number;
  status: QuoteStatus;
  createdAt: string;
  items: QuoteItem[];
};

const quotes: Quote[] = [
  {
    quoteId: 1,
    quoteNo: "Q-2024-0901-001",
    sourcingRequestNo: "SRC-2024-0901",
    sellerName: "르블랑 어패럴",
    brandName: "르블랑",
    productName: "여성 린넨 오버핏 블라우스",
    categoryName: "블라우스",
    material: "린넨 55%, 코튼 45%",
    leadTimeDays: 12,
    deliveryCompany: "CJ대한통운",
    shippingFee: null,
    validUntil: "2026.06.25",
    sampleAvailable: "AVAILABLE",
    sellerMemo: "샘플 제작 가능하며 본주문 진행 시 샘플비 차감 가능합니다.",
    subtotalAmount: 2800000,
    totalAmount: 2800000,
    status: "SUBMITTED",
    createdAt: "2026.06.01",
    items: [
      {
        optionSummary: "색상: 블랙 / 사이즈: M",
        quantity: 100,
        unitPrice: 14000,
        totalPrice: 1400000,
      },
      {
        optionSummary: "색상: 아이보리 / 사이즈: L",
        quantity: 100,
        unitPrice: 14000,
        totalPrice: 1400000,
      },
    ],
  },
  {
    quoteId: 2,
    quoteNo: "Q-2024-0901-002",
    sourcingRequestNo: "SRC-2024-0901",
    sellerName: "데일리앤코",
    brandName: "데일리앤코",
    productName: "여성 린넨 오버핏 블라우스",
    categoryName: "블라우스",
    material: "린넨 혼방",
    leadTimeDays: 9,
    deliveryCompany: "한진택배",
    shippingFee: 3000,
    validUntil: "2026.06.18",
    sampleAvailable: "UNAVAILABLE",
    sellerMemo: "기존 보유 원단으로 빠른 납품 가능합니다.",
    subtotalAmount: 2700000,
    totalAmount: 2703000,
    status: "UNDER_REVIEW",
    createdAt: "2026.06.02",
    items: [
      {
        optionSummary: "색상: 블랙 / 사이즈: FREE",
        quantity: 200,
        unitPrice: 13500,
        totalPrice: 2700000,
      },
    ],
  },
  {
    quoteId: 3,
    quoteNo: "Q-2024-0901-003",
    sourcingRequestNo: "SRC-2024-0901",
    sellerName: "에이블스튜디오",
    brandName: "에이블",
    productName: "여성 린넨 오버핏 블라우스",
    categoryName: "블라우스",
    material: "린넨 60%, 레이온 40%",
    leadTimeDays: 15,
    deliveryCompany: "롯데택배",
    shippingFee: null,
    validUntil: "2026.06.10",
    sampleAvailable: "AVAILABLE",
    sellerMemo: "원단 변경 시 단가 조정 가능합니다.",
    subtotalAmount: 3000000,
    totalAmount: 3000000,
    status: "EXPIRED",
    createdAt: "2026.06.03",
    items: [
      {
        optionSummary: "컬러: 베이지 / 사이즈: M",
        quantity: 120,
        unitPrice: 15000,
        totalPrice: 1800000,
      },
      {
        optionSummary: "컬러: 베이지 / 사이즈: L",
        quantity: 80,
        unitPrice: 15000,
        totalPrice: 1200000,
      },
    ],
  },
];

const statusConfig: Record<QuoteStatus, { label: string; tone: string; icon: ReactNode }> = {
  SUBMITTED: {
    label: "견적 도착",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <FileText size={13} />,
  },
  UNDER_REVIEW: {
    label: "검토 중",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock size={13} />,
  },
  ACCEPTED: {
    label: "채택 완료",
    tone: "border-green-200 bg-green-50 text-green-700",
    icon: <CheckCircle size={13} />,
  },
  REJECTED: {
    label: "거절",
    tone: "border-slate-300 bg-slate-100 text-slate-600",
    icon: <XCircle size={13} />,
  },
  EXPIRED: {
    label: "기간 만료",
    tone: "border-red-200 bg-red-50 text-red-700",
    icon: <XCircle size={13} />,
  },
};

const searchOptions = [
  { value: "seller", label: "셀러명" },
  { value: "product", label: "상품명" },
  { value: "material", label: "소재" },
  { value: "category", label: "카테고리" },
] as const;

type SearchType = (typeof searchOptions)[number]["value"];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatShippingFee(value: number | null) {
  return value === null ? "착불" : formatPrice(value);
}

function parseDate(date: string) {
  return new Date(date.replace(/\./g, "-"));
}

function getValidUntilBadge(validUntil: string) {
  const today = new Date();
  const end = parseDate(validUntil);

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      text: "만료됨",
      summaryText: `만료됨 · ${validUntil}`,
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (diff === 0) {
    return {
      text: "오늘 만료",
      summaryText: `오늘 만료 · ${validUntil}까지`,
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (diff <= 3) {
    return {
      text: `D-${diff}`,
      summaryText: `D-${diff} · ${validUntil}까지`,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  return {
    text: `D-${diff}`,
    summaryText: `D-${diff} · ${validUntil}까지`,
    className: "border-slate-200 bg-slate-100 text-slate-600",
  };
}

function getTotalQuantity(quote: Quote) {
  return quote.items.reduce((total, item) => total + item.quantity, 0);
}

function matchesQuoteFilter(quote: Quote, filter: "ALL" | "AVAILABLE" | "ACCEPTED" | "PAST") {
  if (filter === "ALL") return true;

  if (filter === "AVAILABLE") {
    return quote.status === "SUBMITTED" || quote.status === "UNDER_REVIEW";
  }

  if (filter === "ACCEPTED") {
    return quote.status === "ACCEPTED";
  }

  if (filter === "PAST") {
    return quote.status === "REJECTED" || quote.status === "EXPIRED";
  }

  return true;
}

function getLowestUnitPrice(quote: Quote) {
  return Math.min(...quote.items.map((item) => item.unitPrice));
}

function BuyerQuoteList() {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "AVAILABLE" | "ACCEPTED" | "PAST">("ALL");
  const [searchType, setSearchType] = useState<SearchType>("seller");
  const [search, setSearch] = useState("");

  const filteredQuotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return quotes.filter((quote) => {
    const statusMatched = matchesQuoteFilter(quote, activeFilter);

      const keywordMatched =
        !keyword ||
        (searchType === "seller" && quote.sellerName.toLowerCase().includes(keyword)) ||
        (searchType === "product" && quote.productName.toLowerCase().includes(keyword)) ||
        (searchType === "material" && quote.material.toLowerCase().includes(keyword)) ||
        (searchType === "category" && quote.categoryName.toLowerCase().includes(keyword));

      return statusMatched && keywordMatched;
    });
  }, [activeFilter, search, searchType]);

  const stats = [
    {
      filter: "ALL" as const,
      label: "전체 견적",
      value: `${quotes.length}건`,
      icon: <ReceiptText size={18} />,
      tone: "bg-secondary text-primary",
    },
    {
      filter: "AVAILABLE" as const,
      label: "검토 가능",
      value: `${
        quotes.filter(
          (quote) =>
            quote.status === "SUBMITTED" ||
            quote.status === "UNDER_REVIEW"
        ).length
      }건`,
      icon: <FileText size={18} />,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      filter: "ACCEPTED" as const,
      label: "채택 완료",
      value: `${
        quotes.filter((quote) => quote.status === "ACCEPTED").length
      }건`,
      icon: <CheckCircle size={18} />,
      tone: "bg-green-50 text-green-700",
    },
    {
      filter: "PAST" as const,
      label: "지난 견적",
      value: `${
        quotes.filter(
          (quote) =>
            quote.status === "REJECTED" ||
            quote.status === "EXPIRED"
        ).length
      }건`,
      icon: <Clock size={18} />,
      tone: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck size={13} />
                바이어 견적 관리
              </div>
              <h1 className="text-2xl font-black text-slate-950">
                받은 견적서를 한눈에 비교하세요
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                하나의 소싱 요청에 대해 여러 셀러가 보낸 견적 금액, 납기, 샘플 가능 여부를 비교할 수 있습니다.
              </p>
            </div>

            <Link
              to="/buyer/sourcing"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              <Package size={15} />
              소싱 요청 목록
            </Link>
          </div>
        </header>

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => setActiveFilter(stat.filter)}
              className={`rounded-xl border p-4 text-left shadow-sm transition ${
                activeFilter === stat.filter
                  ? "border-primary bg-white ring-2 ring-primary/10"
                  : "border-slate-200 bg-white hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}>
                  {stat.icon}
                </span>
                <span className="text-2xl font-black text-slate-950">{stat.value}</span>
              </div>
              <p className={`mt-3 text-sm font-bold ${activeFilter === stat.filter ? "text-primary" : "text-slate-600"}`}>
                {stat.label}
              </p>
            </button>
          ))}
        </section>

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-primary"
            >
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`${searchOptions.find((option) => option.value === searchType)?.label} 검색`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <main className="space-y-4">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.quoteId}
              quote={quote}
              expanded={expandedId === quote.quoteId}
              onToggle={() => setExpandedId(expandedId === quote.quoteId ? null : quote.quoteId)}
            />
          ))}
        </main>

        {filteredQuotes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">조건에 맞는 견적서가 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">검색어를 바꾸거나 다른 상태를 선택해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  expanded,
  onToggle,
}: {
  quote: Quote;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = statusConfig[quote.status];
  const validBadge = getValidUntilBadge(quote.validUntil);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="block w-full text-left transition hover:bg-slate-50">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-950">{quote.quoteNo}</span>

              <Badge className={status.tone}>
                {status.icon}
                {status.label}
              </Badge>

              <Badge className={validBadge.className}>
                <Clock size={12} />
                {validBadge.text}
              </Badge>

              {quote.sampleAvailable === "AVAILABLE" && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  <FlaskConical size={12} />
                  샘플 가능
                </Badge>
              )}
            </div>

            <h2 className="line-clamp-1 text-base font-black text-slate-950">
              {quote.productName}
            </h2>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{quote.sellerName}</span>
              <span>{quote.brandName}</span>
              <span>{quote.categoryName}</span>
              <span>견적일 {quote.createdAt}</span>
              <span>유효기간 {quote.validUntil}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 lg:block lg:text-right">
            <div>
              <p className="text-xs font-bold text-slate-500">총 견적 금액</p>
              <p className="mt-1 whitespace-nowrap text-xl font-black text-primary">
                {formatPrice(quote.totalAmount)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                최저 단가 {formatPrice(getLowestUnitPrice(quote))}
              </p>
            </div>
            <span className="text-slate-400 lg:hidden">
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>
      </button>

<div className="border-t border-primary/15 bg-secondary/80 px-5 py-3">
       <div className="grid gap-3 text-sm md:grid-cols-4">
          <MiniInfo label="총 수량" value={`${getTotalQuantity(quote).toLocaleString()}개`} />
          <MiniInfo label="납기" value={`${quote.leadTimeDays}일`} />
          <MiniInfo label="배송비" value={formatShippingFee(quote.shippingFee)} />
          <MiniInfo label="배송사" value={quote.deliveryCompany} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <section>
                <SectionLabel icon={<Package size={14} />} title="견적 상품 항목" />
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  {quote.items.map((item) => (
                    <div
                      key={item.optionSummary}
                      className="grid gap-2 border-b border-slate-100 bg-white px-4 py-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_190px] md:items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-950">{item.optionSummary}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.quantity.toLocaleString()}개 x {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-right font-black text-slate-950">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionLabel icon={<FileText size={14} />} title="견적 상세 정보" />
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBox label="소재" value={quote.material} />
                  <InfoBox label="카테고리" value={quote.categoryName} />
                  <InfoBox label="납기" value={`${quote.leadTimeDays}일`} />
                  <InfoBox label="샘플 제공" value={quote.sampleAvailable === "AVAILABLE" ? "가능" : "불가"} />
                </div>
              </section>

              {quote.sellerMemo && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  {quote.sellerMemo}
                </div>
              )}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionLabel icon={<ReceiptText size={14} />} title="견적 요약" />
              <div className="space-y-3 text-sm">
                <SummaryRow label="상품 금액" value={formatPrice(quote.subtotalAmount)} />
                <SummaryRow label="배송비" value={formatShippingFee(quote.shippingFee)} />
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow label="최종 금액" value={formatPrice(quote.totalAmount)} strong />
                </div>
                <SummaryRow label="견적 유효기간" value={validBadge.summaryText} />
                <SummaryRow label="소싱 요청번호" value={quote.sourcingRequestNo} />
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  to={`/buyer/quotes/${quote.quoteId}`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  <Eye size={14} />
                  견적서 상세
                </Link>

                {quote.status !== "ACCEPTED" && quote.status !== "EXPIRED" && (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary"
                  >
                    <CheckCircle size={14} />
                    이 견적 채택
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function SectionLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? "text-base font-black text-primary" : "font-semibold text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

export default BuyerQuoteList;