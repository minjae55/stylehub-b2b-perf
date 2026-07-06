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
  Truck,
} from "lucide-react";
import {useEffect, useState} from "react";
import {useAuthStore} from "@/store/useAuthStore";

// ── 데이터 타입 정의 ───────────────────────────────────────────────────────

interface SourcingItem {
  id: number;
  title: string;
  isUrgent: boolean;
}

interface QuoteItem {
  id: number;
  title: string;
  company: string;
  price: string;
  isUrgent: boolean;
}

interface NegotiationItem {
  id: number;
  lastMessage: string;
  hasUnread: boolean;
}

interface PaymentItem {
  id: number;
  title: string;
  amount: number;
}

interface ShippingItem {
  id: number;
  title: string;
  statusText: string;
}

interface DisputeItem {
  id: number;
  title: string;
  reason: string;
}

interface UrgentReceiptItem {
  id: number;
  title: string;
  company: string;
  dDay: string;
}

// ── Shared components ────────────────────────────────────────────────────────────

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
        {message} {/* 💡 버그 수정: 중괄호 추가 */}
      </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function BuyerDashboard() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const businessRole = user?.businessRole || "BUYER";
  const companyName = user?.companyName ?? "소속 회사 없음";

  const [currentView, setCurrentView] = useState<"buyer" | "seller">("buyer");

  const handleRoleToggle = () => {
    if (currentView === "buyer") {
      setCurrentView("seller");
      navigate("/seller");
    } else {
      setCurrentView("buyer");
      navigate("/buyer");
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 💾 상태 관리용 useState 정의
  // ──────────────────────────────────────────────────────────────────────────────
  const [sourcingList, setSourcingList] = useState<SourcingItem[]>([]);
  const [quoteList, setQuoteList] = useState<QuoteItem[]>([]);
  const [negotiationList, setNegotiationList] = useState<NegotiationItem[]>([]);
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([]);
  const [shippingList, setShippingList] = useState<ShippingItem[]>([]);
  const [disputeList, setDisputeList] = useState<DisputeItem[]>([]);
  const [urgentReceiptList, setUrgentReceiptList] = useState<UrgentReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ──────────────────────────────────────────────────────────────────────────────
  // 🔌 컴포넌트 마운트 시 API 동시 호출 (useEffect)
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        setIsLoading(true);

        const [
          sourcingRes,
          quotesRes,
          negotiationsRes,
          ordersPaymentRes,
          ordersShippingRes,
          disputesRes,
          urgentReceiptsRes
        ] = await Promise.all([
          fetch("/api/v1/buyer/sourcings?status=PROGRESS").then(res => res.json()),
          fetch("/api/v1/buyer/quotes?status=RECEIVED").then(res => res.json()),
          fetch("/api/v1/buyer/negotiations?status=OPEN").then(res => res.json()),
          fetch("/api/v1/buyer/orders?status=PAYMENT_PENDING").then(res => res.json()),
          fetch("/api/v1/buyer/orders?status=SHIPPING").then(res => res.json()),
          fetch("/api/v1/buyer/disputes?status=ACTIVE").then(res => res.json()),
          fetch("/api/v1/buyer/orders?status=DELIVERED&urgent=true").then(res => res.json()),
        ]);

        setSourcingList(sourcingRes);
        setQuoteList(quotesRes);
        setNegotiationList(negotiationsRes);
        setPaymentList(ordersPaymentRes);
        setShippingList(ordersShippingRes);
        setDisputeList(disputesRes);
        setUrgentReceiptList(urgentReceiptsRes);
      } catch (error) {
        console.error("구매 대시보드 데이터를 가져오는데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuyerData();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────

  const counts = {
    sourcing: sourcingList.length,
    quotes: quoteList.length,
    negotiations: negotiationList.length,
    payments: paymentList.length,
    receipts: shippingList.length,
    disputes: disputeList.length,
    urgentSourcing: sourcingList.filter(item => item.isUrgent).length,
    urgentQuotes: quoteList.filter(item => item.isUrgent).length,
    urgentNegotiations: negotiationList.filter(item => item.hasUnread).length,
    urgentReceipts: urgentReceiptList.length,
    total: sourcingList.length + quoteList.length + negotiationList.length,
  };

  const ACCENT = "#3a7fd5";

  if (isLoading) {
    return (
        <div className="flex h-96 items-center justify-center text-sm font-semibold text-muted-foreground">
          구매 현황 데이터를 불러오는 중입니다...
        </div>
    );
  }

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        {/* ── 헤더 ── */}
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div
                  className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <ShoppingBag size={12}/>
                구매관리
              </div>
              <h1 className="text-xl font-black text-slate-950">{companyName}</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                구매 현황을 한눈에 소싱 요청, 견적 검토, 발주 결제, 배송 및 수령 확인을 통합 관리할 수 있습니다.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2.5">
              <div className="flex items-center gap-2">
                {businessRole === "BOTH" && (
                    <button
                        onClick={handleRoleToggle}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <Layers size={13}/>
                      {currentView === "buyer" ? "공급관리로 전환" : "구매관리로 전환"}
                    </button>
                )}

                <div className="relative">
                  <button
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100">
                    <Bell size={16}/>
                  </button>
                  {counts.total > 0 && (
                      <span
                          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3a7fd5] px-1 text-[10px] font-black text-white">
                    {counts.total}
                  </span>
                  )}
                </div>

                <Link to="/mypage"
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100">
                  <Settings size={16}/>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Link to="../sourcing-request"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90">
                  <MessageSquare size={13}/> 새 소싱 요청
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── 긴급 알림 배너 ── */}
        {(counts.urgentReceipts > 0 || counts.urgentSourcing > 0 || counts.disputes > 0) && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="text-red-500 shrink-0"/>
              <p className="text-sm font-semibold text-red-700">
                🔴 {[
                counts.urgentReceipts > 0 && `수령 확인 ${counts.urgentReceipts}건 (자동 확정 임박)`,
                counts.urgentSourcing > 0 && `견적 만료 임박 ${counts.urgentSourcing}건`,
                counts.disputes > 0 && `이의제기 답변 필요 ${counts.disputes}건`
              ].filter(Boolean).join(" · ")}
              </p>
            </div>
        )}

        {/* ── KPI 상단 카드 링크 그리드 ── */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          <Link to="/buyer/my-sourcing"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><Plus
                  size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.sourcing}</p>
            <p className="text-xs text-muted-foreground font-medium">소싱 요청</p>
            {counts.urgentSourcing > 0 && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle
                    size={10}/> 만료 임박</p>
            )}
          </Link>

          <Link to="/buyer/quotes?status=RECEIVED"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><FileText size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.quotes}</p>
            <p className="text-xs text-muted-foreground font-medium">견적 수신</p>
            {counts.urgentQuotes > 0 && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle
                    size={10}/> 만료 임박</p>
            )}
          </Link>

          <Link to="/negotiations"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><MessageSquare
                  size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.negotiations}</p>
            <p className="text-xs text-muted-foreground font-medium">협의 진행</p>
            {counts.urgentNegotiations > 0 && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle
                    size={10}/> 미확인 메시지</p>
            )}
          </Link>

          <Link to="/buyer/orders?status=PAYMENT_PENDING"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><CreditCard
                  size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.payments}</p>
            <p className="text-xs text-muted-foreground font-medium">결제 대기</p>
          </Link>

          <Link to="/disputes"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><Scale
                  size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.disputes}</p>
            <p className="text-xs text-muted-foreground font-medium">이의 제기</p>
          </Link>

          <Link to="/buyer/orders"
                className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#3a7fd5]/50 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-muted-foreground group-hover:text-[#3a7fd5] transition-colors"><CheckSquare
                  size={16}/></span>
              <ArrowRight size={12}
                          className="text-muted-foreground/30 group-hover:text-[#3a7fd5] transition-colors mt-0.5"/>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{counts.receipts}</p>
            <p className="text-xs text-muted-foreground font-medium">주문 관리</p>
            {counts.urgentReceipts > 0 && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle
                    size={10}/> 자동확정 임박</p>
            )}
          </Link>
        </div>

        {/* ── Panel: 수령 확인 필요 ── */}
        {urgentReceiptList.length > 0 && (
            <div className="bg-white border-2 border-amber-300 rounded-xl overflow-hidden mb-5">
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50/60">
                <div className="flex items-center gap-2">
                  <CheckSquare size={15} className="text-amber-600"/>
                  <span className="text-sm font-bold text-amber-800">수령 확인 필요</span>
                  <span
                      className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full">{counts.urgentReceipts}</span>
                </div>
                <Link to="/buyer/orders?status=DELIVERED"
                      className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                  전체 보기 <ChevronRight size={12}/>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {urgentReceiptList.map((item) => (
                    <div key={item.id}
                         className="flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-500">{item.company}</span>
                      </div>
                      <Badge variant="urgent">자동확정 {item.dDay}</Badge>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ── 메인 대시보드 그리드 ── */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* 패널 1: 소싱 요청 리스트 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<Plus size={15}/>} title="소싱 요청 중" count={counts.sourcing} href="/buyer/my-sourcing"
                           accent={ACCENT}/>
            {sourcingList.length === 0 ? (
                <EmptyRow message="진행 중인 소싱 요청이 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {sourcingList.map((item) => (
                      <div key={item.id}
                           className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.title}</span>
                        {item.isUrgent && <Badge variant="urgent">만료임박</Badge>}
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* 패널 2: 견적 수신 리스트 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<FileText size={15}/>} title="견적 수신" count={counts.quotes}
                           href="/buyer/quotes?status=RECEIVED" accent={ACCENT}/>
            {quoteList.length === 0 ? (
                <EmptyRow message="수신된 견적이 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {quoteList.map((item) => (
                      <div key={item.id}
                           className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-700">{item.title}</span>
                          <span className="text-slate-400 block text-[10px]">{item.company}</span>
                        </div>
                        <span className="font-bold text-primary">{item.price}</span>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* 패널 3: 협의 진행 리스트 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<MessageSquare size={15}/>} title="협의 진행" count={counts.negotiations}
                           href="/negotiations" accent={ACCENT}/>
            {negotiationList.length === 0 ? (
                <EmptyRow message="진행 중인 협의가 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {negotiationList.map((item) => (
                      <div key={item.id}
                           className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <span className="text-slate-700 truncate max-w-[200px]">{item.lastMessage}</span>
                        {item.hasUnread && <Badge variant="new">NEW</Badge>}
                      </div>
                  ))}
                </div>
            )}
          </div>

        </div>

        {/* ── 서브 대시보드 그리드 ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* 패널 4: 결제 대기 내역 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<CreditCard size={15}/>} title="결제 대기" count={counts.payments}
                           href="/buyer/orders?status=PAYMENT_PENDING" accent={ACCENT}/>
            {paymentList.length === 0 ? (
                <EmptyRow message="결제 대기 중인 주문이 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {paymentList.map((item) => (
                      <div key={item.id}
                           className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <span className="text-slate-700 font-medium">{item.title}</span>
                        <button className="bg-primary text-white font-bold px-2 py-1 rounded text-[10px]">결제하기</button>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* 패널 5: 배송 현황 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<Truck size={15}/>} title="배송 중" count={counts.receipts}
                           href="/buyer/orders?status=SHIPPING" accent={ACCENT}/>
            {shippingList.length === 0 ? (
                <EmptyRow message="배송 중인 주문이 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {shippingList.map((item) => (
                      <div key={item.id}
                           className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <span className="text-slate-700">{item.title}</span>
                        <Badge variant="success">{item.statusText}</Badge>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* 패널 6: 이의제기 내역 */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader icon={<Scale size={15}/>} title="이의 제기" count={counts.disputes} href="/disputes"
                           accent={ACCENT}/>
            {disputeList.length === 0 ? (
                <EmptyRow message="진행 중인 이의 제기 건이 없습니다."/>
            ) : (
                <div className="divide-y divide-border">
                  {disputeList.map((item) => (
                      <div key={item.id} className="px-4 py-3 text-xs hover:bg-slate-50 transition-colors">
                        <span className="text-red-600 font-medium">{item.title}</span>
                        <span className="text-slate-400 block text-[10px]">{item.reason}</span>
                      </div>
                  ))}
                </div>
            )}
            {counts.disputes > 0 && (
                <div className="px-4 py-2.5 bg-red-50/40 border-t border-red-100">
                  <p className="text-[11px] text-red-700 flex items-center gap-1.5">
                    <AlertCircle size={11} className="shrink-0"/>
                    이의제기 처리 중 에스크로 자금이 보류됩니다.
                  </p>
                </div>
            )}
          </div>

        </div>
      </div>
  );
}