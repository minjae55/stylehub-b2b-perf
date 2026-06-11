import React, {useState} from "react";
import {Link, useNavigate} from "react-router";
import {
    Package, FileText, ShoppingBag,
    Clock, Truck, AlertCircle, Plus, ChevronRight,
    BarChart2, Star, Bell, Settings, Eye, RotateCcw, Layers, MessageSquareWarning, Handshake
} from "lucide-react";

// ────────────────────────────────────────────────
// 더미 데이터
// ────────────────────────────────────────────────

const salesStats = [
    {month: "2024-03", total: 8420000, count: 142, avgOrder: 59296},
    {month: "2024-02", total: 7180000, count: 128, avgOrder: 56093},
    {month: "2024-01", total: 9240000, count: 161, avgOrder: 57391},
    {month: "2023-12", total: 6930000, count: 118, avgOrder: 58728},
];

const recentOrders = [
    {
        id: "FBZ-2024-0841",
        date: "2024.03.21",
        buyer: "스타일위크㈜",
        product: "플리츠 미디 스커트",
        qty: "M×3 L×4",
        amount: 252000,
        status: "배송중"
    },
    {
        id: "FBZ-2024-0838",
        date: "2024.03.20",
        buyer: "패션플러스",
        product: "오버핏 린넨 블라우스",
        qty: "S×2 M×5",
        amount: 297000,
        status: "발주확정"
    },
    {
        id: "FBZ-2024-0820",
        date: "2024.03.18",
        buyer: "트렌디샵",
        product: "와이드 하이웨이스트 슬랙스",
        qty: "M×6 L×2",
        amount: 384000,
        status: "배송완료"
    },
    {
        id: "FBZ-2024-0807",
        date: "2024.03.15",
        buyer: "언니네옷장",
        product: "프릴넥 플로럴 원피스",
        qty: "FREE×10",
        amount: 590000,
        status: "발주확정"
    },
    {
        id: "FBZ-2024-0791",
        date: "2024.03.12",
        buyer: "데일리룩스토어",
        product: "크롭 후드 집업",
        qty: "S×1 M×2",
        amount: 135000,
        status: "취소"
    },
];

const myProducts = [
    {
        id: 1,
        name: "플리츠 미디 스커트",
        category: "하의",
        price: 28000,
        moq: 3,
        stock: "재고 충분",
        status: "판매중",
        orders: 86,
        views: 1240
    },
    {
        id: 2,
        name: "오버핏 린넨 블라우스",
        category: "상의",
        price: 33000,
        moq: 5,
        stock: "재고 충분",
        status: "판매중",
        orders: 64,
        views: 980
    },
    {
        id: 3,
        name: "와이드 하이웨이스트 슬랙스",
        category: "하의",
        price: 48000,
        moq: 3,
        stock: "소진 임박",
        status: "판매중",
        orders: 42,
        views: 760
    },
    {
        id: 4,
        name: "프릴넥 플로럴 원피스",
        category: "원피스",
        price: 59000,
        moq: 5,
        stock: "재고 충분",
        status: "판매중",
        orders: 38,
        views: 1540
    },
    {
        id: 5,
        name: "크롭 후드 집업",
        category: "상의",
        price: 45000,
        moq: 3,
        stock: "품절",
        status: "판매중단",
        orders: 21,
        views: 430
    },
];


const topBuyers = [
    {name: "스타일위크㈜", type: "편집샵", orders: 28, total: 2840000},
    {name: "패션플러스", type: "온라인쇼핑몰", orders: 22, total: 1980000},
    {name: "트렌디샵", type: "온라인쇼핑몰", orders: 18, total: 1560000},
    {name: "언니네옷장", type: "편집샵", orders: 14, total: 980000},
];

// ────────────────────────────────────────────────
// 상태 뱃지 헬퍼
// ────────────────────────────────────────────────

function OrderBadge({status}: { status: string }) {
    const map: Record<string, string> = {
        발주확정: "bg-blue-50 text-blue-700 border-blue-200",
        배송중: "bg-amber-50 text-amber-700 border-amber-200",
        배송완료: "bg-green-50 text-green-700 border-green-200",
        취소: "bg-red-50 text-red-700 border-red-200",
    };
    return (
        <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
    );
}

