import {Link, useNavigate} from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckSquare,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  Scale,
  Settings,
  ShoppingBag,
  Timer,
  Truck,
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {buyerService} from "@/api/buyer/buyer.service";
import type {
  BuyerDispute,
  BuyerNegotiationResponse,
  BuyerOrderResponse,
  BuyerQuoteResponse,
  BuyerSourcingResponse,
  UrgentReceipt,
} from "@/api/buyer/buyer.type";
import {useAuthStore} from "@/store/useAuthStore";

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

// ── Data hook ─────────────────────────────────────────────────────────────────

// 💡 백엔드 포맷 변경에 대응하도록 대시보드 상태 데이터 타입 구조 재정의
interface BuyerDashboardData {
  sourcingRequests: BuyerSourcingResponse;
  quotes: BuyerQuoteResponse;
  negotiations: BuyerNegotiationResponse;
  payments: BuyerOrderResponse;
  shippings: BuyerOrderResponse;
  receipts: UrgentReceipt[]; // 아직 배열 규격 유지
  disputes: BuyerDispute[];   // 아직 배열 규격 유지
}

const EMPTY_DATA: BuyerDashboardData = {
  sourcingRequests: {totalCount: 0, list: []},
  quotes: {totalCount: 0, list: []},
  negotiations: {totalCount: 0, list: []},
  payments: {totalCount: 0, list: []},
  shippings: {totalCount: 0, list: []},
  receipts: [],
  disputes: [],
};

function useBuyerDashboardData() {
  const [data, setData] = useState<BuyerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          sourcingRequests,
          quotes,
          negotiations,
          payments,
          shippings,
          disputes,
          receipts,
        ] = await Promise.all([
          buyerService.getSourcingRequests(),
          buyerService.getReceivedQuotes(),
          buyerService.getNegotiations(),
          buyerService.getPendingPayments(),
          buyerService.getShippingOrders(),
          buyerService.getActiveDisputes(),
          buyerService.getUrgentReceipts(),
        ]);
        if (!mounted) return;
        setData({sourcingRequests, quotes, negotiations, payments, shippings, disputes, receipts});
      } catch (e) {
        if (!mounted) return;
        console.error("Failed to load buyer dashboard data", e);
        setError("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return {...data, isLoading, error};
}

// ── Alert Banner ──────────────────────────────────────────────────────────────

function AlertBanner({
                       urgentReceipts, urgentSourcing, disputes,
                     }: { urgentReceipts: number; urgentSourcing: number; disputes: number }) {
  const alerts: string[] = [];
  if (urgentReceipts > 0)
    alerts.push(`수령 확인 ${urgentReceipts}건 (D+5 이상, 자동 확정 임박)`);
  if (urgentSourcing > 0)
    alerts.push(`견적 만료 임박 ${urgentSourcing}건`);
  if (disputes > 0)
    alerts.push(`이의제기 답변 필요 ${disputes}건`);

  if (alerts.length === 0) return null;

  return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
        <AlertCircle size={15} className="text-red-500 shrink-0"/>
        <p className="text-sm font-semibold text-red-700">
          🔴 {alerts.join(" · ")}
        </p>
      </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

function StatCards({
                     sourcingRequests, quotes, negotiations, payments, disputes, receipts,
                   }: {
  sourcingRequests: BuyerSourcingResponse;
  quotes: BuyerQuoteResponse;
  negotiations: BuyerNegotiationResponse;
  payments: BuyerOrderResponse;
  disputes: BuyerDispute[];
  receipts: UrgentReceipt[];
}) {
  const cards = [
    {
      // 💡 count 출력 및 filter를 돌릴 때 모두 .totalCount 및 .list로 차분하게 접근하도록 변경
      label: "소싱 요청", count: sourcingRequests.totalCount,
      icon: <Plus size={16}/>,
      href: "/buyer/my-sourcing",
      urgent: sourcingRequests.list?.filter((r) => r.daysUntilExpiry <= 2).length,
      urgentLabel: "만료 임박",
    },
    {
      label: "견적 수신", count: quotes.totalCount,
      icon: <FileText size={16}/>,
      href: "/buyer/quotes?status=RECEIVED",
      urgent: quotes.list?.filter((q) => q.isUrgent).length,
      urgentLabel: "만료 임박",
    },
    {
      label: "협의 진행", count: negotiations.totalCount,
      icon: <MessageSquare size={16}/>,
      href: "/negotiations",
      urgent: negotiations.list?.filter((n) => n.hasUnread).length,
      urgentLabel: "미확인 메시지",
    },
    {
      label: "결제 대기", count: payments.totalCount,
      icon: <CreditCard size={16}/>,
      href: "/buyer/orders?status=PAYMENT_PENDING",
      urgent: 0, urgentLabel: "",
    },
    {
      label: "이의 제기", count: disputes.length,
      icon: <Scale size={16}/>,
      href: "orders/disputes",
      urgent: disputes.filter((d) => d.status === "RECEIVED").length,
      urgentLabel: "답변 필요",
    },
    {
      label: "주문 관리", count: receipts.length,
      icon: <CheckSquare size={16}/>,
      href: "/buyer/orders",
      urgent: receipts.filter((r) => r.daysElapsed >= 5).length,
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
                <ArrowRight size={12}
                            className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
              </div>
              <p className="text-2xl font-black text-foreground mb-0.5">{c.count}</p>
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              {c.urgent > 0 && (
                  <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10}/> {c.urgentLabel} {c.urgent}건
                  </p>
              )}
            </Link>
        ))}
      </div>
  );
}

