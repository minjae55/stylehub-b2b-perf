import { useState } from "react";
import { Link } from "react-router";
import {
  Package, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  Search, AlertCircle, Eye, X, PenLine, FlaskConical,
  ShieldCheck, RotateCcw, RefreshCw, ExternalLink,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
type OrderStatus =
  | "CONFIRMED"
  | "SAMPLE_PREPARING"
  | "SAMPLE_SHIPPED"
  | "SAMPLE_DELIVERED"
  | "SAMPLE_RENEGOTIATING"   // ★ 추가: 샘플 재협상 중
  | "CONTRACT_SIGNING"
  | "CONTRACT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTE"
  | "REFUNDED";

type OrderType = "READY" | "CUSTOM";

// ── 스텝 키 ───────────────────────────────────────────────────────────
type StepKey =
  | "ORDER_CONFIRMED"
  | "SAMPLE_PREPARING"
  | "SAMPLE_SHIPPED"
  | "SAMPLE_DELIVERED"
  | "SAMPLE_RENEGOTIATING"
  | "CONTRACT_SIGNING"
  | "CONTRACT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED";

// ── 스텝 시퀀스 ───────────────────────────────────────────────────────
// READY + 샘플 있음
const STEPS_READY_WITH_SAMPLE: StepKey[] = [
  "ORDER_CONFIRMED",
  "SAMPLE_PREPARING",
  "SAMPLE_SHIPPED",
  "SAMPLE_DELIVERED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

// READY + 샘플 없음 (기본)
const STEPS_READY: StepKey[] = [
  "ORDER_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

// CUSTOM + 샘플 있음
const STEPS_CUSTOM_WITH_SAMPLE: StepKey[] = [
  "ORDER_CONFIRMED",
  "SAMPLE_PREPARING",
  "SAMPLE_SHIPPED",
  "SAMPLE_DELIVERED",
  "CONTRACT_SIGNING",
  "CONTRACT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

// CUSTOM + 샘플 없음
const STEPS_CUSTOM_NO_SAMPLE: StepKey[] = [
  "ORDER_CONFIRMED",
  "CONTRACT_SIGNING",
  "CONTRACT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

const STEP_LABELS: Record<StepKey, string> = {
  ORDER_CONFIRMED:       "주문 확정",
  SAMPLE_PREPARING:      "샘플 제작 시작",
  SAMPLE_SHIPPED:        "샘플 발송",
  SAMPLE_DELIVERED:      "샘플 수령",
  SAMPLE_RENEGOTIATING:  "샘플 재협상 중",
  CONTRACT_SIGNING:      "계약 서명",
  CONTRACT_CONFIRMED:    "계약 확정",
  PREPARING:             "출고 준비",
  SHIPPED:               "배송 시작",
  DELIVERED:             "배송 완료",
};

// 각 상태에서 완료된 스텝 집합
const DONE_STEPS_BY_STATUS: Record<OrderStatus, StepKey[]> = {
  CONFIRMED:             ["ORDER_CONFIRMED"],
  SAMPLE_PREPARING:      ["ORDER_CONFIRMED", "SAMPLE_PREPARING"],
  SAMPLE_SHIPPED:        ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED"],
  SAMPLE_DELIVERED:      ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED"],
  SAMPLE_RENEGOTIATING:  ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "SAMPLE_RENEGOTIATING"],
  CONTRACT_SIGNING:      ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING"],
  CONTRACT_CONFIRMED:    ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED"],
  PREPARING:             ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED", "PREPARING"],
  SHIPPED:               ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED", "PREPARING", "SHIPPED"],
  DELIVERED:             ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"],
  COMPLETED:             ["ORDER_CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"],
  CANCELLED:             [],
  DISPUTE:               ["ORDER_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"],
  REFUNDED:              [],
};

type Order = {
  id: string;
  date: string;
  supplier: string;
  type: OrderType;
  items: { name: string; quantity: number; unit: string; price: number; currency: string }[];
  status: OrderStatus;
  total: number;
  currency: string;
  trackingNo: string | null;
  carrier?: string;
  stepTimestamps?: Partial<Record<StepKey, string>>;
  stepLocations?: Partial<Record<StepKey, string>>;
  cancelReason?: string;
  cancelledAt?: string;
  disputeReason?: string;
  sampleRequired?: boolean;
  contractSignedAt?: string;
  renegotiateReason?: string;  // ★ 재협상 사유
};

// ── 동적 스텝 빌더 ────────────────────────────────────────────────────
function buildSteps(order: Order) {
  // 재협상 중이면 시퀀스에 SAMPLE_RENEGOTIATING 삽입
  let sequence: StepKey[];
  if (order.type === "READY") {
    sequence = order.sampleRequired ? STEPS_READY_WITH_SAMPLE : STEPS_READY;
  } else {
    sequence = order.sampleRequired ? STEPS_CUSTOM_WITH_SAMPLE : STEPS_CUSTOM_NO_SAMPLE;
  }

  // 재협상 상태일 때는 SAMPLE_DELIVERED 다음에 SAMPLE_RENEGOTIATING 삽입
  if (order.status === "SAMPLE_RENEGOTIATING" && !sequence.includes("SAMPLE_RENEGOTIATING")) {
    const idx = sequence.indexOf("SAMPLE_DELIVERED");
    if (idx !== -1) {
      sequence = [
        ...sequence.slice(0, idx + 1),
        "SAMPLE_RENEGOTIATING",
        ...sequence.slice(idx + 1),
      ];
    }
  }

  const doneSet = new Set(DONE_STEPS_BY_STATUS[order.status] ?? []);

  return sequence.map((key) => ({
    status:   STEP_LABELS[key],
    done:     doneSet.has(key),
    time:     order.stepTimestamps?.[key] ?? "—",
    location: order.stepLocations?.[key],
    isReneg:  key === "SAMPLE_RENEGOTIATING",
  }));
}

// ── 상태 설정 ──────────────────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CONFIRMED:            { label: "주문 확정",      color: "text-blue-700",         bg: "bg-blue-50 border-blue-200",       icon: <CheckCircle size={13} /> },
  SAMPLE_PREPARING:     { label: "샘플 제작 중",   color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",     icon: <FlaskConical size={13} /> },
  SAMPLE_SHIPPED:       { label: "샘플 배송 중",   color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",     icon: <Truck size={13} /> },
  SAMPLE_DELIVERED:     { label: "샘플 수령",      color: "text-amber-700",        bg: "bg-amber-50 border-amber-200",     icon: <Package size={13} /> },
  SAMPLE_RENEGOTIATING: { label: "샘플 재협상 중", color: "text-orange-700",       bg: "bg-orange-50 border-orange-200",   icon: <RefreshCw size={13} /> },
  CONTRACT_SIGNING:     { label: "계약 서명 중",   color: "text-purple-700",       bg: "bg-purple-50 border-purple-200",   icon: <PenLine size={13} /> },
  CONTRACT_CONFIRMED:   { label: "계약 확정",      color: "text-purple-700",       bg: "bg-purple-50 border-purple-200",   icon: <ShieldCheck size={13} /> },
  PREPARING:            { label: "출고 준비",      color: "text-[#C4956A]",        bg: "bg-rose-50 border-rose-200",       icon: <Package size={13} /> },
  SHIPPED:              { label: "배송 중",        color: "text-[#C4956A]",        bg: "bg-rose-50 border-rose-200",       icon: <Truck size={13} /> },
  DELIVERED:            { label: "배송 완료",      color: "text-green-700",        bg: "bg-green-50 border-green-200",     icon: <CheckCircle size={13} /> },
  COMPLETED:            { label: "거래 완료",      color: "text-green-700",        bg: "bg-green-50 border-green-200",     icon: <CheckCircle size={13} /> },
  CANCELLED:            { label: "취소됨",         color: "text-red-700",          bg: "bg-red-50 border-red-200",         icon: <XCircle size={13} /> },
  DISPUTE:              { label: "이의 제기",      color: "text-red-700",          bg: "bg-red-50 border-red-200",         icon: <AlertCircle size={13} /> },
  REFUNDED:             { label: "환불 완료",      color: "text-muted-foreground", bg: "bg-muted border-border",           icon: <RotateCcw size={13} /> },
};

const typeConfig: Record<OrderType, { label: string; color: string; bg: string }> = {
  READY:  { label: "일반 구매", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"   },
  CUSTOM: { label: "주문제작",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

// 택배사별 배송 추적 URL
const CARRIER_TRACKING: Record<string, (no: string) => string> = {
  "CJ대한통운":  (no) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${no}`,
  "한진택배":    (no) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
  "롯데택배":    (no) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${no}`,
  "로젠택배":    (no) => `https://www.ilogen.com/web/personal/trace/${no}`,
};

function getTrackingUrl(carrier: string | undefined, trackingNo: string): string {
  if (!carrier || !CARRIER_TRACKING[carrier]) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNo}`;
  }
  return CARRIER_TRACKING[carrier](trackingNo);
}

// ── 더미 데이터 ────────────────────────────────────────────────────────
const sampleOrders: Order[] = [
  {
    id: "ORD-2024-0841", date: "2024.05.18", supplier: "르블랑", type: "READY",
    items: [
      { name: "여성 린넨 오버핏 블라우스", quantity: 70, unit: "장", price: 12000, currency: "₩" },
      { name: "와이드 린넨 슬랙스", quantity: 25, unit: "장", price: 18000, currency: "₩" },
    ],
    status: "SHIPPED", total: 1290000, currency: "₩",
    trackingNo: "598412873021", carrier: "CJ대한통운",
    stepTimestamps: {
      ORDER_CONFIRMED: "2024.05.18 11:22",
      PREPARING:       "2024.05.19 09:15",
      SHIPPED:         "2024.05.20 11:40",
    },
    stepLocations: { SHIPPED: "CJ대한통운 마포 집하장" },
  },
  {
    id: "ORD-2024-0820", date: "2024.05.10", supplier: "모아뜨", type: "READY",
    items: [{ name: "플로럴 랩 원피스", quantity: 30, unit: "장", price: 25000, currency: "₩" }],
    status: "DELIVERED", total: 753000, currency: "₩",
    trackingNo: "471928374650", carrier: "한진택배",
    stepTimestamps: {
      ORDER_CONFIRMED: "2024.05.10 10:10",
      PREPARING:       "2024.05.11 10:00",
      SHIPPED:         "2024.05.12 08:30",
      DELIVERED:       "2024.05.14 14:20",
    },
    stepLocations: { SHIPPED: "한진택배 성수 집하장" },
  },
  {
    // ★ READY + 샘플 있음 케이스
    id: "ORD-2024-0855", date: "2024.05.16", supplier: "데일리앤코", type: "READY",
    sampleRequired: true,
    items: [{ name: "오버사이즈 코튼 셔츠", quantity: 100, unit: "장", price: 15000, currency: "₩" }],
    status: "SAMPLE_DELIVERED", total: 1500000, currency: "₩",
    trackingNo: "112837465099", carrier: "CJ대한통운",
    stepTimestamps: {
      ORDER_CONFIRMED:  "2024.05.16 09:00",
      SAMPLE_PREPARING: "2024.05.17 10:00",
      SAMPLE_SHIPPED:   "2024.05.18 14:00",
      SAMPLE_DELIVERED: "2024.05.19 11:30",
    },
    stepLocations: { SAMPLE_SHIPPED: "CJ대한통운" },
  },
  {
    // ★ 샘플 재협상 중 케이스
    id: "ORD-2024-0901", date: "2024.05.20", supplier: "르블랑 어패럴", type: "CUSTOM",
    sampleRequired: true,
    items: [{ name: "여성 린넨 오버핏 블라우스 (주문제작)", quantity: 200, unit: "벌", price: 14000, currency: "₩" }],
    status: "SAMPLE_RENEGOTIATING", total: 2800000, currency: "₩",
    trackingNo: "384729103847", carrier: "한진택배",
    renegotiateReason: "블루그레이 컬러 톤이 너무 밝습니다. 한 단계 진한 톤으로 재제작 요청드립니다.",
    stepTimestamps: {
      ORDER_CONFIRMED:       "2024.05.20 14:00",
      SAMPLE_PREPARING:      "2024.05.21 09:00",
      SAMPLE_SHIPPED:        "2024.05.23 11:00",
      SAMPLE_DELIVERED:      "2024.05.24 15:30",
      SAMPLE_RENEGOTIATING:  "2024.05.25 10:00",
    },
    stepLocations: { SAMPLE_SHIPPED: "한진택배" },
  },
  {
    id: "ORD-2024-0888", date: "2024.05.15", supplier: "에이블스튜디오", type: "CUSTOM",
    sampleRequired: false,
    items: [{ name: "여성 와이드 팬츠 (주문제작)", quantity: 150, unit: "벌", price: 18000, currency: "₩" }],
    status: "CONTRACT_SIGNING", total: 2700000, currency: "₩", trackingNo: null,
    stepTimestamps: { ORDER_CONFIRMED: "2024.05.15 10:00" },
  },
  {
    id: "ORD-2024-0807", date: "2024.05.02", supplier: "데일리앤코", type: "READY",
    items: [{ name: "여성 봄 니트 가디건", quantity: 40, unit: "장", price: 16200, currency: "₩" }],
    status: "COMPLETED", total: 648000, currency: "₩",
    trackingNo: "293847102938", carrier: "CJ대한통운",
    stepTimestamps: {
      ORDER_CONFIRMED: "2024.05.02 11:00",
      PREPARING:       "2024.05.03 09:00",
      SHIPPED:         "2024.05.04 10:30",
      DELIVERED:       "2024.05.06 15:00",
    },
  },
  {
    id: "ORD-2024-0791", date: "2024.04.20", supplier: "어반드레스", type: "READY",
    items: [{ name: "플리츠 미디 스커트", quantity: 45, unit: "장", price: 15000, currency: "₩" }],
    status: "CANCELLED", total: 675000, currency: "₩", trackingNo: null,
    cancelReason: "내부 예산 변경으로 인해 주문을 진행하지 않기로 결정했습니다.",
    cancelledAt: "2024.04.21 13:20",
  },
  {
    id: "ORD-2024-0780", date: "2024.04.15", supplier: "라온어패럴", type: "READY",
    items: [{ name: "여성 베이직 오버핏 셔츠", quantity: 50, unit: "장", price: 18900, currency: "₩" }],
    status: "DISPUTE", total: 945000, currency: "₩",
    trackingNo: "192837465019", carrier: "롯데택배",
    disputeReason: "수령한 상품 중 M 사이즈 10장에서 봉제 불량이 발견되었습니다.",
  },
];

const statusFilters: { value: string; label: string }[] = [
  { value: "ALL",                  label: "전체"     },
  { value: "CONFIRMED",            label: "주문 확정" },
  { value: "SAMPLE",               label: "샘플"     },
  { value: "SAMPLE_RENEGOTIATING", label: "재협상"   },
  { value: "CONTRACT_SIGNING",     label: "계약 서명" },
  { value: "PREPARING",            label: "준비 중"  },
  { value: "SHIPPED",              label: "배송 중"  },
  { value: "DELIVERED",            label: "배송 완료" },
  { value: "COMPLETED",            label: "거래 완료" },
  { value: "CANCELLED",            label: "취소"     },
  { value: "DISPUTE",              label: "이의 제기" },
];

const matchesFilter = (order: Order, filter: string): boolean => {
  if (filter === "ALL") return true;
  if (filter === "SAMPLE") return ["SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED"].includes(order.status);
  return order.status === filter;
};

// ── 액션 버튼 ──────────────────────────────────────────────────────────
function ActionButtons({
  order, onConfirm, onDispute, onCancel, onRenegotiate,
}: {
  order: Order;
  onConfirm:     (o: Order) => void;
  onDispute:     (o: Order) => void;
  onCancel:      (o: Order) => void;
  onRenegotiate: (o: Order) => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">

      {/* ── 샘플 수령 → 3가지 선택지 ── */}
      {order.status === "SAMPLE_DELIVERED" && (
        <>
          <button
            onClick={() => onCancel(order)}
            className="border border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5"
          >
            <XCircle size={12} /> 샘플 거절
          </button>
          {/* ★ 재협상 버튼 */}
          <button
            onClick={() => onRenegotiate(order)}
            className="border border-orange-300 text-orange-600 hover:bg-orange-50 text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> 재협상 요청
          </button>
          <Link
            to={`/buyer/orders/${order.id}/contract-sign`}
            className="bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
          >
            <PenLine size={12} /> 본생산 확정
          </Link>
        </>
      )}

      {/* ── 재협상 진행 중 ── */}
      {order.status === "SAMPLE_RENEGOTIATING" && (
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded border border-orange-200 flex-1 min-w-0">
            <RefreshCw size={12} className="flex-shrink-0" />
            <span className="truncate">재협상 중 — 공급사 검토 대기</span>
          </div>
          {/* 재협상 중에도 취소 가능 */}
          <button
            onClick={() => onCancel(order)}
            className="border border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <XCircle size={12} /> 취소
          </button>
        </div>
      )}

      {order.status === "CONTRACT_SIGNING" && (
        <Link
          to={`/buyer/orders/${order.id}/contract-sign`}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
        >
          <PenLine size={12} /> 계약서 서명하기
        </Link>
      )}

      {order.status === "CONTRACT_CONFIRMED" && (
        <Link
          to={`/checkout?type=custom&orderId=${order.id}`}
          className="bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
        >
          본결제 진행하기
        </Link>
      )}

      {/* ── 배송 중 → 배송 추적 버튼 ── */}
      {order.status === "SHIPPED" && order.trackingNo && (
        <a
          href={getTrackingUrl(order.carrier, order.trackingNo)}
          target="_blank"
          rel="noreferrer"
          className="border border-[#C4956A] text-[#C4956A] hover:bg-rose-50 text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
        >
          <ExternalLink size={12} /> 배송 추적
          {order.carrier && <span className="text-[10px] opacity-70">({order.carrier})</span>}
        </a>
      )}

      {order.status === "DELIVERED" && (
        <>
          <button
            onClick={() => onConfirm(order)}
            className="bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
          >
            <CheckCircle size={12} /> 거래 확정
          </button>
          <button
            onClick={() => onDispute(order)}
            className="border border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5"
          >
            <AlertCircle size={12} /> 이의 제기
          </button>
        </>
      )}

      {order.status === "DISPUTE" && (
        <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded border border-red-200">
          <AlertCircle size={12} />
          관리자 검토 중
        </div>
      )}

      {order.status === "CANCELLED" && (
        <button
          onClick={() => onCancel(order)}
          className="border border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A] text-xs px-3 py-1.5 rounded font-medium transition-colors"
        >
          취소 사유 보기
        </button>
      )}

      <Link
        to={`/orders/${order.id}`}
        className="text-xs text-muted-foreground hover:text-[#C4956A] transition-colors ml-auto flex items-center gap-1"
      >
        <Eye size={11} /> 주문 상세
      </Link>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
export function Orders() {
  const [expandedId,       setExpandedId]       = useState<string | null>(null);
  const [statusFilter,     setStatusFilter]     = useState("ALL");
  const [search,           setSearch]           = useState("");
  const [confirmTarget,    setConfirmTarget]    = useState<Order | null>(null);
  const [disputeTarget,    setDisputeTarget]    = useState<Order | null>(null);
  const [cancelTarget,     setCancelTarget]     = useState<Order | null>(null);
  const [renegotiateTarget, setRenegotiateTarget] = useState<Order | null>(null);
  const [renegotiateText,  setRenegotiateText]  = useState("");

  const filtered = sampleOrders.filter((o) => {
    const matchStatus = matchesFilter(o, statusFilter);
    const matchSearch =
      o.id.includes(search) ||
      o.supplier.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.includes(search));
    return matchStatus && matchSearch;
  });

  const handleConfirmTrade  = () => { setConfirmTarget(null);  alert("거래가 확정되었습니다. 셀러 정산이 진행됩니다."); };
  const handleSubmitDispute = () => { setDisputeTarget(null);  alert("이의 제기가 접수되었습니다. 관리자가 검토 후 안내드립니다."); };
  const handleRenegotiate   = () => {
    if (!renegotiateText.trim()) return;
    setRenegotiateTarget(null);
    setRenegotiateText("");
    alert("재협상 요청이 접수되었습니다. 공급사가 검토 후 연락드립니다.");
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Package size={24} className="text-[#C4956A]" />
        주문 관리
      </h1>

      {/* 검색 + 필터 */}
      <div className="bg-white border border-border rounded-lg p-4 mb-5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center border border-border rounded-lg px-3 py-2 gap-2 flex-1 min-w-[220px]">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="주문번호, 공급사, 상품명 검색..."
            className="text-sm outline-none flex-1 bg-transparent"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                statusFilter === f.value
                  ? "bg-[#C4956A] text-white border-[#C4956A]"
                  : "border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const status     = statusConfig[order.status];
          const type       = typeConfig[order.type];
          const isExpanded = expandedId === order.id;
          const steps      = buildSteps(order);

          return (
            <div key={order.id} className="bg-white border border-border rounded-lg overflow-hidden">
              {/* 헤더 */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground">{order.id}</span>
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border ${type.bg} ${type.color}`}>
                      {type.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${status.bg} ${status.color}`}>
                      {status.icon}{status.label}
                    </span>
                    {order.sampleRequired && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <FlaskConical size={10} /> 샘플 포함
                      </span>
                    )}
                    {/* 재협상 사유 미리보기 */}
                    {order.status === "SAMPLE_RENEGOTIATING" && order.renegotiateReason && (
                      <span className="text-[11px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded max-w-[200px] truncate">
                        {order.renegotiateReason}
                      </span>
                    )}
                    {/* 배송 중 송장번호 */}
                    {order.trackingNo && order.status === "SHIPPED" && (
                      <span className="text-[11px] text-[#C4956A] font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {order.trackingNo}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-4">
                    <span>{order.date}</span>
                    <span>{order.supplier}</span>
                    <span>{order.items.length}개 품목</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-foreground font-mono">
                    {order.currency}{order.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {order.items.reduce((a, i) => a + i.quantity, 0).toLocaleString()}장
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
                  : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
              </div>

              {/* 펼침 */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/20 px-5 py-4">

                  {/* 상품 목록 */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="text-foreground">{item.name}</div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-muted-foreground font-mono">
                            {item.quantity.toLocaleString()} {item.unit} × {item.currency}{item.price.toLocaleString()}
                          </span>
                          <span className="ml-3 font-bold font-mono text-foreground">
                            {item.currency}{(item.quantity * item.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 진행 타임라인 */}
                  {steps.length > 0 && order.status !== "CANCELLED" && (
                    <div className="border-t border-border pt-4 mb-4">
                      <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                        <Truck size={13} className="text-[#C4956A]" />
                        진행 현황
                        <span className="text-muted-foreground font-normal ml-1">
                          ({steps.filter(s => s.done).length}/{steps.length} 완료)
                        </span>
                      </h4>
                      <div className="relative">
                        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-muted" />
                        <div className="space-y-2.5">
                          {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-colors ${
                                step.isReneg
                                  ? "bg-orange-100 border-orange-300"
                                  : step.done
                                    ? "bg-[#C4956A] border-[#C4956A]"
                                    : "bg-white border-border"
                              }`}>
                                {step.isReneg
                                  ? <RefreshCw size={13} className="text-orange-600" />
                                  : step.done
                                    ? <CheckCircle size={14} className="text-white" />
                                    : <Clock size={14} className="text-muted-foreground" />}
                              </div>
                              <div className="pt-0.5 flex-1">
                                <div className={`text-xs font-semibold ${
                                  step.isReneg
                                    ? "text-orange-700"
                                    : step.done
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                }`}>
                                  {step.status}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">{step.time}</div>
                                {step.location && (
                                  <div className="text-[11px] text-[#C4956A]">{step.location}</div>
                                )}
                                {/* 재협상 사유 인라인 표시 */}
                                {step.isReneg && order.renegotiateReason && (
                                  <div className="mt-1 text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1 leading-relaxed">
                                    {order.renegotiateReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 계약 서명 완료 */}
                  {order.contractSignedAt && (
                    <div className="bg-purple-50 border border-purple-200 rounded px-3 py-2 text-xs text-purple-700 flex items-center gap-2 mb-3">
                      <ShieldCheck size={13} />
                      계약 서명 완료 — {order.contractSignedAt}
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <ActionButtons
                    order={order}
                    onConfirm={setConfirmTarget}
                    onDispute={setDisputeTarget}
                    onCancel={setCancelTarget}
                    onRenegotiate={setRenegotiateTarget}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <div className="font-medium">주문 내역이 없습니다</div>
          <div className="text-sm mt-1">다른 필터를 선택하거나 새로운 주문을 시작해보세요</div>
        </div>
      )}

      {/* ── 재협상 요청 모달 ── */}
      {renegotiateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setRenegotiateTarget(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <RefreshCw size={26} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">샘플 재협상 요청</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              수정이 필요한 부분을 구체적으로 작성해 주세요.<br />
              공급사가 검토 후 수정 샘플을 다시 제작합니다.
            </p>
            <div className="bg-muted/60 border border-border rounded-lg p-3 text-xs text-muted-foreground mb-4">
              <div className="font-semibold text-foreground mb-0.5">{renegotiateTarget.id}</div>
              <div>{renegotiateTarget.supplier} · {renegotiateTarget.currency}{renegotiateTarget.total.toLocaleString()}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">재협상 유형</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] bg-white">
                  <option>색상 수정</option>
                  <option>소재 변경</option>
                  <option>디자인 수정</option>
                  <option>사이즈 조정</option>
                  <option>봉제 품질</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  수정 요청 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={renegotiateText}
                  onChange={(e) => setRenegotiateText(e.target.value)}
                  placeholder="예) 블루그레이 컬러가 너무 밝습니다. 한 단계 진한 톤으로 재제작 요청드립니다."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">참고 이미지 첨부 (선택)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground hover:border-[#C4956A]/40 cursor-pointer transition-colors">
                  클릭하여 참고 이미지 첨부
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mt-3">
              ⚠️ 재협상 요청 시 추가 샘플 제작비가 발생할 수 있습니다.
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRenegotiateTarget(null)} className="flex-1 border border-border text-foreground hover:border-[#C4956A] hover:text-[#C4956A] py-2.5 rounded text-sm font-medium transition-colors">
                취소
              </button>
              <button
                onClick={handleRenegotiate}
                disabled={!renegotiateText.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded text-sm font-semibold transition-colors"
              >
                재협상 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 거래 확정 모달 ── */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setConfirmTarget(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={26} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">거래를 확정하시겠습니까?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              상품 수량 및 오염·하자가 없는지 확인하셨나요?<br />
              거래 확정 이후에는 이의 제기가 어려우며, 대금이 셀러에게 정산됩니다.
            </p>
            <div className="bg-muted/60 border border-border rounded p-3 text-xs text-muted-foreground mb-5">
              <div className="font-semibold text-foreground mb-1">주문번호 {confirmTarget.id}</div>
              <div>공급사 {confirmTarget.supplier} · 결제금액 {confirmTarget.currency}{confirmTarget.total.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 border border-border text-foreground hover:border-[#C4956A] hover:text-[#C4956A] py-2.5 rounded text-sm font-medium transition-colors">취소</button>
              <button onClick={handleConfirmTrade} className="flex-1 bg-[#C4956A] hover:bg-[#b3845a] text-white py-2.5 rounded text-sm font-semibold transition-colors">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이의 제기 모달 ── */}
      {disputeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setDisputeTarget(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={26} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">이의 제기 접수</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              수량 부족, 오염·하자, 오배송 등 문제가 있는 경우 이의 제기를 접수할 수 있습니다.
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
                <textarea rows={3} placeholder="상품 문제 상황을 자세히 작성해 주세요." className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDisputeTarget(null)} className="flex-1 border border-border text-foreground hover:border-[#C4956A] hover:text-[#C4956A] py-2.5 rounded text-sm font-medium transition-colors">취소</button>
              <button onClick={handleSubmitDispute} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded text-sm font-semibold transition-colors">접수하기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 취소 모달 ── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setCancelTarget(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle size={26} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {cancelTarget.status === "SAMPLE_DELIVERED" || cancelTarget.status === "SAMPLE_RENEGOTIATING"
                ? "샘플 검토 후 취소"
                : "주문 취소 정보"}
            </h3>
            {(cancelTarget.status === "SAMPLE_DELIVERED" || cancelTarget.status === "SAMPLE_RENEGOTIATING") ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  샘플 검토 후 취소 시 샘플 비용은 환불되지 않습니다. 취소 사유를 입력해 주세요.
                </p>
                <textarea rows={3} placeholder="취소 사유를 입력해 주세요." className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setCancelTarget(null)} className="flex-1 border border-border text-foreground py-2.5 rounded text-sm font-medium transition-colors">돌아가기</button>
                  <button onClick={() => setCancelTarget(null)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded text-sm font-semibold transition-colors">취소 확정</button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-muted/60 border border-border rounded p-3 text-xs text-muted-foreground mb-4">
                  <div className="font-semibold text-foreground mb-1">주문번호 {cancelTarget.id}</div>
                  <div>공급사 {cancelTarget.supplier} · 주문금액 {cancelTarget.currency}{cancelTarget.total.toLocaleString()}</div>
                </div>
                {cancelTarget.cancelledAt && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-semibold text-red-800">취소 일시</div>
                    <div className="text-xs text-red-700 mt-1">{cancelTarget.cancelledAt}</div>
                  </div>
                )}
                <div className="mb-5">
                  <div className="text-sm font-semibold text-foreground mb-2">취소 사유</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {cancelTarget.cancelReason ?? "취소 사유가 등록되지 않았습니다."}
                  </div>
                </div>
                <button onClick={() => setCancelTarget(null)} className="w-full bg-[#C4956A] hover:bg-[#b3845a] text-white py-2.5 rounded text-sm font-semibold transition-colors">확인</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}