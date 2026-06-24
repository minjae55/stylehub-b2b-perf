import {Link, useNavigate} from "react-router";
import {
    AlertCircle,
    ArrowRight,
    Banknote,
    Bell,
    CheckCircle,
    ChevronRight,
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
import {useState} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SourcingRequest {
    id: string;
    productName: string;
    buyerName: string;
    qty: string;
    budget: string;
    category: string;
    requestedAt: string;
    expiresAt: string;
    isNew: boolean;
}

interface QuoteDraft {
    id: string;
    productName: string;
    buyerName: string;
    qty: string;
    budget: string;
    deadline: string;
    isOverdue: boolean;
    daysUntilDeadline: number; // 양수: 남은 날, 음수/0: 초과
}

interface NegotiationItem {
    id: string;
    productName: string;
    buyerName: string;
    qty: string;
    lastMessage: string;
    lastMessageAt: string;
    hasNewMessage: boolean;
}

interface ShipmentItem {
    id: string;
    productName: string;
    buyerName: string;
    qty: string;
    amount: number;
    paidAt: string;
    shipByDate: string;
    isDue: boolean;    // 기한 임박
    isOverdue: boolean; // 기한 초과
}

interface SettlementItem {
    id: string;
    productName: string;
    buyerName: string;
    qty: string;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    confirmedAt: string;
}

interface DisputeItem {
    id: string;
    productName: string;
    buyerName: string;
    reason: string;
    status: "PENDING_ANSWER" | "IN_REVIEW" | "RESOLVED";
    createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const SOURCING_REQUESTS: SourcingRequest[] = [
    {
        id: "SRC-2024-0124", productName: "린넨 오버핏 셔츠", buyerName: "바이어 A",
        qty: "200벌", budget: "₩4,000,000~₩5,000,000", category: "셔츠/블라우스",
        requestedAt: "2024.03.21", expiresAt: "2024.03.25", isNew: true,
    },
    {
        id: "SRC-2024-0122", productName: "와이드 데님 팬츠", buyerName: "바이어 B",
        qty: "300벌", budget: "₩9,000,000~", category: "청바지",
        requestedAt: "2024.03.20", expiresAt: "2024.03.26", isNew: true,
    },
    {
        id: "SRC-2024-0120", productName: "크롭 후드 집업 4색", buyerName: "바이어 C",
        qty: "400벌", budget: "₩6,000,000~₩8,000,000", category: "후드/맨투맨",
        requestedAt: "2024.03.19", expiresAt: "2024.03.27", isNew: false,
    },
    {
        id: "SRC-2024-0118", productName: "플리츠 미디 스커트", buyerName: "바이어 D",
        qty: "150벌", budget: "₩4,500,000", category: "치마",
        requestedAt: "2024.03.18", expiresAt: "2024.03.28", isNew: false,
    },
    {
        id: "SRC-2024-0116", productName: "오버핏 니트 가디건", buyerName: "바이어 E",
        qty: "250벌", budget: "₩10,000,000~", category: "니트/스웨터",
        requestedAt: "2024.03.17", expiresAt: "2024.03.29", isNew: false,
    },
];

const QUOTE_DRAFTS: QuoteDraft[] = [
    {
        id: "SRC-2024-0115", productName: "스트라이프 셔츠", buyerName: "바이어 F",
        qty: "300벌", budget: "₩7,000,000~",
        deadline: "2024.03.22", isOverdue: false, daysUntilDeadline: 1,
    },
    {
        id: "SRC-2024-0113", productName: "조거 팬츠 3색", buyerName: "바이어 G",
        qty: "500벌", budget: "₩8,000,000~",
        deadline: "2024.03.21", isOverdue: true, daysUntilDeadline: -1,
    },
    {
        id: "SRC-2024-0110", productName: "프릴넥 원피스", buyerName: "바이어 H",
        qty: "200벌", budget: "₩6,500,000",
        deadline: "2024.03.23", isOverdue: false, daysUntilDeadline: 2,
    },
    {
        id: "SRC-2024-0108", productName: "봄 자켓 혼합 구성", buyerName: "바이어 A",
        qty: "120벌", budget: "₩5,000,000",
        deadline: "2024.03.24", isOverdue: false, daysUntilDeadline: 3,
    },
];

const NEGOTIATIONS: NegotiationItem[] = [
    {
        id: "NEG-2024-0031", productName: "청바지 봄 신상 2종", buyerName: "스타일위크",
        qty: "400벌", lastMessage: "납기일 3월 30일로 조정 가능한지요?",
        lastMessageAt: "방금 전", hasNewMessage: true,
    },
    {
        id: "NEG-2024-0030", productName: "프릴넥 플로럴 원피스", buyerName: "패션플러스",
        qty: "200벌", lastMessage: "아이보리 색상 추가 시 단가는 얼마인가요?",
        lastMessageAt: "2시간 전", hasNewMessage: true,
    },
    {
        id: "NEG-2024-0028", productName: "크롭 반팔 티셔츠", buyerName: "트렌디샵",
        qty: "600벌", lastMessage: "포장 방식 변경 건은 별도 비용 없이 가능합니다.",
        lastMessageAt: "어제", hasNewMessage: false,
    },
];

const SHIPMENTS: ShipmentItem[] = [
    {
        id: "ORD-2024-0841", productName: "오버핏 린넨 블라우스", buyerName: "스타일위크",
        qty: "200벌", amount: 4400000,
        paidAt: "2024.03.21", shipByDate: "2024.03.21", isDue: false, isOverdue: true,
    },
    {
        id: "ORD-2024-0839", productName: "와이드 데님 팬츠", buyerName: "패션플러스",
        qty: "150벌", amount: 5250000,
        paidAt: "2024.03.20", shipByDate: "2024.03.23", isDue: true, isOverdue: false,
    },
    {
        id: "ORD-2024-0835", productName: "크롭 후드 집업", buyerName: "언니네옷장",
        qty: "300벌", amount: 5550000,
        paidAt: "2024.03.19", shipByDate: "2024.03.26", isDue: false, isOverdue: false,
    },
];

const SETTLEMENTS: SettlementItem[] = [
    {
        id: "ORD-2024-0820", productName: "린넨 오버핏 셔츠", buyerName: "스타일위크",
        qty: "200벌", grossAmount: 4400000, platformFee: 220000, netAmount: 4180000,
        confirmedAt: "2024.03.20",
    },
    {
        id: "ORD-2024-0815", productName: "오버핏 니트 가디건", buyerName: "트렌디샵",
        qty: "250벌", grossAmount: 10500000, platformFee: 525000, netAmount: 9975000,
        confirmedAt: "2024.03.19",
    },
];

const DISPUTES: DisputeItem[] = [
    {
        id: "ORD-2024-0798", productName: "크롭 반팔 티셔츠", buyerName: "스타일위크",
        reason: "불량품 포함 (30벌)", status: "PENDING_ANSWER", createdAt: "2024.03.20",
    },
];

// ── Counts ────────────────────────────────────────────────────────────────────

const COUNTS = {
    requests:        SOURCING_REQUESTS.length,
    drafts:          QUOTE_DRAFTS.length,
    negotiations:    NEGOTIATIONS.length,
    shipments:       SHIPMENTS.length,
    settlements:     SETTLEMENTS.length,
    disputes:        DISPUTES.length,
    overdueShipments: SHIPMENTS.filter((s) => s.isOverdue).length,
    overdueDrafts:   QUOTE_DRAFTS.filter((d) => d.isOverdue).length,
    total: SOURCING_REQUESTS.length + QUOTE_DRAFTS.length + NEGOTIATIONS.length +
        SHIPMENTS.length + DISPUTES.length,
};

// ── Shared helpers ────────────────────────────────────────────────────────────

const ACCENT = "#C4956A";

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
    if (COUNTS.overdueShipments > 0)
        alerts.push(`출고 기한 초과 ${COUNTS.overdueShipments}건 (즉시 처리 필요)`);
    if (COUNTS.disputes > 0)
        alerts.push(`이의제기 처리 필요 ${COUNTS.disputes}건`);
    if (COUNTS.overdueDrafts > 0)
        alerts.push(`견적 마감 초과 ${COUNTS.overdueDrafts}건`);

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
            label: "신규 요청", count: COUNTS.requests,
            icon: <Inbox size={16} />,
            href: "/seller/sourcing-requests?status=NEW",
            urgent: SOURCING_REQUESTS.filter((r) => r.isNew).length,
            urgentLabel: "오늘 신규",
        },
        {
            label: "견적 작성", count: COUNTS.drafts,
            icon: <FileText size={16} />,
            href: "/seller/sourcing/:requestId/quote",
            urgent: COUNTS.overdueDrafts,
            urgentLabel: "기한 초과",
        },
        {
            label: "협의 진행", count: COUNTS.negotiations,
            icon: <MessageSquare size={16} />,
            href: "/negotiations",
            urgent: NEGOTIATIONS.filter((n) => n.hasNewMessage).length,
            urgentLabel: "미확인 메시지",
        },
        {
            label: "출고 대기", count: COUNTS.shipments,
            icon: <Truck size={16} />,
            href: "/seller/orders?status=SHIPMENT_PENDING",
            urgent: SHIPMENTS.filter((s) => s.isDue || s.isOverdue).length,
            urgentLabel: "기한 초과/임박",
        },
        {
            label: "이의제기", count: COUNTS.disputes,
            icon: <Scale size={16} />,
            href: "/disputes",
            urgent: DISPUTES.filter((d) => d.status === "PENDING_ANSWER").length,
            urgentLabel: "처리 필요",
        },
    ];

    return (
        <div className="grid grid-cols-5 gap-3 mb-6">
            {cards.map((c) => (
                <Link
                    key={c.label}
                    to={c.href}
                    className="bg-white border border-border rounded-xl px-4 py-4 hover:border-[#C4956A]/50 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-start justify-between mb-3">
            <span className="text-muted-foreground group-hover:text-[#C4956A] transition-colors">
              {c.icon}
            </span>
                        <ArrowRight size={12} className="text-muted-foreground/30 group-hover:text-[#C4956A] transition-colors mt-0.5" />
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

// ── Panel: 출고 기한 초과 (full-width, 긴급) ──────────────────────────────────

function OverdueShipmentBanner() {
    const overdueItems = SHIPMENTS.filter((s) => s.isOverdue);
    if (overdueItems.length === 0) return null;

    return (
        <div className="bg-white border-2 border-red-300 rounded-xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-200 bg-red-50/60">
                <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="text-red-600" />
                    <span className="text-sm font-bold text-red-800">출고 기한 초과 — 즉시 처리 필요</span>
                    <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
            {overdueItems.length}
          </span>
                </div>
                <Link
                    to="/seller/orders?status=SHIPMENT_PENDING&filter=overdue"
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
                >
                    전체 보기 <ChevronRight size={12} />
                </Link>
            </div>
            <div className="divide-y divide-border">
                {overdueItems.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 px-4 py-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                                <Badge variant="urgent">출고 초과</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{s.buyerName} · {s.qty}</p>
                            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                                <Clock size={9} /> 출고 기한 {s.shipByDate} 초과
                            </p>
                        </div>
                        <div className="text-right shrink-0 mr-2">
                            <p className="text-sm font-black text-foreground">₩{s.amount.toLocaleString()}</p>
                        </div>
                        <Link
                            to={`/seller/orders/${s.id}/ship`}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Truck size={12} /> 송장 등록
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Panel: 신규 소싱 요청 ─────────────────────────────────────────────────────

function RequestPanel() {
    return (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader
                icon={<Inbox size={15} />}
                title="신규 요청"
                count={COUNTS.requests}
                href="/seller/sourcing-requests?status=NEW"
                accent={ACCENT}
            />
            {SOURCING_REQUESTS.length === 0 ? (
                <EmptyRow message="신규 소싱 요청이 없습니다." />
            ) : (
                <div className="divide-y divide-border">
                    {SOURCING_REQUESTS.slice(0, 5).map((r) => (
                        <Link
                            key={r.id}
                            to={`/seller/sourcing/${r.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${r.isNew ? "bg-[#C4956A]" : "bg-muted-foreground/20"}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-semibold text-foreground truncate">{r.productName}</p>
                                    {r.isNew && <Badge variant="new">NEW</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {r.buyerName} · {r.qty} · {r.category}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-foreground">{r.budget}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">마감 {r.expiresAt}</p>
                            </div>
                            <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                        </Link>
                    ))}
                </div>
            )}
            <div className="px-4 py-2.5 border-t border-border bg-muted/20">
                <Link
                    to="/seller/products/new"
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-[#C4956A] hover:text-[#b3845a] transition-colors py-1"
                >
                    <Plus size={12} /> 새 상품 등록
                </Link>
            </div>
        </div>
    );
}

// ── Panel: 견적 작성 ──────────────────────────────────────────────────────────

function QuoteDraftPanel() {
    return (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader
                icon={<FileText size={15} />}
                title="견적 작성"
                count={COUNTS.drafts}
                href="/seller/sourcing?status=QUOTE_PENDING"
                accent={ACCENT}
            />
            {QUOTE_DRAFTS.length === 0 ? (
                <EmptyRow message="작성할 견적이 없습니다." />
            ) : (
                <div className="divide-y divide-border">
                    {QUOTE_DRAFTS.slice(0, 5).map((d) => (
                        <Link
                            key={d.id}
                            to={`/seller/sourcing/${d.id}/quote`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${d.isOverdue ? "bg-red-400" : d.daysUntilDeadline <= 1 ? "bg-amber-400" : "bg-muted-foreground/20"}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-semibold text-foreground truncate">{d.productName}</p>
                                    {d.isOverdue && <Badge variant="urgent">기한 초과</Badge>}
                                    {!d.isOverdue && d.daysUntilDeadline <= 1 && <Badge variant="info">D-{d.daysUntilDeadline}</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground">{d.buyerName} · {d.qty}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[11px] text-foreground font-medium">{d.budget}</p>
                                <p className={`text-[10px] mt-0.5 font-semibold ${d.isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                                    마감 {d.deadline}
                                </p>
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
                            to={`/seller/negotiations/${n.id}`}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/[0.04] transition-colors group"
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.hasNewMessage ? "bg-[#C4956A]" : "bg-muted-foreground/20"}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-semibold text-foreground truncate">{n.productName}</p>
                                    {n.hasNewMessage && <Badge variant="new">NEW</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground mb-1">{n.buyerName} · {n.qty}</p>
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

// ── Panel: 출고 대기 (기한 임박 + 일반 통합) ─────────────────────────────────

function ShipmentPanel() {
    // 초과 건 제외 (OverdueShipmentBanner에서 처리)
    const normalItems = SHIPMENTS.filter((s) => !s.isOverdue);

    return (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
            <SectionHeader
                icon={<Truck size={15} />}
                title="출고 대기"
                count={COUNTS.shipments}
                href="/seller/orders?status=SHIPMENT_PENDING"
                accent={ACCENT}
            />
            {normalItems.length === 0 ? (
                <EmptyRow message="출고 대기 중인 주문이 없습니다." />
            ) : (
                <div className="divide-y divide-border">
                    {normalItems.slice(0, 5).map((s) => (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-semibold text-foreground truncate">{s.productName}</p>
                                    {s.isDue && <Badge variant="urgent">기한 임박</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground">{s.buyerName} · {s.qty}</p>
                                <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${s.isDue ? "text-red-500" : "text-muted-foreground"}`}>
                                    <Clock size={9} /> 출고 기한 {s.shipByDate}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-foreground">₩{s.amount.toLocaleString()}</p>
                                <Link
                                    to={`/seller/orders/${s.id}/ship`}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                                    style={{ background: ACCENT + "18", color: ACCENT }}
                                >
                                    <Truck size={10} /> 송장 등록
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Panel: 이의제기 (full-width) ──────────────────────────────────────────────

const DISPUTE_STATUS_LABEL: Record<DisputeItem["status"], string> = {
    PENDING_ANSWER: "답변 필요",
    IN_REVIEW:      "검토 중",
    RESOLVED:       "해결됨",
};

function DisputePanel() {
    if (COUNTS.disputes === 0) return null;
    return (
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50/40">
                <div className="flex items-center gap-2">
                    <Scale size={15} className="text-red-500" />
                    <span className="text-sm font-bold text-red-800">이의제기</span>
                    <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
            {COUNTS.disputes}
          </span>
                </div>
                <Link
                    to="/disputes"
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                    전체 보기 <ChevronRight size={12} />
                </Link>
            </div>
            <div className="divide-y divide-border">
                {DISPUTES.map((d) => (
                    <Link
                        key={d.id}
                        to={`/seller/disputes/${d.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/30 transition-colors group"
                    >
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-foreground truncate">{d.productName}</p>
                                {d.status === "PENDING_ANSWER" && <Badge variant="urgent">{DISPUTE_STATUS_LABEL[d.status]}</Badge>}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{d.buyerName} · {d.reason}</p>
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

// ── Panel: 정산 현황 (full-width, 정보성) ─────────────────────────────────────

function SettlementPanel() {
    const total = SETTLEMENTS.reduce((sum, s) => sum + s.netAmount, 0);

    return (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Banknote size={15} className="text-[#C4956A]" />
                    <span className="text-sm font-bold text-foreground">정산 현황</span>
                    <span className="text-[11px] text-muted-foreground font-normal ml-1">· 바이어 구매 확정 후 자동 처리됩니다</span>
                </div>
                <Link
                    to="/seller/settlements"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    전체 보기 <ChevronRight size={12} />
                </Link>
            </div>

            {/* 예정 정산액 요약 — 정보성 */}
            <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">예정 정산액 합계</span>
                <span className="text-sm font-black text-foreground">₩{total.toLocaleString()}</span>
            </div>

            {SETTLEMENTS.length === 0 ? (
                <EmptyRow message="정산 예정 건이 없습니다." />
            ) : (
                <div className="divide-y divide-border">
                    {SETTLEMENTS.slice(0, 5).map((s) => (
                        <Link
                            key={s.id}
                            to={`/seller/settlements/${s.id}`}
                            className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/[0.04] transition-colors group"
                        >
                            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate mb-0.5">{s.productName}</p>
                                <p className="text-[11px] text-muted-foreground">{s.buyerName} · {s.qty} · 확정 {s.confirmedAt}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-foreground">₩{s.netAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    수수료 ₩{s.platformFee.toLocaleString()} 차감
                                </p>
                            </div>
                            <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-foreground shrink-0 transition-colors" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

type UserRole = "buyer" | "seller";
type BusinessRole = "BUYER" | "SELLER" | "BOTH";

export function SellerDashboard() {
    const navigate = useNavigate();
    const businessRole: BusinessRole = "BOTH"; // DB에서 가져올 값
    const [role] = useState<UserRole>("seller");
    const now = new Date().toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric", weekday: "short",
    });

    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
            {/* ── 헤더 ── */}
            <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">

                    {/* 좌: 브랜드 + 타이틀 */}
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            <Layers size={12} />
                            공급현황
                        </div>
                        <h1 className="text-xl font-black text-slate-950">
                            르솔레이유
                        </h1>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                            공급 현황을 한눈에 소싱 요청 응대, 견적 작성, 출고 관리, 정산 현황을 통합 관리할 수 있습니다.
                        </p>
                    </div>

                    {/* 우: 2행 레이아웃 */}
                    <div className="flex shrink-0 flex-col items-end gap-2.5">

                        {/* 윗줄: 구매관리 전환 · 알림 · 설정 */}
                        <div className="flex items-center gap-2">
                            {businessRole === "BOTH" && (
                                <button
                                    onClick={() => navigate(role === "seller" ? "/buyer" : "/seller")}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    {role === "seller" ? <ShoppingBag size={13} /> : <Layers size={13} />}
                                    {role === "seller" ? "구매관리로 전환" : "공급관리로 전환"}
                                </button>
                            )}
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
                                to="/settings"
                                className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                                aria-label="설정"
                            >
                                <Settings size={16} />
                            </Link>
                        </div>

                        {/* 아랫줄: 처리할 업무 · 제품 등록 */}
                        <div className="flex items-center gap-2">
                            <Link
                                to="/seller/products/new"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90"
                            >
                                <Plus size={13} /> 제품 등록
                            </Link>
                        </div>

                    </div>
                </div>
            </header>

            {/* ── 긴급 알림 배너 ── */}
            <AlertBanner />

            {/* ── KPI 카드 (5칸: 정산 제거, 이의제기 추가) ── */}
            <StatCards />

            {/* ── 출고 기한 초과 (긴급, full-width, 있을 때만) ── */}
            <OverdueShipmentBanner />

            {/* ── 신규요청 + 견적작성 + 협의진행 ── */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <RequestPanel />
                <QuoteDraftPanel />
                <NegotiationPanel />
            </div>


            {/* ── 출고대기 + 이의제기 + 정산 현황 ── */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <ShipmentPanel />
                <DisputePanel />
                <SettlementPanel />
            </div>
        </div>
    );
}