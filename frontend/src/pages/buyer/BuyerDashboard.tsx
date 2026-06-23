import { Link, useNavigate } from "react-router";
import {
  FileText, MessageSquare, CreditCard, Truck,
  CheckSquare, ChevronRight, AlertCircle, Clock,
  ArrowRight, Package, Plus, ShoppingBag, Bell, Settings,
  Scale, Timer, Layers,
} from "lucide-react";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SourcingRequestItem {
  id: string;
  productName: string;
  qty: string;
  budget: string;
  category: string;
  requestedAt: string;
  expiresAt: string;
  daysUntilExpiry: number; // 양수: 남은 날, 음수: 초과
  bidCount: number;
  status: "PENDING" | "QUOTE_RECEIVED";
}

interface QuoteItem {
  id: string;
  productName: string;
  sellerName: string;
  qty: string;
  unitPrice: string;
  total: string;
  receivedAt: string;
  expiresAt: string;
  isUrgent: boolean;
}

interface NegotiationItem {
  id: string;
  productName: string;
  sellerName: string;
  qty: string;
  lastMessage: string;
  lastMessageAt: string;
  hasNewMessage: boolean;
}

interface PaymentItem {
  id: string;
  productName: string;
  sellerName: string;
  qty: string;
  amount: number;
  confirmedAt: string;
}

interface ShippingItem {
  id: string;
  productName: string;
  sellerName: string;
  qty: string;
  trackingNo: string | null;
  carrier: string | null;
  shippedAt: string;
  estimatedAt: string;
  isDelayed: boolean; // estimatedAt 지난 건
}

interface ReceiptItem {
  id: string;
  productName: string;
  sellerName: string;
  qty: string;
  deliveredAt: string;
  daysElapsed: number;
}

