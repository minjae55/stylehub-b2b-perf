import { type ReactNode, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  MapPin,
  Package,
  PenLine,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";

type OrderStatus =
  | "CONFIRMED"
  | "SAMPLE_PREPARING"
  | "SAMPLE_SHIPPED"
  | "SAMPLE_DELIVERED"
  | "SAMPLE_RENEGOTIATING"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "DISPUTE"
  | "REFUNDED";

type OrderType = "GENERAL" | "SAMPLE" | "SOURCING";

type OrderItem = {
  id: number;
  productId: number;
  productOptionId?: number;
  name: string;
  optionSummary: string;
  material: string;
  quantity: number;
  unitPrice: number;
  image: string;
};

type StatusLog = {
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  memo: string;
  changedBy: string;
  createdAt: string;
};

type Order = {
  id: string;
  orderNo: string;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  agreedAt?: string;
  buyerName: string;
  sellerName: string;
  contractNo?: string;
  quoteNo?: string;
  paymentMethod: string;
  paidAt: string;
  receiverName: string;
  receiverPhone: string;
  receiverZipcode: string;
  receiverAddress: string;
  receiverAddressDetail: string;
  receiverMemo?: string;
  senderName: string;
  senderPhone: string;
  carrier?: string;
  trackingNo?: string;
  subtotalAmount: number;
  platformFee: number;
  shippingFee: number | null;
  totalAmount: number;
  items: OrderItem[];
  logs: StatusLog[];
  issueMemo?: string;
};

const statusConfig: Record<OrderStatus, { label: string; tone: string; icon: ReactNode }> = {
  CONFIRMED: { label: "주문 확정", tone: "border-blue-200 bg-blue-50 text-blue-700", icon: <CheckCircle size={14} /> },
  SAMPLE_PREPARING: { label: "샘플 준비", tone: "border-amber-200 bg-amber-50 text-amber-700", icon: <FlaskConical size={14} /> },
  SAMPLE_SHIPPED: { label: "샘플 배송", tone: "border-amber-200 bg-amber-50 text-amber-700", icon: <Truck size={14} /> },
  SAMPLE_DELIVERED: { label: "샘플 수령", tone: "border-amber-200 bg-amber-50 text-amber-700", icon: <Package size={14} /> },
  SAMPLE_RENEGOTIATING: { label: "샘플 재협상", tone: "border-orange-200 bg-orange-50 text-orange-700", icon: <RotateCcw size={14} /> },
  PREPARING: { label: "출고 준비", tone: "border-sky-200 bg-sky-50 text-sky-700", icon: <Package size={14} /> },
  SHIPPED: { label: "배송 중", tone: "border-sky-200 bg-sky-50 text-sky-700", icon: <Truck size={14} /> },
  DELIVERED: { label: "배송 완료", tone: "border-green-200 bg-green-50 text-green-700", icon: <CheckCircle size={14} /> },
  COMPLETED: { label: "거래 완료", tone: "border-green-200 bg-green-50 text-green-700", icon: <CheckCircle size={14} /> },
  CANCELED: { label: "취소", tone: "border-slate-300 bg-slate-100 text-slate-600", icon: <XCircle size={14} /> },
  DISPUTE: { label: "이의 제기", tone: "border-rose-200 bg-rose-50 text-rose-700", icon: <AlertCircle size={14} /> },
  REFUNDED: { label: "환불 완료", tone: "border-slate-300 bg-slate-100 text-slate-600", icon: <RotateCcw size={14} /> },
};

const typeConfig: Record<OrderType, { label: string; tone: string }> = {
  GENERAL: { label: "일반 주문", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  SAMPLE: { label: "샘플 주문", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  SOURCING: { label: "소싱 주문", tone: "border-primary/25 bg-secondary text-primary" },
};

const orders: Record<string, Order> = {
  "ORD-2024-0841": {
    id: "ORD-2024-0841",
    orderNo: "ORD-2024-0841",
    orderType: "GENERAL",
    status: "SHIPPED",
    createdAt: "2024.05.18 11:22",
    buyerName: "스타일위크",
    sellerName: "르블랑",
    quoteNo: "QUO-2024-0033",
    paymentMethod: "법인카드",
    paidAt: "2024.05.18 14:22",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    receiverZipcode: "06234",
    receiverAddress: "서울특별시 강남구 테헤란로 123",
    receiverAddressDetail: "A동 5층",
    receiverMemo: "입고장 도착 시 연락 부탁드립니다.",
    senderName: "르블랑 물류팀",
    senderPhone: "02-1234-5678",
    carrier: "CJ대한통운",
    trackingNo: "598412873021",
    subtotalAmount: 1290000,
    platformFee: 64500,
    shippingFee: null,
    totalAmount: 1354500,
    items: [
      {
        id: 1,
        productId: 101,
        productOptionId: 1001,
        name: "여성 린넨 오버핏 블라우스",
        optionSummary: "아이보리 / S 10, M 30, L 20, XL 10",
        material: "린넨 혼방",
        quantity: 70,
        unitPrice: 12000,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4084?w=240&h=240&fit=crop",
      },
      {
        id: 2,
        productId: 102,
        productOptionId: 1002,
        name: "와이드 린넨 슬랙스",
        optionSummary: "베이지 / S 5, M 10, L 7, XL 3",
        material: "린넨 혼방",
        quantity: 25,
        unitPrice: 18000,
        image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "결제 완료로 주문이 확정되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.18 14:22" },
      { previousStatus: "CONFIRMED", newStatus: "PREPARING", memo: "셀러가 출고 준비를 시작했습니다.", changedBy: "SELLER", createdAt: "2024.05.19 09:15" },
      { previousStatus: "PREPARING", newStatus: "SHIPPED", memo: "송장번호가 등록되었습니다.", changedBy: "SELLER", createdAt: "2024.05.20 11:40" },
    ],
  },
  "ORD-2024-0855": {
    id: "ORD-2024-0855",
    orderNo: "ORD-2024-0855",
    orderType: "SAMPLE",
    status: "SAMPLE_DELIVERED",
    createdAt: "2024.05.16 09:00",
    buyerName: "스타일위크",
    sellerName: "데일리앤코",
    paymentMethod: "무통장 입금",
    paidAt: "2024.05.16 09:40",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    receiverZipcode: "06234",
    receiverAddress: "서울특별시 강남구 테헤란로 123",
    receiverAddressDetail: "A동 5층",
    senderName: "데일리앤코",
    senderPhone: "031-456-7890",
    carrier: "CJ대한통운",
    trackingNo: "112837465099",
    subtotalAmount: 1500000,
    platformFee: 75000,
    shippingFee: 3000,
    totalAmount: 1578000,
    items: [
      {
        id: 3,
        productId: 103,
        name: "오버사이즈 코튼 셔츠",
        optionSummary: "화이트 / 샘플 확인 후 본 주문",
        material: "코튼",
        quantity: 100,
        unitPrice: 15000,
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "샘플 주문 결제가 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.16 09:40" },
      { previousStatus: "CONFIRMED", newStatus: "SAMPLE_PREPARING", memo: "샘플 준비를 시작했습니다.", changedBy: "SELLER", createdAt: "2024.05.17 10:00" },
      { previousStatus: "SAMPLE_PREPARING", newStatus: "SAMPLE_SHIPPED", memo: "샘플이 발송되었습니다.", changedBy: "SELLER", createdAt: "2024.05.18 14:00" },
      { previousStatus: "SAMPLE_SHIPPED", newStatus: "SAMPLE_DELIVERED", memo: "샘플 배송이 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.19 11:30" },
    ],
  },
  "ORD-2024-0901": {
    id: "ORD-2024-0901",
    orderNo: "ORD-2024-0901",
    orderType: "SOURCING",
    status: "SAMPLE_RENEGOTIATING",
    createdAt: "2024.05.20 14:00",
    buyerName: "스타일위크",
    sellerName: "르블랑 어패럴",
    contractNo: "CTR-2024-0901",
    quoteNo: "QUO-2024-0110",
    paymentMethod: "샘플 결제",
    paidAt: "2024.05.20 14:05",
    receiverName: "김민지",
    receiverPhone: "010-9876-5432",
    receiverZipcode: "17084",
    receiverAddress: "경기도 용인시 기흥구 중부대로 456",
    receiverAddressDetail: "B동 입고장",
    senderName: "르블랑 어패럴",
    senderPhone: "02-1234-9999",
    carrier: "한진택배",
    trackingNo: "384729103847",
    subtotalAmount: 2800000,
    platformFee: 140000,
    shippingFee: null,
    totalAmount: 2940000,
    issueMemo: "블루그레이 컬러 톤이 너무 밝아 한 단계 진한 톤으로 재제작 요청했습니다.",
    items: [
      {
        id: 4,
        productId: 201,
        name: "여성 린넨 오버핏 블라우스 (주문제작)",
        optionSummary: "아이보리 / 블루그레이 / 피치, 총 200벌",
        material: "린넨 혼방",
        quantity: 200,
        unitPrice: 14000,
        image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "샘플 결제가 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.20 14:05" },
      { previousStatus: "CONFIRMED", newStatus: "SAMPLE_PREPARING", memo: "셀러가 샘플 제작을 시작했습니다.", changedBy: "SELLER", createdAt: "2024.05.21 09:00" },
      { previousStatus: "SAMPLE_PREPARING", newStatus: "SAMPLE_SHIPPED", memo: "샘플이 발송되었습니다.", changedBy: "SELLER", createdAt: "2024.05.23 11:00" },
      { previousStatus: "SAMPLE_SHIPPED", newStatus: "SAMPLE_DELIVERED", memo: "샘플 수령이 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.24 15:30" },
      { previousStatus: "SAMPLE_DELIVERED", newStatus: "SAMPLE_RENEGOTIATING", memo: "바이어가 샘플 수정 요청을 등록했습니다.", changedBy: "BUYER", createdAt: "2024.05.25 10:00" },
    ],
  },
  "ORD-2024-0807": {
    id: "ORD-2024-0807",
    orderNo: "ORD-2024-0807",
    orderType: "GENERAL",
    status: "COMPLETED",
    createdAt: "2024.05.02 11:00",
    agreedAt: "2024.05.07 10:00",
    buyerName: "스타일위크",
    sellerName: "데일리앤코",
    paymentMethod: "법인카드",
    paidAt: "2024.05.02 11:00",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    receiverZipcode: "06234",
    receiverAddress: "서울특별시 강남구 테헤란로 123",
    receiverAddressDetail: "A동 5층",
    senderName: "데일리앤코",
    senderPhone: "031-456-7890",
    carrier: "CJ대한통운",
    trackingNo: "293847102938",
    subtotalAmount: 648000,
    platformFee: 32400,
    shippingFee: 3000,
    totalAmount: 683400,
    items: [
      {
        id: 5,
        productId: 104,
        name: "여성 봄 니트 가디건",
        optionSummary: "머스타드 / 라이트그레이, FREE",
        material: "아크릴 니트",
        quantity: 40,
        unitPrice: 16200,
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "결제가 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.02 11:00" },
      { previousStatus: "CONFIRMED", newStatus: "PREPARING", memo: "출고 준비를 시작했습니다.", changedBy: "SELLER", createdAt: "2024.05.03 09:00" },
      { previousStatus: "PREPARING", newStatus: "SHIPPED", memo: "배송이 시작되었습니다.", changedBy: "SELLER", createdAt: "2024.05.04 10:30" },
      { previousStatus: "SHIPPED", newStatus: "DELIVERED", memo: "배송이 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.05.06 15:00" },
      { previousStatus: "DELIVERED", newStatus: "COMPLETED", memo: "바이어가 거래를 확정했습니다.", changedBy: "BUYER", createdAt: "2024.05.07 10:00" },
    ],
  },
  "ORD-2024-0780": {
    id: "ORD-2024-0780",
    orderNo: "ORD-2024-0780",
    orderType: "GENERAL",
    status: "DISPUTE",
    createdAt: "2024.04.15 10:00",
    buyerName: "스타일위크",
    sellerName: "라온어패럴",
    paymentMethod: "법인카드",
    paidAt: "2024.04.15 10:00",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    receiverZipcode: "06234",
    receiverAddress: "서울특별시 강남구 테헤란로 123",
    receiverAddressDetail: "A동 5층",
    senderName: "라온어패럴",
    senderPhone: "02-8765-4321",
    carrier: "롯데택배",
    trackingNo: "192837465019",
    subtotalAmount: 945000,
    platformFee: 47250,
    shippingFee: 3000,
    totalAmount: 995250,
    issueMemo: "수령한 상품 중 M 사이즈 10장에서 봉제 불량이 발견되었습니다.",
    items: [
      {
        id: 6,
        productId: 105,
        name: "여성 베이직 오버핏 셔츠",
        optionSummary: "화이트 / 블랙, S 10, M 20, L 15, XL 5",
        material: "코튼",
        quantity: 50,
        unitPrice: 18900,
        image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "결제가 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.04.15 10:00" },
      { previousStatus: "CONFIRMED", newStatus: "SHIPPED", memo: "배송이 시작되었습니다.", changedBy: "SELLER", createdAt: "2024.04.16 11:00" },
      { previousStatus: "SHIPPED", newStatus: "DELIVERED", memo: "배송이 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.04.18 16:00" },
      { previousStatus: "DELIVERED", newStatus: "DISPUTE", memo: "바이어가 불량 이의제기를 접수했습니다.", changedBy: "BUYER", createdAt: "2024.04.20 09:00" },
    ],
  },
  "ORD-2024-0791": {
    id: "ORD-2024-0791",
    orderNo: "ORD-2024-0791",
    orderType: "GENERAL",
    status: "CANCELED",
    createdAt: "2024.04.20 09:30",
    buyerName: "스타일위크",
    sellerName: "어반드레스",
    paymentMethod: "무통장 입금",
    paidAt: "2024.04.20 09:40",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    receiverZipcode: "06234",
    receiverAddress: "서울특별시 강남구 테헤란로 123",
    receiverAddressDetail: "A동 5층",
    senderName: "어반드레스",
    senderPhone: "02-2222-1111",
    subtotalAmount: 675000,
    platformFee: 33750,
    shippingFee: 0,
    totalAmount: 708750,
    issueMemo: "내부 예산 변경으로 주문을 취소했습니다.",
    items: [
      {
        id: 7,
        productId: 106,
        name: "플리츠 미디 스커트",
        optionSummary: "블랙 / 베이지, S 15, M 20, L 10",
        material: "폴리",
        quantity: 45,
        unitPrice: 15000,
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?w=240&h=240&fit=crop",
      },
    ],
    logs: [
      { newStatus: "CONFIRMED", memo: "결제가 완료되었습니다.", changedBy: "SYSTEM", createdAt: "2024.04.20 09:40" },
      { previousStatus: "CONFIRMED", newStatus: "CANCELED", memo: "바이어 요청으로 주문이 취소되었습니다.", changedBy: "BUYER", createdAt: "2024.04.21 13:20" },
    ],
  },
};

const CARRIER_TRACKING: Record<string, (no: string) => string> = {
  CJ대한통운: (no) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${no}`,
  한진택배: (no) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
  롯데택배: (no) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${no}`,
};

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function getTrackingUrl(carrier: string | undefined, trackingNo: string) {
  if (!carrier || !CARRIER_TRACKING[carrier]) return CARRIER_TRACKING.CJ대한통운(trackingNo);
  return CARRIER_TRACKING[carrier](trackingNo);
}

function getNextAction(order: Order) {
  switch (order.status) {
    case "SAMPLE_DELIVERED":
      return "샘플 확인 후 본 주문 진행 여부를 결정하세요.";
    case "SAMPLE_RENEGOTIATING":
      return "셀러가 샘플 수정 요청을 검토 중입니다.";
    case "SHIPPED":
      return "배송 추적 후 수령 상태를 확인하세요.";
    case "DELIVERED":
      return "상품 확인 후 거래 확정 또는 이의제기를 진행하세요.";
    case "DISPUTE":
      return "관리자 중재 및 셀러 답변을 기다리는 중입니다.";
    case "CANCELED":
      return "취소 처리된 주문입니다.";
    case "COMPLETED":
      return "거래가 완료되어 정산 대상이 되었습니다.";
    default:
      return "셀러의 다음 처리를 기다리는 중입니다.";
  }
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = id ? orders[id] : undefined;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDispute, setShowDispute] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center">
        <Package size={44} className="mx-auto mb-4 text-slate-300" />
        <h1 className="text-xl font-black text-slate-950">주문을 찾을 수 없습니다</h1>
        <Link to="/orders" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">
          주문 목록으로
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const type = typeConfig[order.orderType];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1240px]">
        <Link to="/orders" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary">
          <ArrowLeft size={16} />
          주문 목록으로 돌아가기
        </Link>

        <header className="mb-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className={type.tone}>{type.label}</Badge>
              <Badge className={status.tone}>{status.icon}{status.label}</Badge>
              {order.contractNo && <Badge className="border-primary/25 bg-secondary text-primary">{order.contractNo}</Badge>}
              {order.quoteNo && <Badge className="border-slate-200 bg-slate-50 text-slate-600">{order.quoteNo}</Badge>}
            </div>
            <h1 className="font-mono text-2xl font-black text-slate-950">{order.orderNo}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {order.buyerName}와 {order.sellerName} 사이의 주문 상세 정보입니다.
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <main className="contents">
            <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:order-1 lg:col-start-1">
              <SectionTitle icon={<Package size={16} />} title="주문 상품" />
              <div className="space-y-5">
                {order.items.map((item) => (
                  <div key={item.id} className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-[88px_minmax(0,1fr)_160px] md:items-center">
                    <img src={item.image} alt={item.name} className="h-22 w-22 h-[88px] w-[88px] rounded-lg border border-slate-100 object-cover" />
                    <div className="min-w-0">
                      <p className="text-base font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.optionSummary}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">product_id {item.productId}</span>
                        {item.productOptionId && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                            option_id {item.productOptionId}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">{item.material}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-500">
                        {item.quantity.toLocaleString()}개 x {formatPrice(item.unitPrice)}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-lg font-black text-slate-950">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:order-3 lg:col-start-1">
              <SectionTitle icon={<Truck size={16} />} title="상태 이력" />
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
                <div className="space-y-4">
                  {order.logs.map((log, index) => {
                    const logStatus = statusConfig[log.newStatus];
                    return (
                      <div key={`${log.createdAt}-${index}`} className="relative flex gap-4">
                        <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${logStatus.tone}`}>
                          {logStatus.icon}
                        </span>
                        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-black text-slate-950">{logStatus.label}</p>
                            <p className="font-mono text-xs text-slate-500">{log.createdAt}</p>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{log.memo}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">changed_by: {log.changedBy}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {order.issueMemo && (
              <section className={`rounded-xl border p-5 shadow-sm lg:order-5 lg:col-span-2 ${order.status === "DISPUTE" ? "border-rose-200 bg-rose-50" : "border-orange-200 bg-orange-50"}`}>
                <SectionTitle icon={<AlertCircle size={16} />} title={order.status === "DISPUTE" ? "이의제기 내용" : "처리 메모"} />
                <p className={`text-sm font-semibold leading-6 ${order.status === "DISPUTE" ? "text-rose-800" : "text-orange-800"}`}>
                  {order.issueMemo}
                </p>
              </section>
            )}
          </main>

          <aside className="contents">
            <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:order-2 lg:col-start-2">
              <SectionTitle icon={<ReceiptText size={16} />} title="결제 요약" />
              <div className="space-y-3 text-sm">
                <SummaryRow label="상품 금액" value={formatPrice(order.subtotalAmount)} />
                <SummaryRow label="국내 배송비" value={order.shippingFee === null ? "착불" : formatPrice(order.shippingFee)} />
                <SummaryRow label="플랫폼 이용 수수료" value={formatPrice(order.platformFee)} />
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow label="최종 결제 금액" value={formatPrice(order.totalAmount)} strong />
                </div>
                <SummaryRow label="결제 방식" value={order.paymentMethod} />
                <SummaryRow label="결제 일시" value={order.paidAt} />
              </div>
              <div className="mt-4 rounded-lg border border-primary/15 bg-secondary/60 px-3 py-3 text-xs leading-5 text-slate-600">
                결제 대금은 거래 확정 전까지 안전하게 보관되며, 완료 후 셀러 정산 대상으로 전환됩니다.
              </div>
              <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-primary/30 hover:text-primary">
                <Download size={14} />
                주문 내역서 PDF
              </button>
            </section>

            <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:order-4 lg:col-start-2">
              <SectionTitle icon={<MapPin size={16} />} title="배송 정보" />
              <div className="space-y-3 text-sm">
                <SummaryRow label="수령인" value={`${order.receiverName} / ${order.receiverPhone}`} />
                <SummaryRow label="우편번호" value={order.receiverZipcode} />
                <InfoBlock label="배송지" value={`${order.receiverAddress} ${order.receiverAddressDetail}`} />
                {order.receiverMemo && <InfoBlock label="배송 요청사항" value={order.receiverMemo} />}
                <SummaryRow label="발송인" value={`${order.senderName} / ${order.senderPhone}`} />
                {order.trackingNo && (
                  <>
                    <SummaryRow label="택배사" value={order.carrier ?? "-"} />
                    <SummaryRow label="송장번호" value={order.trackingNo} />
                    <a
                      href={getTrackingUrl(order.carrier, order.trackingNo)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary"
                    >
                      <ExternalLink size={14} />
                      배송 추적
                    </a>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>

        {showConfirm && (
          <ConfirmModal
            title="거래를 확정하시겠습니까?"
            description="상품 수량과 하자 여부를 확인한 뒤 거래를 확정해 주세요. 확정 후 셀러 정산이 진행됩니다."
            confirmLabel="거래 확정"
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              setShowConfirm(false);
              alert("거래가 확정되었습니다.");
            }}
          />
        )}

        {showDispute && (
          <DisputeModal
            onClose={() => setShowDispute(false)}
            onSubmit={() => {
              setShowDispute(false);
              alert("요청이 접수되었습니다.");
            }}
          />
        )}
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? "text-lg font-black text-primary" : "font-semibold text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900">
          <X size={20} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle size={26} />
        </div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">
            취소
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900">
          <X size={20} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle size={26} />
        </div>
        <h3 className="text-lg font-black text-slate-950">이의제기 접수</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">문제 유형과 요청 처리 방식을 선택하고 증빙 파일을 첨부합니다.</p>
        <div className="mt-4 space-y-3">
          <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
            <option>불량</option>
            <option>오배송</option>
            <option>수량 부족</option>
            <option>배송 문제</option>
            <option>기타</option>
          </select>
          <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
            <option>교환 요청</option>
            <option>환불 요청</option>
            <option>부분 환불 요청</option>
            <option>기타</option>
          </select>
          <textarea
            rows={4}
            placeholder="이의제기 내용을 입력하세요."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-500">
            증빙 파일 첨부
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">
            취소
          </button>
          <button onClick={onSubmit} className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-bold text-white">
            접수하기
          </button>
        </div>
      </div>
    </div>
  );
}
