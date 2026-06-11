import React, { useState } from "react";
import {Link, useNavigate} from "react-router";
import {
  Search, FileText, ShoppingBag, Clock, Truck, AlertCircle, Heart,
  ChevronRight, BarChart2, Bell, Settings, Eye,
  Star, MapPin, MessageSquare,
  RefreshCcw, ThumbsUp, MessageSquareWarning
} from "lucide-react";

// ────────────────────────────────────────────────
// 더미 데이터
// ────────────────────────────────────────────────

const purchaseStats = [
  { month: "2024-03", total: 4820000, count: 38, avgOrder: 126842 },
  { month: "2024-02", total: 3960000, count: 31, avgOrder: 127741 },
  { month: "2024-01", total: 5240000, count: 42, avgOrder: 124761 },
  { month: "2023-12", total: 3130000, count: 26, avgOrder: 120384 },
];

const myOrders = [
  { id: "FBZ-2024-0841", date: "2024.03.21", seller: "르솔레이유",    product: "플리츠 미디 스커트",        qty: "M×3 L×4",  amount: 252000, status: "배송중",  tracking: "CJ123456789KR" },
  { id: "FBZ-2024-0838", date: "2024.03.20", seller: "모아패션",      product: "오버핏 린넨 블라우스",      qty: "S×2 M×5",  amount: 297000, status: "발주확정", tracking: null },
  { id: "FBZ-2024-0820", date: "2024.03.18", seller: "르솔레이유",    product: "와이드 하이웨이스트 슬랙스", qty: "M×6 L×2",  amount: 384000, status: "배송완료", tracking: "CJ987654321KR" },
  { id: "FBZ-2024-0807", date: "2024.03.15", seller: "트렌드메이커",  product: "프릴넥 플로럴 원피스",      qty: "FREE×10",  amount: 590000, status: "발주확정", tracking: null },
  { id: "FBZ-2024-0791", date: "2024.03.12", seller: "모아패션",      product: "크롭 후드 집업",            qty: "S×1 M×2",  amount: 135000, status: "취소",    tracking: null },
];

const sentInquiries = [
  {
    id: "INQ-2024-0124",
    date: "2024.03.21",
    seller: "르솔레이유",
    style: "오피스룩 재킷",
    qty: "200장",
    budget: "₩5,000,000~₩7,000,000",
    status: "답변대기",
    hasReply: false,
  },
  {
    id: "INQ-2024-0118",
    date: "2024.03.18",
    seller: "트렌드메이커",
    style: "니트 가디건 3컬러",
    qty: "150장",
    budget: "₩3,000,000~₩4,000,000",
    status: "견적수신",
    hasReply: true,
    quote: { unitPrice: "₩22,000", total: "₩3,300,000", receivedAt: "2024.03.19", statusLabel: "검토중" },
  },
  {
    id: "INQ-2024-0112",
    date: "2024.03.15",
    seller: "모아패션",
    style: "와이드 팬츠 봄 신상 2종",
    qty: "300장",
    budget: "₩9,000,000~",
    status: "계약완료",
    hasReply: true,
  },
];

const favoriteSellers = [
  { name: "르솔레이유",    region: "동대문",  category: "여성복",   rating: 4.9, orders: 28, badge: "인증 브랜드" },
  { name: "모아패션",      region: "동대문",  category: "여성복",   rating: 4.7, orders: 22, badge: null },
  { name: "트렌드메이커",  region: "남대문",  category: "캐주얼",   rating: 4.5, orders: 14, badge: "신규 셀러" },
  { name: "케이스타일",    region: "동대문",  category: "액세서리", rating: 4.8, orders: 9,  badge: null },
];

// ────────────────────────────────────────────────
// 뱃지 헬퍼
// ────────────────────────────────────────────────

function OrderBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    발주확정:  "bg-blue-50 text-blue-700 border-blue-200",
    배송중:    "bg-amber-50 text-amber-700 border-amber-200",
    배송완료:  "bg-green-50 text-green-700 border-green-200",
    취소:      "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function InquiryBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    답변대기:  "bg-rose-50 text-rose-700 border-rose-200",
    견적수신:  "bg-blue-50 text-blue-700 border-blue-200",
    계약완료:  "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function SellerBadge({ badge }: { badge: string | null }) {
  if (!badge) return null;
  const map: Record<string, string> = {
    "인증 브랜드": "bg-[#C4956A]/10 text-[#C4956A] border-[#C4956A]/30",
    "신규 셀러":   "bg-blue-50 text-blue-600 border-blue-200",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${map[badge] ?? "bg-muted text-muted-foreground border-border"}`}>
      {badge}
    </span>
  );
}

// ────────────────────────────────────────────────
// 탭 타입
// ────────────────────────────────────────────────

type Tab = "overview" | "orders" | "inquiries" | "sellers" | "negotiations";

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

export function BuyerDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [role] = useState<UserRole>("buyer");
  const [, setActiveTab] = useState<Tab>("orders");
  const navigate = useNavigate();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",  label: "개요",       icon: <BarChart2 size={15} /> },
    { key: "orders",    label: "소싱 요청 내역",  icon: <FileText size={15} /> },
    { key: "inquiries", label: "발주 내역",  icon: <Truck size={15} /> },
    { key: "sellers",   label: "협의 내역", icon: <Heart size={15} /> },
    { key: "negotiations",   label: "이의제기", icon: <MessageSquareWarning size={15} /> },
  ];
  type UserRole = "buyer" | "seller";

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

      {/* ── 헤더 ── */}
      <div className="bg-gradient-to-r from-[#1a2744] to-[#243460] text-white rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShoppingBag size={24} className="text-[#7eb3f5]" />
              <h1 className="text-2xl font-bold">바이어 대시보드</h1>
              <span className="text-xs bg-[#7eb3f5]/20 text-[#7eb3f5] border border-[#7eb3f5]/40 px-2 py-0.5 rounded font-medium">인증 바이어</span>
            </div>
            <p className="text-blue-200/60 text-sm">스타일위크㈜ — 국내 여성복 B2B 구매 현황</p>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={() => { setActiveTab("orders"); navigate("/buyer") }}
                className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "buyer" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ShoppingBag size={15} /> 바이어
            </button>
            <button
                onClick={() => { setActiveTab("orders"); navigate("/seller");}}
                className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "seller" ? "bg-[#2d4a35] text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Star size={15} /> 셀러
            </button>
            <Link
              to="../sourcing-request" // TODO 경로 재설정
              className="flex items-center gap-1.5 bg-[#7eb3f5] hover:bg-[#6aa2e8] text-[#1a2744] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <MessageSquare size={15} /> 소싱 요청
            </Link>
            <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <Link
                to="/employee-management"
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 퀵 네비 ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { to: "/buyer",           icon: <BarChart2 size={20}      className="text-blue-600"   />, bg: "bg-blue-50 group-hover:bg-blue-100",   label: "구매 현황",   sub: "매출·발주 통계"   },
          { to: "/buyer/my-sourcing",        icon: <FileText size={20}         className="text-[#7eb3f5]"  />, bg: "bg-sky-50 group-hover:bg-sky-100",     label: "소싱 접수 내역",   sub: "소싱 접수·확인" },
          { to: "/orders",          icon: <Truck size={20}          className="text-amber-600"  />, bg: "bg-amber-50 group-hover:bg-amber-100", label: "발주 내역",   sub: "주문·배송 현황"   },
          { to: "../negotiations",icon: <Heart size={20}      className="text-green-600"  />, bg: "bg-green-50 group-hover:bg-green-100", label: "협의 내역",   sub: "협의 요청·확인"   },
          { to: "../disputes",icon: <MessageSquareWarning size={20}      className="text-navy-600"  />, bg: "bg-green-50 group-hover:bg-green-100", label: "이의제기",   sub: "이의 요청·확인"   }
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-[#7eb3f5] hover:shadow-md transition-all group"
          >
            <div className={`${item.bg} p-3 rounded-lg transition-colors`}>{item.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-foreground text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
            <ChevronRight size={15} className="text-muted-foreground group-hover:text-[#7eb3f5] transition-colors" />
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
                ? "border-[#7eb3f5] text-[#3a7fd5]"
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

          {/* 월별 구매 통계 */}
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#3a7fd5]" />
                  월별 구매 통계
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
                {purchaseStats.map((stat) => (
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
                          width: `${(stat.total / 6000000) * 100}%`,
                          background: "linear-gradient(90deg, #3a7fd5, #7eb3f5)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{stat.count}건</span>
                      <span>평균 ₩{(stat.avgOrder / 1000).toFixed(0)}천</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 알림 + 진행 중 문의 */}
          <div className="space-y-4">
            {/* 처리 필요 알림 */}
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <Bell size={18} className="text-rose-500" />
                  처리 필요
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { icon: <AlertCircle size={16} className="text-rose-500" />, bg: "bg-rose-50", text: "수신된 견적 검토 1건", sub: "INQ-2024-0118 · 트렌드메이커" },
                  { icon: <Clock size={16} className="text-amber-500" />,      bg: "bg-amber-50", text: "배송 도착 예정 1건",  sub: "FBZ-2024-0841 · 오늘 오후 예정" },
                  { icon: <RefreshCcw size={16} className="text-blue-500" />,  bg: "bg-blue-50",  text: "발주 확인 요청 1건", sub: "FBZ-2024-0838 확정 대기 중" },
                ].map((item) => (
                  <div key={item.text} className={`${item.bg} rounded-lg px-4 py-3 flex items-start gap-3`}>
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.text}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                    </div>
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
              <ShoppingBag size={18} className="text-[#3a7fd5]" />
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
                  <th className="px-3 py-3 text-left font-medium">셀러</th>
                  <th className="px-3 py-3 text-left font-medium">상품명</th>
                  <th className="px-3 py-3 text-left font-medium">수량</th>
                  <th className="px-3 py-3 text-right font-medium">결제금액</th>
                  <th className="px-3 py-3 text-center font-medium">상태</th>
                  <th className="px-3 py-3 text-center font-medium">배송 추적</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{o.id}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs font-mono">{o.date}</td>
                    <td className="px-3 py-3 text-foreground font-medium">{o.seller}</td>
                    <td className="px-3 py-3 text-foreground">{o.product}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{o.qty}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                      ₩{o.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OrderBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {o.tracking ? (
                        <a
                          href="#"
                          className="text-xs text-[#3a7fd5] font-semibold hover:underline flex items-center justify-center gap-1"
                        >
                          <Truck size={12} /> 추적하기
                        </a>
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

      {/* ══════════ 탭: 발주 문의 ══════════ */}
      {tab === "inquiries" && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-[#3a7fd5]" />
              보낸 발주 문의
            </h2>
            <Link
              to="/buyer/inquiry/new"
              className="flex items-center gap-1.5 bg-[#3a7fd5] hover:bg-[#2d6ec4] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageSquare size={13} /> 새 문의 보내기
            </Link>
          </div>
          <div className="divide-y divide-border">
            {sentInquiries.map((inq) => (
              <div key={inq.id} className="px-5 py-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{inq.id}</span>
                    <InquiryBadge status={inq.status} />
                    {!inq.hasReply && (
                      <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-semibold animate-pulse">
                        대기중
                      </span>
                    )}
                    {inq.hasReply && inq.status === "견적수신" && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{inq.date}</span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">셀러</div>
                    <div className="font-medium text-foreground">{inq.seller}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">요청 스타일</div>
                    <div className="font-medium text-foreground">{inq.style}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">수량</div>
                    <div className="font-medium text-foreground">{inq.qty}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">예산</div>
                    <div className="font-medium text-foreground">{inq.budget}</div>
                  </div>
                </div>

                {inq.quote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs flex items-center gap-6 mb-3">
                    <span className="text-blue-700 font-semibold">받은 견적</span>
                    <span className="text-foreground">단가 <b>{inq.quote.unitPrice}</b></span>
                    <span className="text-foreground">합계 <b>{inq.quote.total}</b></span>
                    <span className="text-muted-foreground">수신일 {inq.quote.receivedAt}</span>
                    <span className="ml-auto text-blue-600 font-semibold">{inq.quote.statusLabel}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {inq.quote && inq.status === "견적수신" && (
                    <>
                      <button className="flex items-center gap-1.5 bg-[#3a7fd5] hover:bg-[#2d6ec4] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <ThumbsUp size={13} /> 견적 수락
                      </button>
                      <button className="flex items-center gap-1.5 border border-border hover:border-rose-400 text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        거절
                      </button>
                    </>
                  )}
                  <button className="flex items-center gap-1.5 border border-border hover:border-[#7eb3f5] text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    <Eye size={13} /> 상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ 탭: 즐겨찾기 셀러 ══════════ */}
      {tab === "sellers" && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Heart size={18} className="text-rose-400" />
              즐겨찾기 셀러
            </h2>
            <Link
              to="/sellers"
              className="flex items-center gap-1.5 border border-border hover:border-[#7eb3f5] text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Search size={13} /> 셀러 탐색
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">셀러명</th>
                  <th className="px-3 py-3 text-left font-medium">지역</th>
                  <th className="px-3 py-3 text-left font-medium">카테고리</th>
                  <th className="px-3 py-3 text-center font-medium">평점</th>
                  <th className="px-3 py-3 text-center font-medium">거래 건수</th>
                  <th className="px-3 py-3 text-center font-medium">인증</th>
                  <th className="px-3 py-3 text-center font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {favoriteSellers.map((s) => (
                  <tr key={s.name} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1"><MapPin size={11} />{s.region}</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">{s.category}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-500 font-semibold text-xs">
                        <Star size={12} fill="currentColor" />{s.rating}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-sm font-bold text-foreground">{s.orders}건</td>
                    <td className="px-3 py-3 text-center">
                      {s.badge ? <SellerBadge badge={s.badge} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-xs text-[#3a7fd5] font-semibold hover:underline">문의하기</button>
                        <span className="text-muted-foreground">|</span>
                        <button className="text-xs text-rose-400 font-semibold hover:underline">즐겨찾기 해제</button>
                      </div>
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