// ── Panel: 수령 확인 (full-width, 긴급) ──────────────────────────────────────

function ReceiptPanel({receipts}: { receipts: UrgentReceipt[] }) {
  return (
      <div className="bg-white border-2 border-amber-300 rounded-xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-amber-600"/>
            <span className="text-sm font-bold text-amber-800">수령 확인 필요</span>
            <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full">
            {receipts.length}
          </span>
            <span className="text-[11px] text-amber-600 font-medium ml-1">· 구매 확정 후 셀러에게 대금이 정산됩니다</span>
          </div>
          <Link
              to="/buyer/orders?status=DELIVERED"
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 transition-colors font-medium"
          >
            전체 보기 <ChevronRight size={12}/>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {receipts.map((r) => {
            const isAutoConfirmRisk = r.daysElapsed >= 5;
            return (
                <div key={r.orderId} className="flex items-center gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                      {isAutoConfirmRisk && <Badge variant="urgent">자동확정 임박</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{r.sellerCompanyName} · {r.qty}</p>
                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${isAutoConfirmRisk ? "text-red-600" : "text-amber-600"}`}>
                      <Timer size={9}/>
                      도착 후 D+{r.daysElapsed}
                      {isAutoConfirmRisk && " · D+7 자동 확정까지 얼마 안 남았습니다"}
                    </p>
                  </div>
                  <Link
                      to={`/buyer/orders/${r.orderId}/confirm`}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-white ${isAutoConfirmRisk ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
                  >
                    <CheckSquare size={12}/> 구매 확정
                  </Link>
                </div>
            );
          })}
        </div>
      </div>
  );
}

// ── Panel: 소싱 요청 ──────────────────────────────────────────────────────────

function SourcingPanel({sourcingRequests}: { sourcingRequests: BuyerSourcingResponse }) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<Plus size={15}/>}
            title="소싱 요청 중"
            count={sourcingRequests.totalCount} // 💡 totalCount 매핑
            href="/buyer/my-sourcing"
            accent={ACCENT}
        />
        {sourcingRequests.totalCount === 0 ? (
            <EmptyRow message="진행 중인 소싱 요청이 없습니다."/>
        ) : (
            <div className="divide-y divide-border">
              {/* 💡 .list에서 슬라이싱해서 렌더링하도록 변경 */}
              {sourcingRequests.list?.slice(0, 5).map((r) => {
                const isExpiringSoon = r.daysUntilExpiry <= 2;
                return (
                    <Link
                        key={r.sourcingRequestId}
                        to={`/buyer/sourcing/${r.sourcingRequestId}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isExpiringSoon ? "bg-red-400" :
                              r.status === "QUOTED" ? "bg-emerald-400" : "bg-muted-foreground/20"
                      }`}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                          {isExpiringSoon && <Badge variant="urgent">만료 D-{r.daysUntilExpiry}</Badge>}
                          {!isExpiringSoon && r.status === "QUOTED" && (
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
                      <ChevronRight size={13}
                                    className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                    </Link>
                );
              })}
            </div>
        )}
      </div>
  );
}

// ── Panel: 견적 수신 ──────────────────────────────────────────────────────────

function QuotePanel({quotes}: { quotes: BuyerQuoteResponse }) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<FileText size={15}/>}
            title="견적 수신"
            count={quotes.totalCount} // 💡 totalCount 매핑
            href="/buyer/quotes?status=RECEIVED"
            accent={ACCENT}
        />
        {quotes.totalCount === 0 ? (
            <EmptyRow message="수신된 견적이 없습니다."/>
        ) : (
            <div className="divide-y divide-border">
              {/* 💡 .list에서 데이터 맵핑 */}
              {quotes.list.slice(0, 5).map((q) => (
                  <Link
                      key={q.quoteId}
                      to={`/buyer/quotes/${q.quoteId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${q.isUrgent ? "bg-red-400" : "bg-[#3a7fd5]/40"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{q.productName}</p>
                        {q.isUrgent && <Badge variant="urgent">만료 임박</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {q.companyName} · {q.qty} · ₩{q.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">₩{q.unitPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">유효 {q.expiresAt}까지</p>
                    </div>
                    <ChevronRight size={13}
                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 협의 진행 ──────────────────────────────────────────────────────────

function NegotiationPanel({negotiations}: { negotiations: BuyerNegotiationResponse }) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<MessageSquare size={15}/>}
            title="협의 진행"
            count={negotiations.totalCount} // 💡 totalCount 매핑
            href="/negotiations"
            accent={ACCENT}
        />
        {negotiations.totalCount === 0 ? (
            <EmptyRow message="진행 중인 협의가 없습니다."/>
        ) : (
            <div className="divide-y divide-border">
              {/* 💡 .list에서 데이터 맵핑 */}
              {negotiations.list.slice(0, 5).map((n) => (
                  <Link
                      key={n.negotiationId}
                      to={`/buyer/negotiations/${n.negotiationId}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div
                        className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.hasUnread ? "bg-[#3a7fd5]" : "bg-muted-foreground/20"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{n.productName}</p>
                        {n.hasUnread && <Badge variant="new">NEW</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">{n.sellerCompanyName} · {n.qty}</p>
                      <p className="text-[11px] text-muted-foreground/70 truncate">"{n.lastMessage}"</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">{n.updatedAt}</p>
                      <ChevronRight size={13}
                                    className="text-muted-foreground/30 group-hover:text-foreground ml-auto mt-2 transition-colors"/>
                    </div>
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 결제 대기 ──────────────────────────────────────────────────────────

function PaymentPanel({payments}: { payments: BuyerOrderResponse }) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<CreditCard size={15}/>}
            title="결제 대기"
            count={payments.totalCount} // 💡 totalCount 매핑
            href="/buyer/orders?status=PAYMENT_PENDING"
            accent={ACCENT}
        />
        {payments.totalCount === 0 ? (
            <EmptyRow message="결제 대기 중인 주문이 없습니다."/>
        ) : (
            <div className="divide-y divide-border">
              {/* 💡 .list에서 데이터 맵핑 */}
              {payments.list.slice(0, 5).map((p) => (
                  <Link
                      key={p.orderId}
                      to={`/buyer/orders/${p.orderId}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate mb-0.5">{p.productName}</p>
                      <p className="text-[11px] text-muted-foreground">{p.sellerCompanyName} · {p.qty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-foreground">₩{p.totalAmount.toLocaleString()}</p>
                      {p.confirmedAt && <p className="text-[10px] text-muted-foreground mt-0.5">확정 {p.confirmedAt}</p>}
                    </div>
                    <ChevronRight size={13}
                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 배송 중 ────────────────────────────────────────────────────────────

function ShippingPanel({shippings}: { shippings: BuyerOrderResponse }) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <SectionHeader
            icon={<Truck size={15}/>}
            title="배송 중"
            count={shippings.totalCount} // 💡 totalCount 매핑
            href="/buyer/orders?status=SHIPPING"
            accent={ACCENT}
        />
        {shippings.totalCount === 0 ? (
            <EmptyRow message="배송 중인 주문이 없습니다."/>
        ) : (
            <div className="divide-y divide-border">
              {/* 💡 .list에서 데이터 맵핑 */}
              {shippings.list.slice(0, 5).map((s) => (
                  <Link
                      key={s.orderId}
                      to={`/buyer/orders/${s.orderId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                        {s.isDelayed && <Badge variant="urgent">배송 지연</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{s.sellerCompanyName} · {s.qty}</p>
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
                    <ChevronRight size={13}
                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                  </Link>
              ))}
            </div>
        )}
      </div>
  );
}

// ── Panel: 이의제기 ───────────────────────────────────────────────────────────

const DISPUTE_STATUS_LABEL: Record<BuyerDispute["status"], string> = {
  RECEIVED: "답변 필요",
  UNDER_REVIEW: "검토 중",
  RESOLVED: "해결됨",
};

function DisputePanel({disputes}: { disputes: BuyerDispute[] }) {
  return (
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50/40">
          <div className="flex items-center gap-2">
            <Scale size={15} className="text-red-500"/>
            <span className="text-sm font-bold text-red-800">이의제기</span>
            <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
            {disputes.length}
          </span>
          </div>
          <Link
              to="/buyer/orders/disputes"
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            전체 보기 <ChevronRight size={12}/>
          </Link>
        </div>
        {disputes.length === 0 ? (
            <EmptyRow message="접수된 이의제기가 없습니다."/>
        ) : (
            <>
              <div className="divide-y divide-border">
                {disputes.map((d) => (
                    <Link
                        key={d.disputeId}
                        to={`/buyer/orders/disputes/${d.disputeId}`}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/30 transition-colors group"
                    >
                      <AlertCircle size={14} className="text-red-400 shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{d.productName}</p>
                          {d.status === "RECEIVED" && <Badge variant="urgent">{DISPUTE_STATUS_LABEL[d.status]}</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{d.sellerCompanyName} · {d.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{d.createdAt}</p>
                        <p className="text-[10px] text-red-500 font-semibold mt-0.5">#{d.disputeId}</p>
                      </div>
                      <ChevronRight size={13}
                                    className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                    </Link>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-red-50/40 border-t border-red-100">
                <p className="text-[11px] text-red-700 flex items-center gap-1.5">
                  <AlertCircle size={11} className="shrink-0"/>
                  이의제기 처리 중 에스크로 자금이 보류됩니다.
                </p>
              </div>
            </>
        )}
      </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

type JobRole = "PRESIDENT" | "EMPLOYEE";
type BusinessRole = "BUYER" | "SELLER" | "BOTH";

const JOB_ROLE_BADGE: Record<JobRole, { label: string; className: string }> = {
  PRESIDENT: {label: "대표", className: "bg-purple-50 text-purple-700 border-purple-200"},
  EMPLOYEE: {label: "직원", className: "bg-slate-50 text-slate-600 border-slate-200"},
};

const BUSINESS_ROLE_BADGE: Record<BusinessRole, { label: string; className: string }> = {
  BUYER: {label: "구매 권한", className: "bg-blue-50 text-blue-700 border-blue-200"},
  SELLER: {label: "판매 권한", className: "bg-emerald-50 text-emerald-700 border-emerald-200"},
  BOTH: {label: "통합 권한", className: "bg-indigo-50 text-indigo-700 border-indigo-200"},
};

export function BuyerDashboard() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const businessRole = user?.businessRole as BusinessRole;
  const jobRole = user?.role as JobRole | undefined;
  const companyName = user?.companyName ?? "회사 미등록";
  const logoUrl = user?.logoUrl;
  const userName = user?.name;

  const {
    sourcingRequests, quotes, negotiations, payments, shippings, receipts, disputes,
    isLoading, error,
  } = useBuyerDashboardData();

  // 💡 알림 종 모양 뱃지에 쓸 전체 건수 계산식도 totalCount 구조에 맞추어 보정
  const totalCount = useMemo(
      () => sourcingRequests.totalCount + quotes.totalCount + negotiations.totalCount + payments.totalCount + receipts.length + disputes.length,
      [sourcingRequests, quotes, negotiations, payments, receipts, disputes],
  );

  // 💡 상단 만료 임박 추출 필터링도 .list 내부 배열을 타깃으로 잡도록 수정
  const urgentSourcingCount = useMemo(() => sourcingRequests.list?.filter((r) => r.daysUntilExpiry <= 2).length, [sourcingRequests]);
  const urgentReceiptsCount = useMemo(() => receipts.filter((r) => r.daysElapsed >= 5).length, [receipts]);

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        {/* ── 헤더 ── */}
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">

            {/* 좌: 회사명 + 타이틀 */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-1.5">
              <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <ShoppingBag size={12}/>
                구매관리
              </span>
                {jobRole && (
                    <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${JOB_ROLE_BADGE[jobRole].className}`}>
                  {JOB_ROLE_BADGE[jobRole].label}
                </span>
                )}
                {businessRole && (
                    <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${BUSINESS_ROLE_BADGE[businessRole].className}`}>
                  {BUSINESS_ROLE_BADGE[businessRole].label}
                </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {logoUrl && (
                    <img src={logoUrl} alt={companyName} className="w-6 h-6 rounded object-cover"/>
                )}
                <h1 className="text-xl font-black text-slate-950">
                  {companyName}
                </h1>
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {userName}님, 구매 현황을 한눈에 소싱 요청, 견적 검토, 발주 결제, 배송 및 수령 확인을 통합 관리할 수 있습니다.
              </p>
            </div>
            {/* 우: 2행 레이아웃 */}
            <div className="flex shrink-0 flex-col items-end gap-2.5">

              <div className="flex items-center gap-2">
                {businessRole === "BOTH" && (
                    <button
                        onClick={() => navigate("/seller")}
                        className="flex h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <Layers size={13}/>
                      판매관리로 전환
                    </button>
                )}

                <div className="relative">
                  <button
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                      aria-label={`알림 ${totalCount}건`}
                  >
                    <Bell size={16}/>
                  </button>
                  {totalCount > 0 && (
                      <span
                          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3a7fd5] px-1 text-[10px] font-black text-white">
        {totalCount}
      </span>
                  )}
                </div>

                <Link
                    to="/settings"
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                    aria-label="설정"
                >
                  <Settings size={16}/>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Link
                    to="../buyer/sourcing-request"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90"
                >
                  <MessageSquare size={13}/> 새 소싱 요청
                </Link>
              </div>

            </div>
          </div>
        </header>

        {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="text-red-500 shrink-0"/>
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
        )}

        {isLoading ? (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
              불러오는 중...
            </div>
        ) : (
            <>
              <AlertBanner
                  urgentReceipts={urgentReceiptsCount}
                  urgentSourcing={urgentSourcingCount}
                  disputes={disputes.length}
              />

              <StatCards
                  sourcingRequests={sourcingRequests}
                  quotes={quotes}
                  negotiations={negotiations}
                  payments={payments}
                  disputes={disputes}
                  receipts={receipts}
              />

              {receipts.length > 0 && <ReceiptPanel receipts={receipts}/>}

              <div className="grid grid-cols-3 gap-4 mb-4">
                <SourcingPanel sourcingRequests={sourcingRequests}/>
                <QuotePanel quotes={quotes}/>
                <NegotiationPanel negotiations={negotiations}/>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <PaymentPanel payments={payments}/>
                <ShippingPanel shippings={shippings}/>
                <DisputePanel disputes={disputes}/>
              </div>
            </>
        )}
      </div>
  );
}