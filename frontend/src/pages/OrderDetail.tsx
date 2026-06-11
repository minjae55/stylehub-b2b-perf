import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  Package, Truck, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight,
  FileText, Download, Eye, MapPin, Phone, Mail, AlertCircle, Send,
  FlaskConical, PenLine, ShieldCheck, RotateCcw, CreditCard,
  MessageCircle, Building2, Hash, Calendar, ImageIcon, ChevronDown,
  ChevronUp, X, Star, ArrowUpRight, Bookmark,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
type OrderStatus =
  | "CONFIRMED" | "SAMPLE_PREPARING" | "SAMPLE_SHIPPED" | "SAMPLE_DELIVERED"
  | "CONTRACT_SIGNING" | "CONTRACT_CONFIRMED" | "PREPARING" | "SHIPPED"
  | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTE" | "REFUNDED";

type OrderType = "READY" | "CUSTOM";

type Inquiry = {
  id: string;
  date: string;
  from: "BUYER" | "SELLER" | "ADMIN";
  type: string;
  content: string;
  attachments?: string[];
  reply?: { date: string; content: string };
};

type Order = {
  id: string; date: string;
  supplier: string; supplierContact: string; supplierEmail: string; supplierPhone: string;
  supplierAddress: string; supplierCategory: string; supplierRating: number;
  type: OrderType;
  items: {
    name: string; quantity: number; unit: string; price: number; currency: string;
    sku: string; color: string; sizes: Record<string, number>;
    image: string;
  }[];
  status: OrderStatus; total: number; currency: string;
  trackingNo: string | null; carrier?: string;
  shippingSteps?: { status: string; time: string; location?: string; done: boolean }[];
  cancelReason?: string; cancelledAt?: string;
  disputeReason?: string; sampleRequired?: boolean; contractSignedAt?: string;
  shippingAddress: { recipient: string; phone: string; address: string; detail: string };
  shippingTier: "SMALL" | "MEDIUM" | "LARGE";
  shippingFee: number | null;
  paymentMethod: string; paidAt?: string;
  memo?: string;
  quote?: { id: string; unitPrice: string; validUntil: string; notes: string };
  inquiries: Inquiry[];
};

// ── 상태 설정 ──────────────────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CONFIRMED:          { label: "주문 확정",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <CheckCircle size={14} /> },
  SAMPLE_PREPARING:   { label: "샘플 제작 중", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <FlaskConical size={14} /> },
  SAMPLE_SHIPPED:     { label: "샘플 배송 중", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <Truck size={14} /> },
  SAMPLE_DELIVERED:   { label: "샘플 수령",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <Package size={14} /> },
  CONTRACT_SIGNING:   { label: "계약 서명 중", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <PenLine size={14} /> },
  CONTRACT_CONFIRMED: { label: "계약 확정",    color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <ShieldCheck size={14} /> },
  PREPARING:          { label: "출고 준비",    color: "text-[#C4956A]",  bg: "bg-rose-50 border-rose-200",     icon: <Package size={14} /> },
  SHIPPED:            { label: "배송 중",      color: "text-[#C4956A]",  bg: "bg-rose-50 border-rose-200",     icon: <Truck size={14} /> },
  DELIVERED:          { label: "배송 완료",    color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={14} /> },
  COMPLETED:          { label: "거래 완료",    color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={14} /> },
  CANCELLED:          { label: "취소됨",       color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={14} /> },
  DISPUTE:            { label: "이의 제기",    color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: <AlertCircle size={14} /> },
  REFUNDED:           { label: "환불 완료",    color: "text-muted-foreground", bg: "bg-muted border-border",   icon: <RotateCcw size={14} /> },
};

