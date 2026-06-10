import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Package, Truck, CheckCircle, Clock, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, FlaskConical, PenLine, ShieldCheck,
  RotateCcw, FileText, MessageCircle, CreditCard, MapPin,
  Calendar, Hash, Building2, User, X, ArrowUpRight,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
type OrderStatus =
  | "CONFIRMED" | "SAMPLE_PREPARING" | "SAMPLE_SHIPPED" | "SAMPLE_DELIVERED"
  | "CONTRACT_SIGNING" | "CONTRACT_CONFIRMED" | "PREPARING" | "SHIPPED"
  | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTE" | "REFUNDED";

type OrderType = "READY" | "CUSTOM";

type ShippingStep = { status: string; time: string; location?: string; done: boolean };

type Order = {
  id: string; date: string; supplier: string; type: OrderType;
  items: { name: string; quantity: number; unit: string; price: number; currency: string }[];
  status: OrderStatus; total: number; currency: string;
  trackingNo: string | null; shippingSteps?: ShippingStep[];
  cancelReason?: string; cancelledAt?: string;
  disputeReason?: string; sampleRequired?: boolean;
  contractSignedAt?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  memo?: string;
};

// ── 더미 데이터 (Orders.tsx와 동일) ───────────────────────────────────
const sampleOrders: Order[] = [
  {
    id: "ORD-2024-0841", date: "2024.05.18", supplier: "르블랑", type: "READY",
    items: [
      { name: "여성 린넨 오버핏 블라우스", quantity: 70, unit: "장", price: 12000, currency: "₩" },
      { name: "와이드 린넨 슬랙스",        quantity: 25, unit: "장", price: 18000, currency: "₩" },
    ],
    status: "SHIPPED", total: 1290000, currency: "₩", trackingNo: "598412873021",
    shippingAddress: "서울특별시 마포구 합정동 123-45 스타일위크 물류센터 (우: 04045)",
    paymentMethod: "에스크로 결제",
    memo: "린넨 소재 특성상 세탁 시 수축 주의 부탁드립니다.",
    shippingSteps: [
      { status: "주문 확정",  time: "2024.05.18 11:22", done: true },
      { status: "출고 준비",  time: "2024.05.19 09:15", done: true },
      { status: "배송 시작",  time: "2024.05.20 11:40", location: "CJ대한통운", done: true },
      { status: "배송 완료",  time: "—", done: false },
    ],
  },
  {
    id: "ORD-2024-0820", date: "2024.05.10", supplier: "모아뜨", type: "READY",
    items: [{ name: "플로럴 랩 원피스", quantity: 30, unit: "장", price: 25000, currency: "₩" }],
    status: "DELIVERED", total: 753000, currency: "₩", trackingNo: "471928374650",
    shippingAddress: "서울특별시 강남구 신사동 456-78 패션플러스 (우: 06025)",
    paymentMethod: "에스크로 결제",
    shippingSteps: [
      { status: "주문 확정", time: "2024.05.10 10:10", done: true },
      { status: "출고 완료", time: "2024.05.11 10:00", done: true },
      { status: "배송 시작", time: "2024.05.12 08:30", done: true },
      { status: "배송 완료", time: "2024.05.14 14:20", done: true },
    ],
  },
  {
    id: "ORD-2024-0901", date: "2024.05.20", supplier: "르블랑 어패럴", type: "CUSTOM",
    sampleRequired: true,
    items: [{ name: "여성 린넨 오버핏 블라우스 (주문제작)", quantity: 200, unit: "벌", price: 14000, currency: "₩" }],
    status: "SAMPLE_DELIVERED", total: 2800000, currency: "₩", trackingNo: "384729103847",
    shippingAddress: "서울특별시 마포구 합정동 123-45 스타일위크 물류센터 (우: 04045)",
    paymentMethod: "에스크로 결제 (계약 후 본결제)",
    shippingSteps: [
      { status: "주문 확정",      time: "2024.05.20 14:00", done: true },
      { status: "샘플 제작 시작", time: "2024.05.21 09:00", done: true },
      { status: "샘플 발송",      time: "2024.05.23 11:00", location: "한진택배", done: true },
      { status: "샘플 수령",      time: "2024.05.24 15:30", done: true },
      { status: "계약 서명",      time: "—", done: false },
      { status: "본생산 시작",    time: "—", done: false },
      { status: "배송",           time: "—", done: false },
    ],
  },
  {
    id: "ORD-2024-0888", date: "2024.05.15", supplier: "에이블스튜디오", type: "CUSTOM",
    sampleRequired: false,
    items: [{ name: "여성 와이드 팬츠 (주문제작)", quantity: 150, unit: "벌", price: 18000, currency: "₩" }],
    status: "CONTRACT_SIGNING", total: 2700000, currency: "₩", trackingNo: null,
    shippingAddress: "경기도 성남시 분당구 정자동 789 트렌디샵 (우: 13561)",
    paymentMethod: "에스크로 결제 (계약 후 본결제)",
    shippingSteps: [
      { status: "주문 확정",   time: "2024.05.15 10:00", done: true },
      { status: "계약 서명",   time: "진행 중",           done: false },
      { status: "본생산 시작", time: "—",                 done: false },
      { status: "배송",        time: "—",                 done: false },
    ],
  },
  {
    id: "ORD-2024-0807", date: "2024.05.02", supplier: "데일리앤코", type: "READY",
    items: [{ name: "여성 봄 니트 가디건", quantity: 40, unit: "장", price: 16200, currency: "₩" }],
    status: "COMPLETED", total: 648000, currency: "₩", trackingNo: "293847102938",
    shippingAddress: "부산광역시 해운대구 우동 321 언니네옷장 (우: 48060)",
    paymentMethod: "에스크로 결제",
  },
  {
    id: "ORD-2024-0791", date: "2024.04.20", supplier: "어반드레스", type: "READY",
    items: [{ name: "플리츠 미디 스커트", quantity: 45, unit: "장", price: 15000, currency: "₩" }],
    status: "CANCELLED", total: 675000, currency: "₩", trackingNo: null,
    cancelReason: "내부 예산 변경으로 인해 주문을 진행하지 않기로 결정했습니다.",
    cancelledAt: "2024.04.21 13:20",
    shippingAddress: "서울특별시 송파구 잠실동 555 데일리룩스토어 (우: 05510)",
    paymentMethod: "에스크로 결제",
  },
  {
    id: "ORD-2024-0780", date: "2024.04.15", supplier: "라온어패럴", type: "READY",
    items: [{ name: "여성 베이직 오버핏 셔츠", quantity: 50, unit: "장", price: 18900, currency: "₩" }],
    status: "DISPUTE", total: 945000, currency: "₩", trackingNo: "192837465019",
    disputeReason: "수령한 상품 중 M 사이즈 10장에서 봉제 불량이 발견되었습니다.",
    shippingAddress: "서울특별시 마포구 합정동 123-45 스타일위크 물류센터 (우: 04045)",
    paymentMethod: "에스크로 결제",
  },
];