interface DisputeItem {
  id: string;
  productName: string;
  sellerName: string;
  reason: string;
  status: "PENDING_ANSWER" | "IN_REVIEW" | "RESOLVED";
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const SOURCING_REQUESTS: SourcingRequestItem[] = [
  {
    id: "SRC-2024-0130", productName: "여름 린넨 반팔셔츠", qty: "300벌",
    budget: "₩5,000,000~", category: "셔츠/블라우스",
    requestedAt: "2024.03.21", expiresAt: "2024.03.28",
    daysUntilExpiry: 2, bidCount: 3, status: "QUOTE_RECEIVED",
  },
  {
    id: "SRC-2024-0128", productName: "와이드 코튼 팬츠", qty: "200벌",
    budget: "₩4,000,000~", category: "슬랙스",
    requestedAt: "2024.03.20", expiresAt: "2024.03.27",
    daysUntilExpiry: 7, bidCount: 0, status: "PENDING",
  },
  {
    id: "SRC-2024-0125", productName: "크롭 반팔 니트 3색", qty: "150벌",
    budget: "₩3,500,000~", category: "니트/스웨터",
    requestedAt: "2024.03.19", expiresAt: "2024.03.26",
    daysUntilExpiry: 1, bidCount: 1, status: "QUOTE_RECEIVED",
  },
];

const QUOTES: QuoteItem[] = [
  {
    id: "BID-2024-0048", productName: "린넨 오버핏 셔츠", sellerName: "셀러 A",
    qty: "200벌", unitPrice: "₩22,000", total: "₩4,400,000",
    receivedAt: "2024.03.21", expiresAt: "2024.03.25", isUrgent: true,
  },
  {
    id: "BID-2024-0047", productName: "와이드 데님 팬츠", sellerName: "셀러 B",
    qty: "150벌", unitPrice: "₩35,000", total: "₩5,250,000",
    receivedAt: "2024.03.20", expiresAt: "2024.03.28", isUrgent: false,
  },
  {
    id: "BID-2024-0046", productName: "크롭 후드 집업", sellerName: "셀러 C",
    qty: "300벌", unitPrice: "₩18,500", total: "₩5,550,000",
    receivedAt: "2024.03.19", expiresAt: "2024.03.29", isUrgent: false,
  },
  {
    id: "BID-2024-0045", productName: "플리츠 미디 스커트", sellerName: "셀러 A",
    qty: "100벌", unitPrice: "₩28,000", total: "₩2,800,000",
    receivedAt: "2024.03.18", expiresAt: "2024.03.30", isUrgent: false,
  },
  {
    id: "BID-2024-0044", productName: "오버핏 니트 가디건", sellerName: "셀러 D",
    qty: "250벌", unitPrice: "₩42,000", total: "₩10,500,000",
    receivedAt: "2024.03.17", expiresAt: "2024.03.31", isUrgent: false,
  },
];

const NEGOTIATIONS: NegotiationItem[] = [
  {
    id: "NEG-2024-0031", productName: "청바지 봄 신상 2종", sellerName: "르솔레이유",
    qty: "400벌", lastMessage: "납기일 조정 가능한지 확인 부탁드립니다.",
    lastMessageAt: "방금 전", hasNewMessage: true,
  },
  {
    id: "NEG-2024-0030", productName: "프릴넥 플로럴 원피스", sellerName: "모아패션",
    qty: "200벌", lastMessage: "색상 옵션 중 아이보리 추가 가능합니다.",
    lastMessageAt: "1시간 전", hasNewMessage: true,
  },
  {
    id: "NEG-2024-0029", productName: "스트라이프 셔츠", sellerName: "트렌드메이커",
    qty: "300벌", lastMessage: "포장 단위 변경 건 검토 중입니다.",
    lastMessageAt: "어제", hasNewMessage: false,
  },
];

const PAYMENTS: PaymentItem[] = [
  {
    id: "ORD-2024-0841", productName: "크롭 후드 집업", sellerName: "스포츠웨어",
    qty: "300벌", amount: 5550000, confirmedAt: "2024.03.21",
  },
  {
    id: "ORD-2024-0839", productName: "하이웨이스트 슬랙스", sellerName: "트렌드메이커",
    qty: "180벌", amount: 4320000, confirmedAt: "2024.03.20",
  },
];

const SHIPPINGS: ShippingItem[] = [
  {
    id: "ORD-2024-0820", productName: "린넨 오버핏 셔츠", sellerName: "르솔레이유",
    qty: "200벌", trackingNo: "CJ123456789KR", carrier: "CJ대한통운",
    shippedAt: "2024.03.21", estimatedAt: "2024.03.23", isDelayed: false,
  },
  {
    id: "ORD-2024-0815", productName: "오버핏 니트 가디건", sellerName: "모아패션",
    qty: "250벌", trackingNo: "LO987654321KR", carrier: "롯데택배",
    shippedAt: "2024.03.20", estimatedAt: "2024.03.22", isDelayed: true,
  },
  {
    id: "ORD-2024-0810", productName: "와이드 데님 팬츠", sellerName: "진스타일",
    qty: "150벌", trackingNo: null, carrier: null,
    shippedAt: "2024.03.19", estimatedAt: "2024.03.24", isDelayed: false,
  },
];

const RECEIPTS: ReceiptItem[] = [
  {
    id: "ORD-2024-0798", productName: "크롭 반팔 티셔츠", sellerName: "케이스타일",
    qty: "500벌", deliveredAt: "2024.03.19", daysElapsed: 5,
  },
  {
    id: "ORD-2024-0795", productName: "폴로 카라 니트", sellerName: "르솔레이유",
    qty: "120벌", deliveredAt: "2024.03.18", daysElapsed: 3,
  },
];

const DISPUTES: DisputeItem[] = [
  {
    id: "ORD-2024-0798", productName: "크롭 반팔 티셔츠", sellerName: "케이스타일",
    reason: "불량품 포함 (30벌)", status: "PENDING_ANSWER", createdAt: "2024.03.20",
  },
];

// ── Counts ────────────────────────────────────────────────────────────────────

const COUNTS = {
  sourcing:     SOURCING_REQUESTS.length,
  quotes:       QUOTES.length,
  negotiations: NEGOTIATIONS.length,
  payments:     PAYMENTS.length,
  receipts:     RECEIPTS.length,
  disputes:     DISPUTES.length,
  urgentSourcing: SOURCING_REQUESTS.filter((r) => r.daysUntilExpiry <= 2).length,
  urgentReceipts: RECEIPTS.filter((r) => r.daysElapsed >= 5).length,
  total: SOURCING_REQUESTS.length + QUOTES.length + NEGOTIATIONS.length +
      PAYMENTS.length + RECEIPTS.length + DISPUTES.length,
};

// ── Shared helpers ────────────────────────────────────────────────────────────

const ACCENT = "#3a7fd5";

function Badge({ children, variant = "default" }: {
  children: React.ReactNode;
  variant?: "default" | "urgent" | "new" | "info" | "muted" | "success";
}) {
  const cls: Record<string, string> = {
    default: "bg-muted text-muted-foreground border-border",
    urgent:  "bg-red-50 text-red-700 border-red-200",
    new:     "bg-blue-50 text-blue-700 border-blue-200",
    info:    "bg-amber-50 text-amber-700 border-amber-200",
    muted:   "bg-muted/60 text-muted-foreground border-border",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${cls[variant]}`}>
      {children}
    </span>
  );
}

function SectionHeader({
                         icon, title, count, href, accent,
                       }: {
  icon: React.ReactNode; title: string; count: number;
  href: string; accent?: string;
}) {
  return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span style={accent ? { color: accent } : {}}>{icon}</span>
          <span className="text-sm font-bold text-foreground">{title}</span>
          <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full"
                style={{ background: accent ?? "#6b7280" }}>
          {count}
        </span>
        </div>
        <Link
            to={href}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          전체 보기 <ChevronRight size={12} />
        </Link>
      </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        {message}
      </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────

function AlertBanner() {
  const alerts: string[] = [];
  if (COUNTS.urgentReceipts > 0)
    alerts.push(`수령 확인 ${COUNTS.urgentReceipts}건 (D+5 이상, 자동 확정 임박)`);
  if (COUNTS.urgentSourcing > 0)
    alerts.push(`견적 만료 임박 ${COUNTS.urgentSourcing}건`);
  if (COUNTS.disputes > 0)
    alerts.push(`이의제기 답변 필요 ${COUNTS.disputes}건`);

  if (alerts.length === 0) return null;

  return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
        <AlertCircle size={15} className="text-red-500 shrink-0" />
        <p className="text-sm font-semibold text-red-700">
          🔴 {alerts.join(" · ")}
        </p>
      </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

function StatCards() {
  const cards = [
    {
      label: "소싱 요청", count: COUNTS.sourcing,
      icon: <Plus size={16} />,
      href: "/buyer/my-sourcing",
      urgent: COUNTS.urgentSourcing,
      urgentLabel: "만료 임박",
    },
    {
      label: "견적 수신", count: COUNTS.quotes,
      icon: <FileText size={16} />,
      href: "/buyer/quotes?status=RECEIVED",
      urgent: QUOTES.filter((q) => q.isUrgent).length,
      urgentLabel: "만료 임박",
    },
    {
      label: "협의 진행", count: COUNTS.negotiations,
      icon: <MessageSquare size={16} />,
      href: "/negotiations",
      urgent: NEGOTIATIONS.filter((n) => n.hasNewMessage).length,
      urgentLabel: "미확인 메시지",
    },
    {
      label: "결제 대기", count: COUNTS.payments,
      icon: <CreditCard size={16} />,
      href: "/buyer/orders?status=PAYMENT_PENDING",
      urgent: 0, urgentLabel: "",
    },
    {
      label: "이의 제기", count: COUNTS.payments,
      icon: <Scale size={16} />,
      href: "/disputes",
      urgent: 0, urgentLabel: "",
    },
    {
      label: "주문 관리", count: COUNTS.receipts,
      icon: <CheckSquare size={16} />,
      href: "/orders",
      urgent: COUNTS.urgentReceipts,
      urgentLabel: "자동확정 임박",
    },
  ];

  return (
      <div className="grid grid-cols-6 gap-3 mb-6">
        {cards.map((c) => (
            <Link
                key={c.label}
                to={c.href}
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
            <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors">
              {c.icon}
            </span>
                <ArrowRight size={12} className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5" />
              </div>
              <p className="text-2xl font-black text-foreground mb-0.5">{c.count}</p>
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              {c.urgent > 0 && (
                  <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> {c.urgentLabel} {c.urgent}건
                  </p>
              )}
            </Link>
        ))}
      </div>
  );
}

// ── Panel: 수령 확인 (full-width, 긴급) ──────────────────────────────────────

function ReceiptPanel() {
  return (
      <div className="bg-white border-2 border-amber-300 rounded-xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-800">수령 확인 필요</span>
            <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full">
            {COUNTS.receipts}
          </span>
            <span className="text-[11px] text-amber-600 font-medium ml-1">· 구매 확정 후 셀러에게 대금이 정산됩니다</span>
          </div>
          <Link
              to="/buyer/orders?status=DELIVERED"
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 transition-colors font-medium"
          >
            전체 보기 <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {RECEIPTS.map((r) => {
            const isAutoConfirmRisk = r.daysElapsed >= 5;
            return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                      {isAutoConfirmRisk && <Badge variant="urgent">자동확정 임박</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{r.sellerName} · {r.qty}</p>
                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${isAutoConfirmRisk ? "text-red-600" : "text-amber-600"}`}>
                      <Timer size={9} />
                      도착 후 D+{r.daysElapsed}
                      {isAutoConfirmRisk && " · D+7 자동 확정까지 얼마 안 남았습니다"}
                    </p>
                  </div>
                  <Link
                      to={`/buyer/orders/${r.id}/confirm`}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-white ${isAutoConfirmRisk ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
                  >
                    <CheckSquare size={12} /> 구매 확정
                  </Link>
                </div>
            );
          })}
        </div>
      </div>
  );
}

