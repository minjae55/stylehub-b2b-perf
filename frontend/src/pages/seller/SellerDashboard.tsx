import {Link, useNavigate} from "react-router";
import {
    AlertCircle,
    ArrowRight,
    Banknote,
    Bell,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Clock,
    FileText,
    Inbox,
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
import {sellerService} from "@/api/seller/seller.service";
import {
    QuoteDraft,
    SellerDispute,
    SellerNegotiation,
    SellerSettlement,
    SellerShipment,
    SellerSourcingRequest,
    SellerTransit
} from "@/api/seller/seller.type";

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
            {message} {/* 💡 "message" 문자열 오타 수정 완료 */}
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function SellerDashboard() {
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const businessRole = user?.businessRole || "SELLER";
    const companyName = user?.companyName ?? "소속 회사 없음";

    const [currentView, setCurrentView] = useState<"buyer" | "seller">("seller");

    const handleRoleToggle = () => {
        if (currentView === "seller") {
            setCurrentView("buyer");
            navigate("/buyer");
        } else {
            setCurrentView("seller");
            navigate("/seller");
        }
    };

    // ──────────────────────────────────────────────────────────────────────────────
    // 💾 상태 관리용 useState 정의
    // ──────────────────────────────────────────────────────────────────────────────
    const [sourcingRequests, setSourcingRequests] = useState<SellerSourcingRequest[]>([]);
    const [quoteDrafts, setQuoteDrafts] = useState<QuoteDraft[]>([]);
    const [negotiations, setNegotiations] = useState<SellerNegotiation[]>([]);
    const [shipments, setShipments] = useState<SellerShipment[]>([]);
    const [transits, setTransits] = useState<SellerTransit[]>([]);
    const [disputes, setDisputes] = useState<SellerDispute[]>([]);
    const [settlements, setSettlements] = useState<SellerSettlement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ──────────────────────────────────────────────────────────────────────────────
    // 🔌 컴포넌트 마운트 시 API 동시 호출 (useEffect)
    // ──────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true; // 💡 메모리 누수 및 컴포넌트 언마운트 시 예외 방지용 플래그

        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [
                    requestsRes,
                    draftsRes,
                    negotiationsRes,
                    shipmentsRes,
                    transitsRes,
                    disputesRes,
                    settlementsRes
                ] = await Promise.all([
                    sellerService.getNewSourcingRequests(),
                    sellerService.getQuoteDrafts(),
                    sellerService.getNegotiations(),
                    sellerService.getPendingShipments(),
                    sellerService.getTransits(),
                    sellerService.getActiveDisputes(),
                    sellerService.getPendingSettlements(),
                ]);

                // 컴포넌트가 여전히 마운트된 상태일 때만 State 업데이트 실행
                if (isMounted) {
                    setSourcingRequests(requestsRes ?? []);
                    setQuoteDrafts(draftsRes ?? []);
                    setNegotiations(negotiationsRes ?? []);
                    setShipments(shipmentsRes ?? []);
                    setTransits(transitsRes ?? []);
                    setDisputes(disputesRes ?? []);
                    setSettlements(settlementsRes ?? []);
                }
            } catch (error) {
                console.error("대시보드 데이터를 가져오는데 실패했습니다.", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false; // 클린업 함수에서 플래그를 꺼줌으로써 무대 뒤 안정성 확보
        };
    }, []);

    // ──────────────────────────────────────────────────────────────────────────────

    // 방어용 기본 배열 연산 처리
    const overdueShipments = (shipments ?? []).filter((s) => s.isOverdue);
    const normalShipments = (shipments ?? []).filter((s) => !s.isOverdue);
    const overdueDrafts = (quoteDrafts ?? []).filter((d) => d.isOverdue);

    const totalSettlementAmount = (settlements ?? []).reduce((sum, s) => sum + (s.finalAmount || 0), 0);

    const counts = {
        requests: sourcingRequests.length,
        drafts: quoteDrafts.length,
        negotiations: negotiations.length,
        shipments: shipments.length,
        transits: transits.length,
        settlements: settlements.length,
        disputes: disputes.length,
        overdueShipments: overdueShipments.length,
        overdueDrafts: overdueDrafts.length,
        total: sourcingRequests.length + quoteDrafts.length + negotiations.length + shipments.length + transits.length + disputes.length,
    };

    const ACCENT = "#C4956A";

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center text-sm font-semibold text-muted-foreground">
                공급 현황 데이터를 불러오는 중입니다...
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
                            <Layers size={12}/>
                            공급현황
                        </div>
                        <h1 className="text-xl font-black text-slate-950">{companyName}</h1>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                            공급 현황을 한눈에 소싱 요청 응대, 견적 작성, 출고 관리, 정산 현황을 통합 관리할 수 있습니다.
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2.5">
                        <div className="flex items-center gap-2">
                            {businessRole === "BOTH" && (
                                <button
                                    onClick={handleRoleToggle}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    <ShoppingBag size={13}/>
                                    {currentView === "seller" ? "구매관리로 전환" : "공급관리로 전환"}
                                </button>
                            )}

                            <div className="relative">
                                <button
                                    className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                                    aria-label="알림">
                                    <Bell size={16}/>
                                </button>
                                {counts.total > 0 && (
                                    <span
                                        className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3a7fd5] px-1 text-[10px] font-black text-white">
                                    {counts.total}
                                    </span>
                                )}
                            </div>

                            <Link to="/settings"
                                  className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                                  aria-label="설정">
                                <Settings size={16}/>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/seller/products/new"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90">
                                <Plus size={13}/> 제품 등록
                            </Link>
                        </div>
                    </div>

                </div>
            </header>

            {/* ── 상단 탭 네비게이션 ── */}
            <nav className="mb-5 flex items-center gap-1 border-b border-slate-200">
                <Link to="/seller"
                      className="inline-flex h-11 items-center gap-2 border-b-2 border-primary px-4 text-sm font-bold text-primary">
                    <Layers size={15}/> 대시보드
                </Link>
                <Link to="/seller/orders"
                      className="inline-flex h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                    <ClipboardList size={15}/> 주문 관리
                </Link>
                <Link to="/seller/quotes"
                      className="inline-flex h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                    <FileText size={15}/> 견적 관리
                </Link>
            </nav>

            {/* ── 긴급 알림 배너 ── */}
            {(counts.overdueShipments > 0 || counts.disputes > 0 || counts.overdueDrafts > 0) && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
                    <AlertCircle size={15} className="text-red-500 shrink-0"/>
                    <p className="text-sm font-semibold text-red-700">
                        🔴 {[
                        counts.overdueShipments > 0 ? `출고 기한 초과 ${counts.overdueShipments}건 (즉시 처리 필요)` : null,
                        counts.disputes > 0 ? `이의제기 처리 필요 ${counts.disputes}건` : null,
                        counts.overdueDrafts > 0 ? `견적 마감 초과 ${counts.overdueDrafts}건` : null
                    ].filter(Boolean).join(" · ")}
                    </p>
                </div>
            )}

            {/* ── KPI 상단 카드 링크 그리드 ── */}
            <div className="grid grid-cols-6 gap-3 mb-6">
                <Link to="/seller/sourcing-requests?status=NEW"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><Inbox
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.requests}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">신규 요청</p>
                </Link>

                <Link to="/seller/quotes"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><FileText
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.drafts}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">견적 작성</p>
                </Link>

                <Link to="/negotiations"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span
                            className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><MessageSquare
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.negotiations}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">협의 진행</p>
                </Link>

                <Link to="/seller/orders?status=SHIPMENT_PENDING"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><Truck
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.shipments}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">출고 대기</p>
                </Link>

                <Link to="/seller/orders?status=SHIPPED"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><Clock
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.transits}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">배송·확정대기</p>
                </Link>

                <Link to="/disputes"
                      className="bg-white border border-border rounded-xl px-3.5 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"><Scale
                            size={15}/></span>
                        <ArrowRight size={11}
                                    className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5"/>
                    </div>
                    <p className="text-xl font-black text-foreground mb-0.5">{counts.disputes}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">이의제기</p>
                </Link>
            </div>

            {/* ── Panel: 출고 기한 초과 ── */}
            {overdueShipments.length > 0 && (
                <div className="bg-white border-2 border-red-300 rounded-xl overflow-hidden mb-5">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-red-200 bg-red-50/60">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-red-600"/>
                            <span className="text-sm font-bold text-red-800">출고 기한 초과 — 즉시 처리 필요</span>
                            <span
                                className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">{overdueShipments.length}</span>
                        </div>
                        <Link to="/seller/orders?status=SHIPMENT_PENDING&filter=overdue"
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium">
                            전체 보기 <ChevronRight size={12}/>
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {overdueShipments.map((s) => (
                            <div key={s.orderId} className="flex items-center gap-4 px-4 py-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                                        <Badge variant="urgent">출고 초과</Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{s.buyerName} ·
                                        ₩{s.subtotalAmount.toLocaleString()}</p>
                                </div>
                                <Link to={`/seller/orders/${s.orderId}/ship`}
                                      className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white whitespace-nowrap transition-colors">
                                    <Truck size={12}/> 송장 등록
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 메인 영역 상단 그리드 ── */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <SectionHeader icon={<Inbox size={15}/>} title="신규 요청" count={counts.requests}
                                   href="/seller/sourcing-requests?status=NEW" accent={ACCENT}/>
                    {sourcingRequests.length === 0 ? <EmptyRow message="신규 소싱 요청이 없습니다."/> : (
                        <div className="divide-y divide-border">
                            {sourcingRequests.slice(0, 5).map((r) => (
                                <Link key={r.sourcingRequestId} to={`/seller/sourcing/${r.sourcingRequestId}`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                                        <p className="text-[11px] text-muted-foreground">{r.buyerCompanyName} · 예산
                                            ₩{r.totalBudget.toLocaleString()}</p>
                                    </div>
                                    <ChevronRight size={13}
                                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <SectionHeader icon={<FileText size={15}/>} title="견적 작성" count={counts.drafts}
                                   href="/seller/quotes" accent={ACCENT}/>
                    {quoteDrafts.length === 0 ? <EmptyRow message="작성할 견적이 없습니다."/> : (
                        <div className="divide-y divide-border">
                            {quoteDrafts.slice(0, 5).map((d) => (
                                <Link key={d.quoteId} to={`/seller/sourcing/${d.quoteId}/quote`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{d.productName}</p>
                                        <p className="text-[11px] text-muted-foreground">{d.buyerName} ·
                                            ₩{d.totalAmount.toLocaleString()}</p>
                                    </div>
                                    <ChevronRight size={13}
                                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <SectionHeader icon={<MessageSquare size={15}/>} title="협의 진행" count={counts.negotiations}
                                   href="/negotiations" accent={ACCENT}/>
                    {negotiations.length === 0 ? <EmptyRow message="진행 중인 협의가 없습니다."/> : (
                        <div className="divide-y divide-border">
                            {negotiations.slice(0, 5).map((n) => (
                                <Link key={n.negotiationId} to={`/seller/negotiations/${n.negotiationId}`}
                                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/[0.04] group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{n.productName || n.title}</p>
                                        <p className="text-[11px] text-muted-foreground/70 truncate">"{n.lastMessage}"</p>
                                    </div>
                                    <ChevronRight size={13}
                                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 mt-0.5 transition-colors"/>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 메인 영역 하단 그리드 ── */}
            <div className="grid grid-cols-3 gap-4">

                {/* 패널 4: 출고 대기 */}
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <SectionHeader icon={<Truck size={15}/>} title="출고 대기" count={counts.shipments}
                                   href="/seller/orders?status=SHIPMENT_PENDING" accent={ACCENT}/>
                    {normalShipments.length === 0 && transits.length === 0 ? (
                        <EmptyRow message="출고 대기 중인 주문이 없습니다."/>
                    ) : (
                        <div className="divide-y divide-border">
                            {normalShipments.slice(0, 3).map((s) => (
                                <div key={s.orderId} className="flex items-center gap-3 px-4 py-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                                        <p className="text-[11px] text-muted-foreground">{s.buyerName} ·
                                            ₩{s.subtotalAmount.toLocaleString()}</p>
                                    </div>
                                    <Link to={`/seller/orders/${s.orderId}/ship`}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                                          style={{background: ACCENT + "18", color: ACCENT}}>
                                        송장 등록
                                    </Link>
                                </div>
                            ))}
                            {transits.slice(0, 2).map((t) => (
                                <div key={t.orderId}
                                     className="flex items-center justify-between px-4 py-3.5 bg-slate-50/40">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground truncate">{t.productName}</p>
                                        <p className="text-[10px] text-muted-foreground/60">{t.buyerName} · 배송 흐름 대기</p>
                                    </div>
                                    <Badge variant={t.status === "DELIVERED" ? "success" : "info"}>
                                        {t.status === "DELIVERED" ? "확정대기" : "배송중"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 패널 5: 이의 제기 */}
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <SectionHeader icon={<Scale size={15}/>} title="이의 제기" count={counts.disputes} href="/disputes"
                                   accent={ACCENT}/>
                    {disputes.length === 0 ? <EmptyRow message="진행 중인 이의 제기 건이 없습니다."/> : (
                        <div className="divide-y divide-border">
                            {disputes.slice(0, 5).map((d) => (
                                <Link key={d.disputeId} to={`/seller/disputes/${d.disputeId}`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold text-foreground truncate">{d.title}</p>
                                            {d.status === "RECEIVED" && <Badge variant="urgent">답변 필요</Badge>}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate">{d.buyerClaim}</p>
                                    </div>
                                    <ChevronRight size={13}
                                                  className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors"/>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 패널 6: 정산 현황 */}
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Banknote size={15} className="text-[#C4956A]"/>
                            <span className="text-sm font-bold text-foreground">정산 현황</span>
                        </div>
                        <Link to="/seller/settlements"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            전체 보기 <ChevronRight size={12}/>
                        </Link>
                    </div>
                    <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">예정 정산액 합계</span>
                        <span
                            className="text-sm font-black text-foreground">₩{totalSettlementAmount.toLocaleString()}</span>
                    </div>
                    {settlements.length === 0 ? <EmptyRow message="정산 예정 건이 없습니다."/> : (
                        <div className="divide-y divide-border">
                            {settlements.slice(0, 5).map((s) => (
                                <Link key={s.settlementId} to={`/seller/settlements/${s.settlementId}`}
                                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/[0.04] group transition-colors">
                                    <CheckCircle size={14} className="text-emerald-400 shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate mb-0.5">{s.productName}</p>
                                        <p className="text-[11px] text-muted-foreground">{s.buyerName} ·
                                            주문번호 {s.orderNo}</p>
                                    </div>
                                    <span
                                        className="text-sm font-black text-foreground shrink-0">₩{(s.finalAmount ?? 0).toLocaleString()}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}