function StockBadge({stock}: { stock: string }) {
    const map: Record<string, string> = {
        "재고 충분": "text-green-600",
        "소진 임박": "text-amber-600",
        "품절": "text-red-500",
    };
    return <span className={`text-xs font-medium ${map[stock] ?? "text-muted-foreground"}`}>{stock}</span>;
}

// ────────────────────────────────────────────────
// 탭 타입
// ────────────────────────────────────────────────

type Tab = "overview" | "orders" | "products" | "negotiations" | "disputes" | "sourcing";
type UserRole = "buyer" | "seller";

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

export function SellerDashboard() {
    const [tab, setTab] = useState<Tab>("overview");
    const [selectedPeriod, setSelectedPeriod] = useState("3months");
    const [role] = useState<UserRole>("seller");
    const [, setActiveTab] = useState<Tab>("orders");
    const navigate = useNavigate();

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        {key: "overview", label: "개요", icon: <BarChart2 size={15}/>},
        {key: "products", label: "등록 상품", icon: <Package size={15}/>},
        {key: "sourcing", label: "소싱 요청 내역", icon: <FileText size={15}/>},
        {key: "orders", label: "발주 내역", icon: <Truck size={15}/>},
        {key: "negotiations", label: "협의 내역", icon: <Handshake size={15}/>},
        {key: "disputes", label: "이의제기", icon: <MessageSquareWarning size={15}/>},
    ];

    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

            {/* ── 헤더 ── */}
            <div className="bg-gradient-to-r from-[#1C1C1C] to-[#2a2a2a] text-white rounded-lg p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Layers size={24} className="text-[#C4956A]"/>
                            <h1 className="text-2xl font-bold">셀러 대시보드</h1>
                            <span
                                className="text-xs bg-[#C4956A]/20 text-[#C4956A] border border-[#C4956A]/40 px-2 py-0.5 rounded font-medium">인증 브랜드</span>
                        </div>
                        <p className="text-gray-400 text-sm">르솔레이유 — 국내 여성복 B2B 판매 현황</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setActiveTab("orders");
                                navigate("/buyer")
                            }}
                            className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "buyer" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <ShoppingBag size={15}/> 바이어
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("orders");
                                navigate("/seller");
                            }}
                            className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "seller" ? "bg-[#2d4a35] text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Star size={15}/> 셀러
                        </button>
                        <Link
                            to="/seller/products/new"
                            className="flex items-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={15}/> 제품 등록
                        </Link>
                        <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                            <Bell size={18}/>
                        </button>
                        <Link to="/employee-management"
                              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                            <Settings size={18}/>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── 퀵 네비 ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    {
                        to: "/seller",
                        icon: <BarChart2 size={20} className="text-blue-600"/>,
                        bg: "bg-blue-50 group-hover:bg-blue-100",
                        label: "판매 현황",
                        sub: "매출·주문 통계"
                    },
                    {
                        to: "/seller/sourcing-requests",
                        icon: <FileText size={20} className="text-[#C4956A]"/>,
                        bg: "bg-rose-50 group-hover:bg-rose-100",
                        label: "소싱 요청 내역",
                        sub: "소싱 요청·확인"
                    },
                    {
                        to: "/orders",
                        icon: <Truck size={20} className="text-amber-600"/>,
                        bg: "bg-amber-50 group-hover:bg-amber-100",
                        label: "발주 내역",
                        sub: "주문 처리 현황"
                    },
                    {
                        to: "/seller/products",
                        icon: <Package size={20} className="text-purple-600"/>,
                        bg: "bg-green-50 group-hover:bg-green-100",
                        label: "등록 상품",
                        sub: "상품 확인·등록"
                    },
                    {
                        to: "../negotiations",
                        icon: <Handshake size={20} className="text-green-600"/>,
                        bg: "bg-green-50 group-hover:bg-green-100",
                        label: "협의 내역",
                        sub: "협의 요청·확인"
                    },
                    {
                        to: "../disputes",
                        icon: <MessageSquareWarning size={20} className="text-navy-600"/>,
                        bg: "bg-green-50 group-hover:bg-green-100",
                        label: "이의제기",
                        sub: "이의 요청·확인"
                    }
                ].map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-[#C4956A] hover:shadow-md transition-all group"
                    >
                        <div className={`${item.bg} p-3 rounded-lg transition-colors`}>{item.icon}</div>
                        <div className="flex-1">
                            <div className="font-semibold text-foreground text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.sub}</div>
                        </div>
                        <ChevronRight size={15}
                                      className="text-muted-foreground group-hover:text-[#C4956A] transition-colors"/>
                    </Link>
                ))}
            </div>

            {/* ── 탭 네비 ── */}
            <div className="flex gap-1 border-b border-border mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            tab === t.key
                                ? "border-[#C4956A] text-[#C4956A]"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ══════════ 탭: 개요 ══════════ */}
            {tab === "overview" && (
                <div className="grid grid-cols-[1fr_380px] gap-6">

                    {/* 월별 매출 통계 */}
                    <div className="bg-white border border-border rounded-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                <BarChart2 size={18} className="text-[#C4956A]"/>
                                월별 매출 통계
                            </h2>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="text-xs border border-border rounded px-2 py-1 outline-none"
                            >
                                <option value="3months">최근 3개월</option>
                                <option value="6months">최근 6개월</option>
                            </select>
                        </div>
                        <div className="p-5 space-y-4">
                            {salesStats.map((stat) => (
                                <div key={stat.month}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-mono text-muted-foreground">{stat.month}</span>
                                        <span className="text-sm font-bold font-mono text-foreground">
                      ₩{(stat.total / 10000).toFixed(0)}만
                    </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${(stat.total / 10000000) * 100}%`,
                                                background: "linear-gradient(90deg, #C4956A, #e0b48a)",
                                            }}
                                        />
                                    </div>
                                    <div
                                        className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                                        <span>{stat.count}건</span>
                                        <span>평균 ₩{(stat.avgOrder / 1000).toFixed(0)}천</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TOP 바이어 */}
                        <div className="px-5 pb-5">
                            <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide border-t border-border pt-4">
                                TOP 바이어
                            </h3>
                            <div className="space-y-2">
                                {topBuyers.map((buyer, i) => (
                                    <div key={buyer.name} className="flex items-center gap-3 text-sm">
                                        <div
                                            className="w-6 h-6 rounded bg-rose-50 text-[#C4956A] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground truncate">{buyer.name}</div>
                                            <div className="text-xs text-muted-foreground">{buyer.type}</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="font-mono text-xs text-muted-foreground">{buyer.orders}건
                                            </div>
                                            <div className="font-mono text-xs font-bold text-foreground">
                                                ₩{(buyer.total / 10000).toFixed(0)}만
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 알림 + 재고 현황 */}
                    <div className="space-y-4">
                        {/* 처리 필요 알림 */}
                        <div className="bg-white border border-border rounded-lg overflow-hidden">
                            <div className="px-5 py-4 border-b border-border">
                                <h2 className="font-bold text-foreground flex items-center gap-2">
                                    <Bell size={18} className="text-rose-500"/>
                                    처리 필요
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {[
                                    {
                                        icon: <AlertCircle size={16} className="text-rose-500"/>,
                                        bg: "bg-rose-50",
                                        text: "미답변 발주 문의 1건",
                                        sub: "INQ-2024-0124 · 스타일위크㈜"
                                    },
                                    {
                                        icon: <Clock size={16} className="text-amber-500"/>,
                                        bg: "bg-amber-50",
                                        text: "출고 대기 주문 3건",
                                        sub: "오늘 오후 2시 마감"
                                    },
                                    {
                                        icon: <RotateCcw size={16} className="text-blue-500"/>,
                                        bg: "bg-blue-50",
                                        text: "반품 접수 1건",
                                        sub: "FBZ-2024-0791 처리 필요"
                                    },
                                ].map((item) => (
                                    <div key={item.text}
                                         className={`${item.bg} rounded-lg px-4 py-3 flex items-start gap-3`}>
                                        <div className="mt-0.5">{item.icon}</div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{item.text}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 재고 현황 */}
                        <div className="bg-white border border-border rounded-lg overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <h2 className="font-bold text-foreground flex items-center gap-2">
                                    <Package size={18} className="text-amber-500"/>
                                    재고 현황
                                </h2>
                                <button
                                    onClick={() => setTab("products")}
                                    className="text-xs text-[#C4956A] hover:underline"
                                >
                                    전체보기
                                </button>
                            </div>
                            <div className="divide-y divide-border">
                                {myProducts.map((p) => (
                                    <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">{p.category} · 도매가
                                                ₩{p.price.toLocaleString()}</div>
                                        </div>
                                        <StockBadge stock={p.stock}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ 탭: 발주 내역 ══════════ */}
            {tab === "orders" && (
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <ShoppingBag size={18} className="text-[#C4956A]"/>
                            발주 내역
                        </h2>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="text-xs border border-border rounded px-2 py-1 outline-none"
                        >
                            <option value="3months">최근 3개월</option>
                            <option value="6months">최근 6개월</option>
                            <option value="1year">최근 1년</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                                <th className="px-5 py-3 text-left font-medium">주문번호</th>
                                <th className="px-3 py-3 text-left font-medium">발주일</th>
                                <th className="px-3 py-3 text-left font-medium">바이어</th>
                                <th className="px-3 py-3 text-left font-medium">상품명</th>
                                <th className="px-3 py-3 text-left font-medium">수량</th>
                                <th className="px-3 py-3 text-right font-medium">결제금액</th>
                                <th className="px-3 py-3 text-center font-medium">상태</th>
                                <th className="px-3 py-3 text-center font-medium">출고</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.map((o) => (
                                <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-3 font-mono text-xs text-foreground">{o.id}</td>
                                    <td className="px-3 py-3 text-muted-foreground text-xs font-mono">{o.date}</td>
                                    <td className="px-3 py-3 text-foreground font-medium">{o.buyer}</td>
                                    <td className="px-3 py-3 text-foreground">{o.product}</td>
                                    <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{o.qty}</td>
                                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                                        ₩{o.amount.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <OrderBadge status={o.status}/>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        {o.status === "발주확정" ? (
                                            <Link
                                                to="/seller/shipping-quote"
                                                className="text-xs text-[#C4956A] font-semibold hover:underline flex items-center justify-center gap-1"
                                            >
                                                <Truck size={12}/> 출고처리
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════ 탭: 상품 관리 ══════════ */}
            {tab === "products" && (
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <Package size={18} className="text-[#C4956A]"/>
                            상품 관리
                        </h2>
                        <Link
                            to="/seller/products/new"
                            className="flex items-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={13}/> 새 상품 등록
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                                <th className="px-5 py-3 text-left font-medium">상품명</th>
                                <th className="px-3 py-3 text-left font-medium">카테고리</th>
                                <th className="px-3 py-3 text-right font-medium">도매가</th>
                                <th className="px-3 py-3 text-center font-medium">최소수량</th>
                                <th className="px-3 py-3 text-center font-medium">재고</th>
                                <th className="px-3 py-3 text-center font-medium">누적 발주</th>
                                <th className="px-3 py-3 text-center font-medium">조회수</th>
                                <th className="px-3 py-3 text-center font-medium">상태</th>
                                <th className="px-3 py-3 text-center font-medium">관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {myProducts.map((p) => (
                                <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-3 py-3 text-muted-foreground text-xs">{p.category}</td>
                                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                                        ₩{p.price.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3 text-center text-xs text-muted-foreground">{p.moq}장</td>
                                    <td className="px-3 py-3 text-center"><StockBadge stock={p.stock}/></td>
                                    <td className="px-3 py-3 text-center font-mono text-sm font-bold text-foreground">{p.orders}</td>
                                    <td className="px-3 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Eye size={12}/>{p.views.toLocaleString()}
                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          p.status === "판매중"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {p.status}
                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <button className="text-xs text-[#C4956A] hover:underline font-semibold">수정
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