// ── Panel: 소싱 요청 ──────────────────────────────────────────────────────────

function SourcingPanel() {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<Plus size={15} />}
            title="소싱 요청 중"
            count={COUNTS.sourcing}
            href="/buyer/my-sourcing"
            accent={ACCENT}
        />
        {SOURCING_REQUESTS.length === 0 ? (
            <EmptyRow message="진행 중인 소싱 요청이 없습니다." />
        ) : (
            <div className="divide-y divide-border">
              {SOURCING_REQUESTS.slice(0, 5).map((r) => {
                const isExpiringSoon = r.daysUntilExpiry <= 2;
                return (
                    <Link
                        key={r.id}
                        to={`/buyer/sourcing/${r.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isExpiringSoon ? "bg-red-400" :
                              r.status === "QUOTE_RECEIVED" ? "bg-emerald-400" : "bg-muted-foreground/20"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                          {isExpiringSoon && <Badge variant="urgent">만료 D-{r.daysUntilExpiry}</Badge>}
                          {!isExpiringSoon && r.status === "QUOTE_RECEIVED" && (
                              <Badge variant="new">견적 {r.bidCount}건</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {r.category} · {r.qty} · {r.budget}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[10px] font-semibold ${isExpiringSoon ? "text-red-500" : "text-muted-foreground"}`}>
                          마감 {r.expiresAt}
                        </p>
                        {r.status === "PENDING" && !isExpiringSoon && (
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">견적 대기 중</p>
                        )}
                      </div>
                      <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                    </Link>
                );
              })}
            </div>
        )}
      </div>
  );
}