const typeConfig: Record<OrderType, { label: string; color: string; bg: string }> = {
  READY:  { label: "일반 구매", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  CUSTOM: { label: "주문제작",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

const tierLabel: Record<string, string> = {
  SMALL:  "소량 택배 (착불)",
  MEDIUM: "중량 택배 (착불)",
  LARGE:  "화물 배송 (협의)",
};

// ── 더미 데이터 ────────────────────────────────────────────────────────
const ordersData: Record<string, Order> = {
  "ORD-2024-0841": {
    id: "ORD-2024-0841", date: "2024.05.18",
    supplier: "르블랑", supplierContact: "김지수", supplierEmail: "contact@leblank.kr",
    supplierPhone: "02-1234-5678", supplierAddress: "서울특별시 중구 동대문로 5가 12-3",
    supplierCategory: "캐주얼·린넨 여성복", supplierRating: 4.8,
    type: "READY",
    items: [
      {
        name: "여성 린넨 오버핏 블라우스", quantity: 70, unit: "장", price: 12000, currency: "₩",
        sku: "LB-BL-LN-001", color: "아이보리",
        sizes: { S: 10, M: 30, L: 20, XL: 10 },
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4084?w=400&h=400&fit=crop",
      },
      {
        name: "와이드 린넨 슬랙스", quantity: 25, unit: "장", price: 18000, currency: "₩",
        sku: "LB-SL-LN-002", color: "베이지",
        sizes: { S: 5, M: 10, L: 7, XL: 3 },
        image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=400&h=400&fit=crop",
      },
    ],
    status: "SHIPPED", total: 1290000, currency: "₩",
    trackingNo: "598412873021", carrier: "CJ대한통운",
    shippingTier: "MEDIUM", shippingFee: null,
    shippingAddress: { recipient: "스타일위크 물류팀", phone: "02-9876-5432", address: "서울특별시 마포구 합정동 123-45", detail: "스타일위크㈜ 물류센터 (우: 04045)" },
    paymentMethod: "에스크로 결제", paidAt: "2024.05.18 14:22",
    memo: "린넨 소재 특성상 세탁 시 수축 주의 부탁드립니다. 행거 보관 권장.",
    quote: { id: "QUO-2024-0033", unitPrice: "블라우스 ₩12,000 / 슬랙스 ₩18,000", validUntil: "2024.06.01", notes: "자체 공장 생산, 당일 출고 가능. 재주문 시 5% 할인 제공." },
    shippingSteps: [
      { status: "주문 확정",  time: "2024.05.18 11:22", done: true },
      { status: "출고 준비",  time: "2024.05.19 09:15", done: true },
      { status: "배송 시작",  time: "2024.05.20 11:40", location: "CJ대한통운 마포 집하장", done: true },
      { status: "배송 완료",  time: "—", done: false },
    ],
    inquiries: [
      {
        id: "INQ-001", date: "2024.05.19 10:30", from: "BUYER",
        type: "배송 관련",
        content: "혹시 오늘 출고 가능한지 확인 부탁드립니다. 주말 전에 받아야 해서요.",
        reply: { date: "2024.05.19 11:15", content: "안녕하세요! 오늘 오후 2시 이전 출고 처리 예정입니다. 내일 수령 가능하실 것 같습니다 😊" },
      },
      {
        id: "INQ-002", date: "2024.05.20 14:00", from: "BUYER",
        type: "상품 관련",
        content: "블라우스 M 사이즈 5장을 L 사이즈로 변경 가능할까요?",
      },
    ],
  },
  "ORD-2024-0820": {
    id: "ORD-2024-0820", date: "2024.05.10",
    supplier: "모아뜨", supplierContact: "박서연", supplierEmail: "hello@moatte.kr",
    supplierPhone: "02-2345-6789", supplierAddress: "서울특별시 성동구 성수일로 88",
    supplierCategory: "페미닌·원피스 전문", supplierRating: 4.6,
    type: "READY",
    items: [
      {
        name: "플로럴 랩 원피스", quantity: 30, unit: "장", price: 25000, currency: "₩",
        sku: "MT-OP-FL-003", color: "핑크 플로럴",
        sizes: { S: 8, M: 14, L: 8 },
        image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&h=400&fit=crop",
      },
    ],
    status: "DELIVERED", total: 753000, currency: "₩",
    trackingNo: "471928374650", carrier: "한진택배",
    shippingTier: "SMALL", shippingFee: null,
    shippingAddress: { recipient: "패션플러스 입고팀", phone: "02-5678-1234", address: "서울특별시 강남구 신사동 456-78", detail: "패션플러스 (우: 06025)" },
    paymentMethod: "에스크로 결제", paidAt: "2024.05.10 15:00",
    shippingSteps: [
      { status: "주문 확정", time: "2024.05.10 10:10", done: true },
      { status: "출고 완료", time: "2024.05.11 10:00", done: true },
      { status: "배송 시작", time: "2024.05.12 08:30", location: "한진택배 성수 집하장", done: true },
      { status: "배송 완료", time: "2024.05.14 14:20", location: "서울 강남구", done: true },
    ],
    inquiries: [],
  },
  "ORD-2024-0901": {
    id: "ORD-2024-0901", date: "2024.05.20",
    supplier: "르블랑 어패럴", supplierContact: "이민재", supplierEmail: "custom@leblank.kr",
    supplierPhone: "02-1234-9999", supplierAddress: "서울특별시 중구 동대문로 5가 12-3",
    supplierCategory: "캐주얼·주문제작", supplierRating: 4.9,
    type: "CUSTOM", sampleRequired: true,
    items: [
      {
        name: "여성 린넨 오버핏 블라우스 (주문제작)", quantity: 200, unit: "벌", price: 14000, currency: "₩",
        sku: "LB-CUSTOM-001", color: "아이보리 / 블루그레이 / 피치",
        sizes: { S: 40, M: 80, L: 60, XL: 20 },
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4084?w=400&h=400&fit=crop",
      },
    ],
    status: "SAMPLE_DELIVERED", total: 2800000, currency: "₩",
    trackingNo: "384729103847", carrier: "한진택배",
    shippingTier: "LARGE", shippingFee: null,
    shippingAddress: { recipient: "스타일위크 물류팀", phone: "02-9876-5432", address: "서울특별시 마포구 합정동 123-45", detail: "스타일위크㈜ 물류센터 (우: 04045)" },
    paymentMethod: "에스크로 (계약 후 본결제)",
    memo: "3컬러 각각 샘플 1장씩 요청. 아이보리는 약간 더 따뜻한 톤으로 부탁드립니다.",
    shippingSteps: [
      { status: "주문 확정",      time: "2024.05.20 14:00", done: true },
      { status: "샘플 제작 시작", time: "2024.05.21 09:00", done: true },
      { status: "샘플 발송",      time: "2024.05.23 11:00", location: "한진택배", done: true },
      { status: "샘플 수령",      time: "2024.05.24 15:30", done: true },
      { status: "계약 서명",      time: "—", done: false },
      { status: "본생산 시작",    time: "—", done: false },
      { status: "배송",           time: "—", done: false },
    ],
    inquiries: [
      {
        id: "INQ-003", date: "2024.05.21 09:45", from: "SELLER",
        type: "샘플 안내",
        content: "안녕하세요! 오늘 샘플 제작 시작했습니다. 3컬러 각 1장씩 이틀 내로 발송 예정입니다. 아이보리 톤은 말씀주신 따뜻한 느낌으로 진행하겠습니다.",
      },
      {
        id: "INQ-004", date: "2024.05.24 16:00", from: "BUYER",
        type: "샘플 피드백",
        content: "샘플 잘 받았습니다! 아이보리랑 피치는 완벽한데, 블루그레이가 조금 더 진한 톤이었으면 좋겠어요. 나머지는 본생산 진행해주세요.",
        reply: { date: "2024.05.24 17:30", content: "피드백 감사합니다! 블루그레이 톤을 한 단계 진하게 조정해서 본생산 진행하겠습니다. 계약서 초안 보내드릴게요." },
      },
    ],
  },
  "ORD-2024-0807": {
    id: "ORD-2024-0807", date: "2024.05.02",
    supplier: "데일리앤코", supplierContact: "최은정", supplierEmail: "info@dailynco.kr",
    supplierPhone: "031-456-7890", supplierAddress: "경기도 의정부시 민락동 45-6",
    supplierCategory: "캐주얼·니트 전문", supplierRating: 4.5,
    type: "READY",
    items: [
      {
        name: "여성 봄 니트 가디건", quantity: 40, unit: "장", price: 16200, currency: "₩",
        sku: "DC-KN-SP-004", color: "머스타드 / 라이트그레이",
        sizes: { FREE: 40 },
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop",
      },
    ],
    status: "COMPLETED", total: 648000, currency: "₩",
    trackingNo: "293847102938", carrier: "CJ대한통운",
    shippingTier: "SMALL", shippingFee: null,
    shippingAddress: { recipient: "언니네옷장 대표", phone: "051-234-5678", address: "부산광역시 해운대구 우동 321", detail: "언니네옷장 (우: 48060)" },
    paymentMethod: "에스크로 결제", paidAt: "2024.05.02 11:00",
    inquiries: [],
  },
  "ORD-2024-0780": {
    id: "ORD-2024-0780", date: "2024.04.15",
    supplier: "라온어패럴", supplierContact: "정수현", supplierEmail: "cs@raon-apparel.kr",
    supplierPhone: "02-8765-4321", supplierAddress: "서울특별시 서초구 반포대로 78",
    supplierCategory: "베이직·오피스룩", supplierRating: 3.8,
    type: "READY",
    items: [
      {
        name: "여성 베이직 오버핏 셔츠", quantity: 50, unit: "장", price: 18900, currency: "₩",
        sku: "RA-SH-BK-005", color: "화이트 / 블랙",
        sizes: { S: 10, M: 20, L: 15, XL: 5 },
        image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop",
      },
    ],
    status: "DISPUTE", total: 945000, currency: "₩",
    trackingNo: "192837465019", carrier: "롯데택배",
    shippingTier: "SMALL", shippingFee: null,
    shippingAddress: { recipient: "스타일위크 물류팀", phone: "02-9876-5432", address: "서울특별시 마포구 합정동 123-45", detail: "스타일위크㈜ 물류센터 (우: 04045)" },
    paymentMethod: "에스크로 결제", paidAt: "2024.04.15 10:00",
    disputeReason: "수령한 상품 중 M 사이즈 10장에서 봉제 불량(옆선 터짐)이 발견되었습니다.",
    inquiries: [
      {
        id: "INQ-005", date: "2024.04.20 09:00", from: "BUYER",
        type: "불량 접수",
        content: "M 사이즈 10장에서 옆선 봉제 불량이 확인됩니다. 사진 첨부했습니다. 교환 또는 환불 요청드립니다.",
        attachments: ["불량사진_1.jpg", "불량사진_2.jpg"],
      },
      {
        id: "INQ-006", date: "2024.04.20 14:00", from: "ADMIN",
        type: "관리자 안내",
        content: "이의 제기가 접수되었습니다. 양측 확인 후 1~2영업일 내 처리 방향을 안내드리겠습니다. 결제 대금은 처리 완료 전까지 보관됩니다.",
      },
    ],
  },
};

// ── 탭 타입 ───────────────────────────────────────────────────────────
type SideTab = "summary" | "shipping" | "payment" | "inquiry";

const sideTabs: { key: SideTab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { key: "summary",  label: "주문 요약",  icon: <FileText size={15} /> },
  { key: "shipping", label: "배송 현황",  icon: <Truck size={15} /> },
  { key: "payment",  label: "결제 정보",  icon: <CreditCard size={15} /> },
  { key: "inquiry",  label: "문의 내역",  icon: <MessageCircle size={15} /> },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = id ? ordersData[id] : null;

  const [activeTab,    setActiveTab]    = useState<SideTab>("summary");
  const [selectedImg,  setSelectedImg]  = useState(0);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showDispute,  setShowDispute]  = useState(false);
  const [inquiryType,  setInquiryType]  = useState("배송 관련");
  const [inquiryText,  setInquiryText]  = useState("");

  if (!order) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-16 text-center">
        <Package size={48} className="mx-auto mb-4 opacity-30 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">주문을 찾을 수 없습니다</h2>
        <Link to="/orders" className="bg-[#C4956A] text-white px-6 py-2.5 rounded font-semibold text-sm">
          주문 목록으로
        </Link>
      </div>
    );
  }

  const status   = statusConfig[order.status];
  const type     = typeConfig[order.type];
  const subtotal = order.items.reduce((a, i) => a + i.quantity * i.price, 0);
  const allImages = order.items.map((i) => ({ src: i.image, name: i.name }));

  const orderIds  = Object.keys(ordersData);
  const curIdx    = orderIds.indexOf(order.id);
  const prevId    = orderIds[curIdx - 1];
  const nextId    = orderIds[curIdx + 1];

  const unanswered = order.inquiries.filter((q) => q.from === "BUYER" && !q.reply).length;

  // 탭에 뱃지 붙이기
  const tabsWithBadge = sideTabs.map((t) =>
    t.key === "inquiry" && unanswered > 0 ? { ...t, badge: unanswered } : t
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

      {/* ── 상단 네비 ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/orders" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} /> 주문 목록
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono font-semibold text-foreground">{order.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {prevId ? (
            <Link to={`/orders/${prevId}`} onClick={() => setSelectedImg(0)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 rounded transition-colors">
              <ChevronLeft size={13} /> 이전 주문
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/30 border border-border/30 px-3 py-1.5 rounded cursor-not-allowed">
              <ChevronLeft size={13} /> 이전 주문
            </span>
          )}
          {nextId ? (
            <Link to={`/orders/${nextId}`} onClick={() => setSelectedImg(0)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 rounded transition-colors">
              다음 주문 <ChevronRight size={13} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/30 border border-border/30 px-3 py-1.5 rounded cursor-not-allowed">
              다음 주문 <ChevronRight size={13} />
            </span>
          )}
        </div>
      </div>

      {/* ── 메인 레이아웃 ── */}
      <div className="flex gap-6">

        {/* ════ 왼쪽 사이드바 ════ */}
        <aside className="w-[220px] flex-shrink-0 space-y-3">

          {/* 주문 상태 카드 */}
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="text-[11px] text-muted-foreground mb-0.5">주문번호</div>
            <div className="font-mono font-bold text-sm text-foreground mb-3">{order.id}</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
                {status.icon} {status.label}
              </span>
              <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${type.bg} ${type.color}`}>
                {type.label}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar size={11} /> {order.date}</div>
              <div className="flex items-center gap-1.5"><Building2 size={11} /> {order.supplier}</div>
              <div className="flex items-center gap-1.5"><Hash size={11} /> {order.items.reduce((a, i) => a + i.quantity, 0).toLocaleString()}장</div>
            </div>
          </div>

          {/* 탭 네비 */}
          <nav className="bg-white border border-border rounded-lg overflow-hidden">
            {tabsWithBadge.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  idx !== 0 ? "border-t border-border" : ""
                } ${
                  activeTab === tab.key
                    ? "bg-[#FAF9F7] text-[#C4956A] border-l-2 border-l-[#C4956A]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span className={activeTab === tab.key ? "text-[#C4956A]" : ""}>{tab.icon}</span>
                <span className="flex-1">{tab.label}</span>
                {tab.badge ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                ) : activeTab === tab.key ? (
                  <ChevronRight size={13} className="text-[#C4956A]" />
                ) : null}
              </button>
            ))}
          </nav>

          {/* 액션 버튼 */}
          <div className="bg-white border border-border rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">액션</div>

            {order.status === "SAMPLE_DELIVERED" && (
              <>
                <Link to={`/buyer/orders/${order.id}/contract-sign`}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors">
                  <PenLine size={13} /> 본생산 확정
                </Link>
                <button onClick={() => setShowDispute(true)}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-2 rounded transition-colors">
                  <XCircle size={13} /> 샘플 후 취소
                </button>
              </>
            )}
            {order.status === "CONTRACT_SIGNING" && (
              <Link to={`/buyer/orders/${order.id}/contract-sign`}
                className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded transition-colors">
                <PenLine size={13} /> 계약서 서명
              </Link>
            )}
            {order.status === "CONTRACT_CONFIRMED" && (
              <Link to={`/checkout?type=custom&orderId=${order.id}`}
                className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors">
                <CreditCard size={13} /> 본결제 진행
              </Link>
            )}
            {order.status === "DELIVERED" && (
              <>
                <button onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#C4956A] hover:bg-[#b3845a] text-white text-xs font-semibold px-3 py-2 rounded transition-colors">
                  <CheckCircle size={13} /> 거래 확정
                </button>
                <button onClick={() => setShowDispute(true)}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-2 rounded transition-colors">
                  <AlertCircle size={13} /> 이의 제기
                </button>
              </>
            )}
            {order.status === "DISPUTE" && (
              <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" /> 관리자 검토 중
              </div>
            )}
            {order.status === "COMPLETED" && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
                <CheckCircle size={12} /> 거래 완료
              </div>
            )}
            {order.status === "SHIPPED" && order.trackingNo && (
              <a
                href={`https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${order.trackingNo}`}
                target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 border border-[#C4956A] text-[#C4956A] hover:bg-rose-50 text-xs px-3 py-2 rounded transition-colors"
              >
                <Truck size={13} /> 배송 추적 <ArrowUpRight size={11} />
              </a>
            )}
            {order.quote && (
              <button className="w-full flex items-center justify-center gap-1.5 border border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A] text-xs px-3 py-2 rounded transition-colors">
                <Download size={13} /> 견적서 다운로드
              </button>
            )}
            <button
              onClick={() => setActiveTab("inquiry")}
              className="w-full flex items-center justify-center gap-1.5 border border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A] text-xs px-3 py-2 rounded transition-colors"
            >
              <MessageCircle size={13} /> 공급사 문의잉 
            </button>
          </div>
        </aside>

        {/* ════ 오른쪽 콘텐츠 ════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ═══ 탭: 주문 요약 ═══ */}
          {activeTab === "summary" && (
            <>
              {/* 상품 이미지 뷰어 */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">상품 이미지</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-muted/20 rounded-lg overflow-hidden aspect-[4/3]">
                      <img
                        src={allImages[selectedImg]?.src}
                        alt={allImages[selectedImg]?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImg(i)}
                          className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                            selectedImg === i ? "border-[#C4956A]" : "border-border hover:border-[#C4956A]/50"
                          }`}
                        >
                          <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 주문 상품 상세 */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Package size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">주문 상품</h2>
                </div>
                <div className="divide-y divide-border">
                  {order.items.map((item) => {
                    const isExpanded = expandedItem === item.sku;
                    return (
                      <div key={item.sku}>
                        <div
                          className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-muted/20"
                          onClick={() => setExpandedItem(isExpanded ? null : item.sku)}
                        >
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground mb-0.5">{item.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              색상: {item.color} · {item.quantity}{item.unit}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-mono font-bold text-foreground">{item.currency}{(item.quantity * item.price).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{item.quantity}{item.unit} × {item.currency}{item.price.toLocaleString()}</div>
                          </div>
                          {isExpanded ? <ChevronUp size={15} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground flex-shrink-0" />}
                        </div>
                        {isExpanded && (
                          <div className="px-5 pb-4 bg-muted/10">
                            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">사이즈별 수량</div>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(item.sizes).map(([size, qty]) => (
                                <div key={size} className="bg-white border border-border rounded px-3 py-1.5 text-center">
                                  <div className="text-[11px] text-muted-foreground">{size}</div>
                                  <div className="font-bold text-sm text-foreground font-mono">{qty}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 금액 합계 */}
                <div className="bg-muted/20 border-t border-border px-5 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">상품 소계</span>
                    <span className="font-mono">{order.currency}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="font-mono text-muted-foreground">
                      {tierLabel[order.shippingTier]}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span className="text-foreground">결제 합계</span>
                    <span className="font-mono text-lg text-foreground">{order.currency}{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 견적서 */}
              {order.quote && (
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#C4956A]" />
                      <h2 className="font-bold text-foreground text-sm">견적서</h2>
                    </div>
                    <span className="bg-green-50 text-green-700 border border-green-200 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Send size={10} /> 수신 완료
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-sm font-bold text-foreground mb-3">{order.quote.id}</div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div><div className="text-xs text-muted-foreground mb-0.5">단가</div><div className="font-bold text-[#C4956A] text-sm">{order.quote.unitPrice}</div></div>
                      <div><div className="text-xs text-muted-foreground mb-0.5">유효기한</div><div className="font-medium text-foreground text-sm">{order.quote.validUntil}</div></div>
                      <div><div className="text-xs text-muted-foreground mb-0.5">공급사</div><div className="font-medium text-foreground text-sm">{order.supplier}</div></div>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground mb-3">{order.quote.notes}</div>
                    <button className="flex items-center gap-1.5 border border-border text-muted-foreground hover:border-[#C4956A] hover:text-[#C4956A] text-xs px-4 py-2 rounded transition-colors">
                      <Download size={12} /> 견적서 PDF 다운로드
                    </button>
                  </div>
                </div>
              )}

              {/* 배송지 */}
              <div className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">배송지 & 수령인</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground mb-0.5">수령인</div><div className="font-medium text-foreground">{order.shippingAddress.recipient}</div></div>
                  <div><div className="text-xs text-muted-foreground mb-0.5">연락처</div><div className="font-medium text-foreground">{order.shippingAddress.phone}</div></div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground mb-0.5">주소</div><div className="font-medium text-foreground">{order.shippingAddress.address}</div><div className="text-muted-foreground text-xs mt-0.5">{order.shippingAddress.detail}</div></div>
                </div>
              </div>

              {/* 주문 메모 */}
              {order.memo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-amber-800 mb-1">📝 주문 메모</div>
                  <div className="text-sm text-amber-700">{order.memo}</div>
                </div>
              )}

              {/* 이의 제기 / 취소 */}
              {order.status === "DISPUTE" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1"><AlertCircle size={12} /> 이의 제기 내용</div>
                  <div className="text-sm text-red-700">{order.disputeReason}</div>
                  <div className="mt-2 text-xs text-red-600 font-medium">관리자 검토 중 — 1~2영업일 내 안내드립니다.</div>
                </div>
              )}
              {order.contractSignedAt && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-600" />
                  <div><div className="text-xs font-semibold text-purple-800">계약 서명 완료</div><div className="text-xs text-purple-700">{order.contractSignedAt}</div></div>
                </div>
              )}
            </>
          )}

          {/* ═══ 탭: 배송 현황 ═══ */}
          {activeTab === "shipping" && (
            <div className="space-y-4">
              {/* 공급사 + 송장 */}
              <div className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">공급사 정보</h2>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C4956A]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-[#C4956A]" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                    <div><div className="text-xs text-muted-foreground mb-0.5">브랜드명</div><div className="font-semibold text-foreground">{order.supplier}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">카테고리</div><div className="text-foreground">{order.supplierCategory}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">담당자</div><div className="flex items-center gap-1 text-foreground"><Phone size={11} /> {order.supplierContact}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">이메일</div><div className="flex items-center gap-1 text-foreground"><Mail size={11} /> {order.supplierEmail}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">연락처</div><div className="text-foreground">{order.supplierPhone}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">평점</div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={11} className={s <= Math.round(order.supplierRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-0.5">{order.supplierRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 송장 */}
              {order.trackingNo && (
                <div className="bg-white border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Truck size={16} className="text-[#C4956A]" /><h2 className="font-bold text-foreground text-sm">운송 정보</h2></div>
                    <a href={`https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${order.trackingNo}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-[#C4956A] hover:underline">
                      택배사 조회 <ArrowUpRight size={12} />
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><div className="text-xs text-muted-foreground mb-0.5">택배사</div><div className="font-medium text-foreground">{order.carrier}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">송장번호</div><div className="font-mono font-bold text-foreground">{order.trackingNo}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">배송 구간</div><div className="font-medium text-foreground">{tierLabel[order.shippingTier]}</div></div>
                  </div>
                </div>
              )}

              {/* 타임라인 */}
              {order.shippingSteps && (
                <div className="bg-white border border-border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-5"><FileText size={16} className="text-[#C4956A]" /><h2 className="font-bold text-foreground text-sm">진행 현황</h2></div>
                  <div className="relative">
                    <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-4">
                      {order.shippingSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${step.done ? "bg-[#C4956A] border-[#C4956A]" : "bg-white border-border"}`}>
                            {step.done ? <CheckCircle size={14} className="text-white" /> : <Clock size={14} className="text-muted-foreground" />}
                          </div>
                          <div className="pt-1 flex-1">
                            <div className={`text-sm font-semibold ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.status}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{step.time}</div>
                            {step.location && <div className="text-xs text-[#C4956A] mt-0.5">{step.location}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
              <div className="p-5 space-y-3">
                {[
                  { label: "결제 방식",   value: order.paymentMethod },
                  { label: "결제 일시",   value: order.paidAt ?? "—" },
                  { label: "상품 소계",   value: `${order.currency}${subtotal.toLocaleString()}` },
                  { label: "배송비",      value: tierLabel[order.shippingTier] },
                  { label: "최종 결제액", value: `${order.currency}${order.total.toLocaleString()}`, bold: true },
                  { label: "결제 상태",   value: order.status === "CANCELLED" ? "결제 취소" : order.status === "REFUNDED" ? "환불 완료" : "결제 완료" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={`text-sm ${row.bold ? "font-bold text-foreground text-base" : "font-medium text-foreground"}`}>{row.value}</span>
                  </div>
                ))}
                <div className="bg-[#FAF9F7] border border-[#C4956A]/20 rounded-lg p-4 mt-2">
                  <div className="text-xs font-semibold text-[#C4956A] mb-1">🔒 에스크로 안내</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    결제 대금은 플랫폼이 안전하게 보관하며, 거래 확정 후 공급사에게 정산됩니다.
                    배송 완료 후 7일 이내에 거래 확정 또는 이의 제기를 해주세요.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 탭: 문의 내역 ═══ */}
          {activeTab === "inquiry" && (
            <div className="space-y-4">
              {/* 문의 목록 */}
              {order.inquiries.length > 0 ? (
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <MessageCircle size={16} className="text-[#C4956A]" />
                    <h2 className="font-bold text-foreground text-sm">문의 내역 ({order.inquiries.length}건)</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {order.inquiries.map((inq) => (
                      <div key={inq.id} className="p-5">
                        {/* 문의 헤더 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              inq.from === "BUYER" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              inq.from === "SELLER" ? "bg-rose-50 text-[#C4956A] border-rose-200" :
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}>
                              {inq.from === "BUYER" ? "내 문의" : inq.from === "SELLER" ? "공급사" : "관리자"}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{inq.type}</span>
                            {!inq.reply && inq.from === "BUYER" && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">답변 대기</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{inq.date}</span>
                        </div>

                        {/* 문의 내용 */}
                        <div className="bg-muted/30 rounded-lg p-3 text-sm text-foreground mb-2 leading-relaxed">
                          {inq.content}
                        </div>

                        {/* 첨부파일 */}
                        {inq.attachments && inq.attachments.length > 0 && (
                          <div className="flex gap-2 mb-2 flex-wrap">
                            {inq.attachments.map((file) => (
                              <span key={file} className="flex items-center gap-1 text-xs bg-muted border border-border px-2 py-1 rounded text-muted-foreground">
                                <ImageIcon size={11} /> {file}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 답변 */}
                        {inq.reply && (
                          <div className="ml-4 border-l-2 border-[#C4956A]/30 pl-4 mt-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-semibold text-[#C4956A]">
                                {inq.from === "ADMIN" ? "관리자 답변" : "공급사 답변"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{inq.reply.date}</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm text-foreground leading-relaxed">
                              {inq.reply.content}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-lg p-10 text-center text-muted-foreground">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">아직 문의 내역이 없습니다</div>
                </div>
              )}

              {/* 새 문의 작성 */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Send size={16} className="text-[#C4956A]" />
                  <h2 className="font-bold text-foreground text-sm">새 문의 작성</h2>
                </div>
                <div className="p-5 space-y-3">
                  {/* 공급사 정보 */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-[#C4956A]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-[#C4956A]" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{order.supplier}</div>
                      <div className="text-xs text-muted-foreground">평균 응답 2시간 · {order.supplierEmail}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">문의 유형</label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] bg-white"
                    >
                      <option>배송 관련</option>
                      <option>상품 관련</option>
                      <option>사이즈 교환</option>
                      <option>추가 발주</option>
                      <option>불량 접수</option>
                      <option>기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">문의 내용</label>
                    <textarea
                      rows={4}
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      placeholder="문의 내용을 입력해 주세요."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">사진 첨부 (선택)</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-[#C4956A]/40 cursor-pointer transition-colors">
                      클릭하여 사진 첨부 (최대 5장)
                    </div>
                  </div>
                  <button
                    onClick={() => { if (inquiryText.trim()) { alert("문의가 전송되었습니다."); setInquiryText(""); } }}
                    className="w-full bg-[#C4956A] hover:bg-[#b3845a] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> 문의 보내기
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
            <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4"><CheckCircle size={26} className="text-green-600" /></div>
            <h3 className="text-lg font-bold mb-2">거래를 확정하시겠습니까?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              상품 수량 및 하자가 없는지 확인하셨나요?<br />
              확정 이후에는 이의 제기가 어려우며, 대금이 공급사에게 정산됩니다.
            </p>
            <div className="bg-muted/60 border border-border rounded p-3 text-xs text-muted-foreground mb-5">
              <div className="font-semibold text-foreground mb-1">{order.id}</div>
              <div>{order.supplier} · {order.currency}{order.total.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border py-2.5 rounded text-sm font-medium">취소</button>
              <button onClick={() => { setShowConfirm(false); alert("거래가 확정되었습니다."); }} className="flex-1 bg-[#C4956A] hover:bg-[#b3845a] text-white py-2.5 rounded text-sm font-semibold">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이의 제기 모달 ── */}
      {showDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowDispute(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertCircle size={26} className="text-red-600" /></div>
            <h3 className="text-lg font-bold mb-2">이의 제기 접수</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">수량 부족, 오염·하자, 오배송 등 문제가 있는 경우 접수하세요.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">이의 유형</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] bg-white">
                  <option>수량 부족</option><option>오염 / 하자</option><option>오배송</option><option>파손</option><option>기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">증빙 사진 첨부</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-[#C4956A]/40 cursor-pointer transition-colors">클릭하여 사진 첨부 (최대 5장)</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">상세 내용</label>
                <textarea rows={3} placeholder="문제 상황을 자세히 작성해 주세요." className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4956A] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDispute(false)} className="flex-1 border border-border py-2.5 rounded text-sm font-medium">취소</button>
              <button onClick={() => { setShowDispute(false); alert("이의 제기가 접수되었습니다."); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded text-sm font-semibold">접수하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}