// ── 상태 설정 ──────────────────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CONFIRMED:          { label: "주문 확정",    color: "text-blue-700",         bg: "bg-blue-50 border-blue-200",     icon: <CheckCircle size={14} /> },
  SAMPLE_PREPARING:   { label: "샘플 제작 중", color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",   icon: <FlaskConical size={14} /> },
  SAMPLE_SHIPPED:     { label: "샘플 배송 중", color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",   icon: <Truck size={14} /> },
  SAMPLE_DELIVERED:   { label: "샘플 수령",    color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",   icon: <Package size={14} /> },
  CONTRACT_SIGNING:   { label: "계약 서명 중", color: "text-purple-700",       bg: "bg-purple-50 border-purple-200", icon: <PenLine size={14} /> },
  CONTRACT_CONFIRMED: { label: "계약 확정",    color: "text-purple-700",       bg: "bg-purple-50 border-purple-200", icon: <ShieldCheck size={14} /> },
  PREPARING:          { label: "준비 중",      color: "text-[#C4956A]",        bg: "bg-rose-50 border-rose-200",     icon: <Package size={14} /> },
  SHIPPED:            { label: "배송 중",      color: "text-[#C4956A]",        bg: "bg-rose-50 border-rose-200",     icon: <Truck size={14} /> },
  DELIVERED:          { label: "배송 완료",    color: "text-green-700",        bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={14} /> },
  COMPLETED:          { label: "거래 완료",    color: "text-green-700",        bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={14} /> },
  CANCELLED:          { label: "취소됨",       color: "text-red-700",          bg: "bg-red-50 border-red-200",       icon: <XCircle size={14} /> },
  DISPUTE:            { label: "이의 제기",    color: "text-red-700",          bg: "bg-red-50 border-red-200",       icon: <AlertCircle size={14} /> },
  REFUNDED:           { label: "환불 완료",    color: "text-muted-foreground", bg: "bg-muted border-border",         icon: <RotateCcw size={14} /> },
};

const typeConfig: Record<OrderType, { label: string; color: string; bg: string }> = {
  READY:  { label: "일반 구매", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"   },
  CUSTOM: { label: "주문제작",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

// ── 사이드바 네비 아이템 ──────────────────────────────────────────────
type SideTab = "summary" | "shipping" | "payment" | "contact";

const sideTabs: { key: SideTab; label: string; icon: React.ReactNode }[] = [
  { key: "summary",  label: "주문 요약",  icon: <FileText size={16} />    },
  { key: "shipping", label: "배송 현황",  icon: <Truck size={16} />       },
  { key: "payment",  label: "결제 정보",  icon: <CreditCard size={16} />  },
  { key: "contact",  label: "공급사 문의", icon: <MessageCircle size={16} /> },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export function BuyerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = sampleOrders.find((o) => o.id === id) ?? sampleOrders[0];

  const [activeTab, setActiveTab]       = useState<SideTab>("summary");
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showDispute, setShowDispute]   = useState(false);

  const status = statusConfig[order.status];
  const type   = typeConfig[order.type];

  // 현재 주문의 인접 주문 (이전/다음 이동)
  const currentIdx = sampleOrders.findIndex((o) => o.id === order.id);
  const prevOrder  = sampleOrders[currentIdx - 1];
  const nextOrder  = sampleOrders[currentIdx + 1];

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/orders" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} /> 주문 목록
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono font-semibold text-foreground">{order.id}</span>
        </div>

        {/* 이전/다음 주문 이동 */}
        <div className="flex items-center gap-2">
          {prevOrder ? (
            <Link
              to={`/buyer/orders/${prevOrder.id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 rounded transition-colors"
            >
              <ChevronLeft size={13} /> 이전 주문
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/40 border border-border/40 px-3 py-1.5 rounded cursor-not-allowed">
              <ChevronLeft size={13} /> 이전 주문
            </span>
          )}
          {nextOrder ? (
            <Link
              to={`/buyer/orders/${nextOrder.id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 rounded transition-colors"
            >
              다음 주문 <ChevronRight size={13} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/40 border border-border/40 px-3 py-1.5 rounded cursor-not-allowed">
              다음 주문 <ChevronRight size={13} />
            </span>
          )}
        </div>
      </div>

      {/* 본문 레이아웃: 왼쪽 사이드바 + 오른쪽 콘텐츠 */}
      <div className="flex gap-6">

        {/* ── 왼쪽 사이드바 ── */}
        <aside className="w-[220px] flex-shrink-0">
          {/* 주문 상태 카드 */}
          <div className="bg-white border border-border rounded-lg p-4 mb-3">
            <div className="text-xs text-muted-foreground mb-1">주문번호</div>
            <div className="font-mono font-bold text-sm text-foreground mb-3">{order.id}</div>

            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color} mb-3`}>
              {status.icon} {status.label}
            </div>

            <div className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${type.bg} ${type.color} ml-1.5`}>
              {type.label}
            </div>

            <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} /> {order.date}
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 size={12} /> {order.supplier}
              </div>
              <div className="flex items-center gap-1.5">
                <Hash size={12} /> {order.items.reduce((a, i) => a + i.quantity, 0).toLocaleString()}장
              </div>
            </div>
          </div>

          {/* 사이드 탭 네비 */}
          <nav className="bg-white border border-border rounded-lg overflow-hidden mb-3">
            {sideTabs.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  idx !== 0 ? "border-t border-border" : ""
                } ${
                  activeTab === tab.key
                    ? "bg-[#FAF9F7] text-[#C4956A] border-l-2 border-l-[#C4956A]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span className={activeTab === tab.key ? "text-[#C4956A]" : "text-muted-foreground"}>
                  {tab.icon}
                </span>
                {tab.label}
                {activeTab === tab.key && (
                  <ChevronRight size={13} className="ml-auto text-[#C4956A]" />
                )}
              </button>
            ))}
          </nav>

          {/* 액션 버튼 모음 */}
          <div className="bg-white border border-border rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">액션</div>

            {order.status === "SAMPLE_DELIVERED" && (
              <>
                <Link
                  to={`/buyer/orders/${order.id}/contract-sign`}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
                >
                  <PenLine size={13} /> 본생산 확정
                </Link>
                <button
                  onClick={() => setShowDispute(true)}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded transition-colors"
                >
                  <XCircle size={13} /> 샘플 후 취소
                </button>
              </>
            )}

            {order.status === "CONTRACT_SIGNING" && (
              <Link
                to={`/buyer/orders/${order.id}/contract-sign`}
                className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
              >
                <PenLine size={13} /> 계약서 서명하기
              </Link>
            )}

            {order.status === "CONTRACT_CONFIRMED" && (
              <Link
                to={`/checkout?type=custom&orderId=${order.id}`}
                className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
              >
                <CreditCard size={13} /> 본결제 진행
              </Link>
            )}

            {order.status === "DELIVERED" && (
              <>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
                >
                  <CheckCircle size={13} /> 거래 확정
                </button>
                <button
                  onClick={() => setShowDispute(true)}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded transition-colors"
                >
                  <AlertCircle size={13} /> 이의 제기
                </button>
              </>
            )}

            {order.status === "DISPUTE" && (
              <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                관리자 검토 중
              </div>
            )}

            {order.status === "COMPLETED" && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
                <CheckCircle size={12} /> 거래 완료
              </div>
            )}

            {/* 항상 노출 */}
            <Link
              to={`/buyer/orders/${order.id}`}
              className="w-full flex items-center justify-center gap-1.5 border border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A] text-xs font-medium px-3 py-2 rounded transition-colors"
            >
              <MessageCircle size={13} /> 공급사 문의
            </Link>
          </div>
        </aside>

        {/* ── 오른쪽 콘텐츠 ── */}
        <div className="flex-1 min-w-0">

          {/* ═══ 탭: 주문 요약 ═══ */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              {/* 주문 상품 */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Package size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">주문 상품</h2>
                </div>
                <div className="divide-y divide-border">
                  {order.items.map((item, i) => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.quantity.toLocaleString()} {item.unit} × {item.currency}{item.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-foreground">
                        {item.currency}{(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-4 flex items-center justify-between bg-muted/30">
                    <span className="font-semibold text-sm text-foreground">합계</span>
                    <span className="font-mono font-bold text-lg text-foreground">
                      {order.currency}{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 배송지 */}
              <div className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">배송지</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {order.shippingAddress ?? "배송지 정보 없음"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  배송 방식: <span className="text-foreground font-medium">
                    {order.items.reduce((a, i) => a + i.quantity, 0) >= 100 ? "화물 배송 (협의)" :
                     order.items.reduce((a, i) => a + i.quantity, 0) >= 20  ? "중량 택배 (착불)" :
                     "일반 택배 (착불)"}
                  </span>
                </div>
              </div>

              {/* 주문 메모 */}
              {order.memo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-amber-800 mb-1">📝 주문 메모</div>
                  <div className="text-sm text-amber-700">{order.memo}</div>
                </div>
              )}

              {/* 취소 사유 */}
              {order.status === "CANCELLED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                    <XCircle size={12} /> 취소 정보
                  </div>
                  <div className="text-xs text-red-700 font-mono mb-1">{order.cancelledAt}</div>
                  <div className="text-sm text-red-700">{order.cancelReason}</div>
                </div>
              )}

              {/* 이의 제기 */}
              {order.status === "DISPUTE" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> 이의 제기 내용
                  </div>
                  <div className="text-sm text-red-700">{order.disputeReason}</div>
                  <div className="mt-2 text-xs text-red-600 font-medium">관리자 검토 중 — 1~2영업일 내 안내드립니다.</div>
                </div>
              )}

              {/* 계약 서명 완료 */}
              {order.contractSignedAt && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-600" />
                  <div>
                    <div className="text-xs font-semibold text-purple-800">계약 서명 완료</div>
                    <div className="text-xs text-purple-700">{order.contractSignedAt}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ 탭: 배송 현황 ═══ */}
          {activeTab === "shipping" && (
            <div className="space-y-4">
              {order.trackingNo && (
                <div className="bg-white border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-[#C4956A]" />
                      <h2 className="font-bold text-foreground text-sm">송장 번호</h2>
                    </div>
                    <a
                      href={`https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${order.trackingNo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-[#C4956A] hover:underline"
                    >
                      택배사 조회 <ArrowUpRight size={12} />
                    </a>
                  </div>
                  <div className="font-mono font-bold text-xl text-foreground mt-2">{order.trackingNo}</div>
                </div>
              )}

              {order.shippingSteps && order.shippingSteps.length > 0 ? (
                <div className="bg-white border border-border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText size={16} className="text-[#C4956A]" />
                    <h2 className="font-bold text-foreground text-sm">진행 현황</h2>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-4">
                      {order.shippingSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                            step.done
                              ? "bg-[#C4956A] border-[#C4956A]"
                              : "bg-white border-border"
                          }`}>
                            {step.done
                              ? <CheckCircle size={14} className="text-white" />
                              : <Clock size={14} className="text-muted-foreground" />}
                          </div>
                          <div className="pt-0.5 flex-1">
                            <div className={`text-sm font-semibold ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.status}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{step.time}</div>
                            {step.location && (
                              <div className="text-xs text-[#C4956A] mt-0.5">{step.location}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-lg p-10 text-center text-muted-foreground">
                  <Truck size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">아직 배송 정보가 없습니다</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ 탭: 결제 정보 ═══ */}
          {activeTab === "payment" && (
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <CreditCard size={16} className="text-[#C4956A]" />
                <h2 className="font-bold text-foreground text-sm">결제 정보</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: "결제 방식", value: order.paymentMethod ?? "에스크로 결제" },
                  { label: "결제 상태", value: order.status === "CANCELLED" ? "결제 취소" : order.status === "REFUNDED" ? "환불 완료" : "결제 완료" },
                  { label: "결제 금액", value: `${order.currency}${order.total.toLocaleString()}` },
                  { label: "배송비", value: "착불 (수령 시 바이어 부담)" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-foreground">{row.value}</span>
                  </div>
                ))}

                <div className="bg-[#FAF9F7] border border-[#C4956A]/20 rounded-lg p-4 mt-2">
                  <div className="text-xs font-semibold text-[#C4956A] mb-1">에스크로 안내</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    결제 대금은 플랫폼이 보관하며, 거래 확정 후 공급사에게 정산됩니다.
                    배송 완료 후 7일 이내에 거래 확정 또는 이의 제기를 해주세요.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 탭: 공급사 문의 ═══ */}
          {activeTab === "contact" && (
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MessageCircle size={16} className="text-[#C4956A]" />
                <h2 className="font-bold text-foreground text-sm">공급사 문의</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5 p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-[#C4956A]/20 flex items-center justify-center">
                    <User size={18} className="text-[#C4956A]" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{order.supplier}</div>
                    <div className="text-xs text-muted-foreground">인증 브랜드 · 평균 응답 2시간</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">문의 유형</label>
                    <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] bg-white">
                      <option>배송 관련 문의</option>
                      <option>상품 불량 문의</option>
                      <option>추가 발주 문의</option>
                      <option>기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">문의 내용</label>
                    <textarea
                      rows={4}
                      placeholder="문의 내용을 입력해 주세요."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none"
                    />
                  </div>
                  <button className="w-full bg-[#C4956A] hover:bg-[#b3845a] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    문의 보내기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 거래 확정 모달 ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={26} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">거래를 확정하시겠습니까?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              상품 수량 및 하자가 없는지 검수를 완료하셨나요?<br />
              확정 이후에는 이의 제기가 어려우며, 대금이 공급사에게 정산됩니다.
            </p>
            <div className="bg-muted/60 border border-border rounded p-3 text-xs text-muted-foreground mb-5">
              <div className="font-semibold text-foreground mb-1">{order.id}</div>
              <div>{order.supplier} · {order.currency}{order.total.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border text-foreground hover:border-[#C4956A] py-2.5 rounded text-sm font-medium transition-colors">
                취소
              </button>
              <button
                onClick={() => { setShowConfirm(false); alert("거래가 확정되었습니다. 공급사 정산이 진행됩니다."); }}
                className="flex-1 bg-[#C4956A] hover:bg-[#b3845a] text-white py-2.5 rounded text-sm font-semibold transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이의 제기 모달 ── */}
      {showDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowDispute(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={26} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">이의 제기 접수</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              수량 부족, 오염·하자, 오배송 등 문제가 있는 경우 접수할 수 있습니다.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">이의 유형</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] bg-white">
                  <option>수량 부족</option>
                  <option>오염 / 하자</option>
                  <option>오배송</option>
                  <option>파손</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">증빙 사진 첨부</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-[#C4956A]/40 cursor-pointer transition-colors">
                  클릭하여 사진 첨부 (최대 5장)
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">상세 내용</label>
                <textarea rows={3} placeholder="문제 상황을 자세히 작성해 주세요." className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDispute(false)} className="flex-1 border border-border text-foreground hover:border-[#C4956A] py-2.5 rounded text-sm font-medium transition-colors">
                취소
              </button>
              <button
                onClick={() => { setShowDispute(false); alert("이의 제기가 접수되었습니다. 관리자가 검토 후 안내드립니다."); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded text-sm font-semibold transition-colors"
              >
                접수하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