// ── Panel: 견적 수신 ──────────────────────────────────────────────────────────

function QuotePanel() {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<FileText size={15} />}
            title="견적 수신"
            count={COUNTS.quotes}
            href="/buyer/quotes?status=RECEIVED"
            accent={ACCENT}
        />
        {QUOTES.length === 0 ? (
            <EmptyRow message="수신된 견적이 없습니다." />
        ) : (
            <div className="divide-y divide-border">
              {QUOTES.slice(0, 5).map((q) => (
                  <Link
                      key={q.id}
                      to={`/buyer/quotes/${q.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${q.isUrgent ? "bg-red-400" : "bg-[#3a7fd5]/40"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{q.productName}</p>
                        {q.isUrgent && <Badge variant="urgent">만료 임박</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {q.sellerName} · {q.qty} · {q.total}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">{q.unitPrice}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">유효 {q.expiresAt}까지</p>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 협의 진행 ──────────────────────────────────────────────────────────

function NegotiationPanel() {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<MessageSquare size={15} />}
            title="협의 진행"
            count={COUNTS.negotiations}
            href="/negotiations"
            accent={ACCENT}
        />
        {NEGOTIATIONS.length === 0 ? (
            <EmptyRow message="진행 중인 협의가 없습니다." />
        ) : (
            <div className="divide-y divide-border">
              {NEGOTIATIONS.slice(0, 5).map((n) => (
                  <Link
                      key={n.id}
                      to={`/buyer/negotiations/${n.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.hasNewMessage ? "bg-[#3a7fd5]" : "bg-muted-foreground/20"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{n.productName}</p>
                        {n.hasNewMessage && <Badge variant="new">NEW</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">{n.sellerName} · {n.qty}</p>
                      <p className="text-[11px] text-muted-foreground/70 truncate">"{n.lastMessage}"</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">{n.lastMessageAt}</p>
                      <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground ml-auto mt-2 transition-colors" />
                    </div>
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 결제 대기 ──────────────────────────────────────────────────────────

function PaymentPanel() {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<CreditCard size={15} />}
            title="결제 대기"
            count={COUNTS.payments}
            href="/buyer/orders?status=PAYMENT_PENDING"
            accent={ACCENT}
        />
        {PAYMENTS.length === 0 ? (
            <EmptyRow message="결제 대기 중인 주문이 없습니다." />
        ) : (
            <div className="divide-y divide-border">
              {PAYMENTS.slice(0, 5).map((p) => (
                  <Link
                      key={p.id}
                      to={`/buyer/orders/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate mb-0.5">{p.productName}</p>
                      <p className="text-[11px] text-muted-foreground">{p.sellerName} · {p.qty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-foreground">₩{p.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">확정 {p.confirmedAt}</p>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 배송 중 ────────────────────────────────────────────────────────────

function ShippingPanel() {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<Truck size={15} />}
            title="배송 중"
            count={SHIPPINGS.length}
            href="/buyer/orders?status=SHIPPING"
            accent={ACCENT}
        />
        {SHIPPINGS.length === 0 ? (
            <EmptyRow message="배송 중인 주문이 없습니다." />
        ) : (
            <div className="divide-y divide-border">
              {SHIPPINGS.slice(0, 5).map((s) => (
                  <Link
                      key={s.id}
                      to={`/buyer/orders/${s.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                        {s.isDelayed && <Badge variant="urgent">배송 지연</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{s.sellerName} · {s.qty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {s.trackingNo ? (
                          <>
                            <p className="text-[11px] font-semibold text-[#3a7fd5]">{s.carrier}</p>
                            <p className={`text-[10px] font-mono mt-0.5 ${s.isDelayed ? "text-red-500" : "text-muted-foreground"}`}>
                              {s.isDelayed ? "⚠ 도착 예정일 초과" : s.trackingNo}
                            </p>
                          </>
                      ) : (
                          <Badge variant="info">송장 등록 전</Badge>
                      )}
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 이의제기 ───────────────────────────────────────────────────────────

const DISPUTE_STATUS_LABEL: Record<DisputeItem["status"], string> = {
  PENDING_ANSWER: "답변 필요",
  IN_REVIEW:      "검토 중",
  RESOLVED:       "해결됨",
};

function DisputePanel() {
  if (COUNTS.disputes === 0) return null;
  return (
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50/40">
          <div className="flex items-center gap-2">
            <Scale size={15} className="text-red-500" />
            <span className="text-sm font-bold text-red-800">이의제기</span>
            <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
            {COUNTS.disputes}
          </span>
          </div>
          <Link
              to="/buyer/disputes"
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            전체 보기 <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {DISPUTES.map((d) => (
              <Link
                  key={d.id}
                  to={`/buyer/disputes/${d.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/30 transition-colors group"
              >
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{d.productName}</p>
                    {d.status === "PENDING_ANSWER" && <Badge variant="urgent">{DISPUTE_STATUS_LABEL[d.status]}</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{d.sellerName} · {d.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">{d.createdAt}</p>
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">{d.id}</p>
                </div>
                <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
              </Link>
          ))}
        </div>
        <div className="px-4 py-2.5 bg-red-50/40 border-t border-red-100">
          <p className="text-[11px] text-red-700 flex items-center gap-1.5">
            <AlertCircle size={11} className="shrink-0" />
            이의제기 처리 중 에스크로 자금이 보류됩니다.
          </p>
        </div>
      </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

type UserRole = "buyer" | "seller";
// business_role: "BUYER" | "SELLER" | "BOTH" — BOTH인 경우에만 전환 버튼 노출
type BusinessRole = "BUYER" | "SELLER" | "BOTH";

export function BuyerDashboard() {
  const navigate = useNavigate();
  const businessRole: BusinessRole = "BOTH"; // DB에서 가져올 값
  const [role] = useState<UserRole>("buyer");
  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        {/* ── 헤더 ── */}
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">

            {/* 좌: 회사명 + 타이틀 */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <ShoppingBag size={12} />
                구매관리
              </div>
              <h1 className="text-xl font-black text-slate-950">
                스타일위크㈜
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                구매 현황을 한눈에 소싱 요청, 견적 검토, 발주 결제, 배송 및 수령 확인을 통합 관리할 수 있습니다.
              </p>
            </div>

            {/* 우: 2행 레이아웃 */}
            <div className="flex shrink-0 flex-col items-end gap-2.5">

              {/* 윗줄: 역할 전환 · 알림 · 설정 */}
              {/* 윗줄: 역할 전환 · 알림(뱃지) · 설정 */}
              <div className="flex items-center gap-2">
                {businessRole === "BOTH" && (
                    <button
                        onClick={() => navigate(role === "buyer" ? "/seller" : "/buyer")}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      {role === "buyer" ? <Layers size={13} /> : <ShoppingBag size={13} />}
                      {role === "buyer" ? "공급관리로 전환" : "구매관리로 전환"}
                    </button>
                )}

                {/* 알림 — 업무 수 뱃지 */}
                <div className="relative">
                  <button
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                      aria-label={`알림 ${COUNTS.total}건`}
                  >
                    <Bell size={16} />
                  </button>
                  {COUNTS.total > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3a7fd5] px-1 text-[10px] font-black text-white">
        {COUNTS.total}
      </span>
                  )}
                </div>

                <Link
                    to="/company-settings"
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                    aria-label="설정"
                >
                  <Settings size={16} />
                </Link>
              </div>

              {/* 아랫줄: 새 소싱 요청 */}
              <div className="flex items-center gap-2">
                <Link
                    to="../sourcing-request"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90"
                >
                  <MessageSquare size={13} /> 새 소싱 요청
                </Link>
              </div>

            </div>
          </div>
        </header>

        {/* ── 긴급 알림 배너 ── */}
        <AlertBanner />

        {/* ── KPI 카드 (5칸) ── */}
        <StatCards />

        {/* ── 수령 확인 (긴급, full-width, 있을 때만) ── */}
        {COUNTS.receipts > 0 && <ReceiptPanel />}

        {/* ── 소싱요청 + 견적수신 + 협의진행 ── */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <SourcingPanel />
          <QuotePanel />
          <NegotiationPanel />
        </div>

        {/* ── 결제대기 + 배송중 + 이의제기 ── */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <PaymentPanel />
          <ShippingPanel />
          {COUNTS.disputes > 0 && <DisputePanel />}
        </div>
      </div>
  );
}