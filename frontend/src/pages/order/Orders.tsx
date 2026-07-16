import {type ReactNode, useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router";
import api from "@/api/axios";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  Package,
  PackageCheck,
  PenLine,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_PREPARING"
  | "SAMPLE_SHIPPED"
  | "SAMPLE_DELIVERED"
  | "SAMPLE_RENEGOTIATING"
  | "CONTRACT_SIGNING"
  | "CONTRACT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "DISPUTE"
  | "REFUNDED";

type OrderType = "GENERAL" | "SAMPLE" | "SOURCING";
type ApiOrderType = "NORMAL" | "READY" | "CUSTOM";

type BuyerOrderListResponse = {
  orderId: number;
  orderNo: string;
  orderType: ApiOrderType;
  orderStatus: OrderStatus;
  isSample: boolean;
  totalAmount: number;
  representativeProductName: string;
  itemCount: number;
  totalQuantity: number;
  createdAt: string;
  canceledAt: string | null;
  canceledReason: string | null;
  quoteId: number | null;
};

type BuyerOrderItemResponse = {
  orderItemId: number;
  productName: string;
  optionSummary: string | null;
  quantity: number;
  unitPrice: number;
  additionalPrice: number;
  totalPrice: number;
};

type BuyerOrderSummaryResponse = {
  subtotalAmount: number;
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
  paymentMethod: string | null;
  receiverName: string | null;
  receiverAddress: string | null;
  receiverAddressDetail: string | null;
};

type BuyerOrderLogResponse = {
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  memo: string;
  changedBy: string;
  createdAt: string;
};

type BuyerOrderOverviewResponse = {
  items: BuyerOrderItemResponse[];
  amountSummary: BuyerOrderSummaryResponse;
  orderStatus: OrderStatus;
  logs: BuyerOrderLogResponse[];
  quoteId: number | null;
};
type StepKey =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_PREPARING"
  | "SAMPLE_SHIPPED"
  | "SAMPLE_DELIVERED"
  | "SAMPLE_RENEGOTIATING"
  | "CONTRACT_SIGNING"
  | "CONTRACT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED";

type OrderItem = {
  orderItemId?: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  material: string;
};

type Order = {
  orderId?: number;
  id: string;
  date: string;
  supplier: string;
  buyer: string;
  type: OrderType;
  items: OrderItem[];
  itemCount?: number;
  totalQuantity?: number;
  status: OrderStatus;
  subtotal: number;
  platformFee: number;
  shippingFee: number | null;
  trackingNo: string | null;
  carrier?: string;
  contractNo?: string;
  contractSignedAt?: string;
  paymentMethod: string;
  receiverName: string;
  receiverAddress: string;
  receiverAddressDetail: string | null;
  isExample?: boolean;
  stepTimestamps?: Partial<Record<StepKey, string>>;
  issueMemo?: string;
  quoteId?: number | null;
};

const STEP_LABELS: Record<StepKey, string> = {
  PENDING: "결제 대기",
  CONFIRMED: "주문 확정",
  SAMPLE_PREPARING: "샘플 준비",
  SAMPLE_SHIPPED: "샘플 발송",
  SAMPLE_DELIVERED: "샘플 수령",
  SAMPLE_RENEGOTIATING: "샘플 재협상",
  CONTRACT_SIGNING: "계약 서명",
  CONTRACT_CONFIRMED: "계약 완료",
  PREPARING: "출고 준비",
  SHIPPED: "배송 시작",
  DELIVERED: "배송 완료",
};

const GENERAL_STEPS: StepKey[] = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];
const SAMPLE_STEPS: StepKey[] = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_PREPARING",
  "SAMPLE_SHIPPED",
  "SAMPLE_DELIVERED",
];
const SOURCING_STEPS: StepKey[] = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_PREPARING",
  "SAMPLE_SHIPPED",
  "SAMPLE_DELIVERED",
  "CONTRACT_SIGNING",
  "CONTRACT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

const statusConfig: Record<
  OrderStatus,
  { label: string; tone: string; icon: ReactNode; group: "progress" | "sample" | "contract" | "done" | "issue" }
> = {
  PENDING: {
    label: "결제 대기",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    icon: <Clock size={13} />,
    group: "progress",
  },
  CONFIRMED: {
    label: "주문 확정",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <CheckCircle size={13} />,
    group: "progress",
  },
  SAMPLE_PREPARING: {
    label: "샘플 준비",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <FlaskConical size={13} />,
    group: "sample",
  },
  SAMPLE_SHIPPED: {
    label: "샘플 배송",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Truck size={13} />,
    group: "sample",
  },
  SAMPLE_DELIVERED: {
    label: "샘플 수령",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Package size={13} />,
    group: "sample",
  },
  SAMPLE_RENEGOTIATING: {
    label: "샘플 재협상",
    tone: "border-orange-200 bg-orange-50 text-orange-700",
    icon: <RefreshCw size={13} />,
    group: "sample",
  },
  CONTRACT_SIGNING: {
    label: "계약 서명",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <PenLine size={13} />,
    group: "contract",
  },
  CONTRACT_CONFIRMED: {
    label: "계약 완료",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <ShieldCheck size={13} />,
    group: "contract",
  },
  PREPARING: {
    label: "출고 준비",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
    icon: <Package size={13} />,
    group: "progress",
  },
  SHIPPED: {
    label: "배송 중",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
    icon: <Truck size={13} />,
    group: "progress",
  },
  DELIVERED: {
    label: "배송 완료",
    tone: "border-green-200 bg-green-50 text-green-700",
    icon: <CheckCircle size={13} />,
    group: "done",
  },
  COMPLETED: {
    label: "거래 완료",
    tone: "border-green-200 bg-green-50 text-green-700",
    icon: <CheckCircle size={13} />,
    group: "done",
  },
  CANCELED: {
    label: "취소된 주문",
    tone: "border-slate-300 bg-slate-100 text-slate-600",
    icon: <XCircle size={13} />,
    group: "issue",
  },
  DISPUTE: {
    label: "이의 제기",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    icon: <AlertCircle size={13} />,
    group: "issue",
  },
  REFUNDED: {
    label: "환불 완료",
    tone: "border-slate-200 bg-slate-100 text-slate-600",
    icon: <RotateCcw size={13} />,
    group: "issue",
  },
};

const typeConfig: Record<OrderType, { label: string; tone: string }> = {
  GENERAL: { label: "일반 주문", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  SAMPLE: { label: "샘플 주문", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  SOURCING: { label: "소싱 주문", tone: "border-blue-200 bg-blue-50 text-blue-700" },
};

const exampleOrders: Order[] = [
  {
    id: "ORD-EXAMPLE-001",
    date: "2026.06.23",
    supplier: "예시 판매사",
    buyer: "예시 바이어",
    type: "GENERAL",
    items: [
      {
        name: "예시 여성 린넨 셔츠",
        quantity: 20,
        unit: "장",
        price: 15000,
        material: "린넨 혼방",
      },
    ],
    status: "PREPARING",
    subtotal: 300000,
    platformFee: 15000,
    shippingFee: 3000,
    trackingNo: null,
    paymentMethod: "법인카드",
    receiverName: "예시 수령인",
    receiverAddress: "서울특별시 강남구 예시로 123",
    receiverAddressDetail: null,
    isExample: true,
    stepTimestamps: {
      CONFIRMED: "2026.06.23 10:00",
      PREPARING: "2026.06.23 13:30",
    },
  },
];

function formatOrderDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  return date
    .toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\. /g, ".")
    .replace(".", ".");
}

function mapOrderType(orderType: ApiOrderType, isSample: boolean): OrderType {
  if (isSample) return "SAMPLE";
  if (orderType === "CUSTOM") return "SOURCING";
  return "GENERAL";
}

function mapOrderResponse(order: BuyerOrderListResponse): Order {
  const type = mapOrderType(order.orderType, order.isSample);

  return {
    orderId: order.orderId,
    id: order.orderNo,
    date: formatOrderDate(order.createdAt),
    supplier: "판매사 정보 확인 중",
    buyer: "내 주문",
    type,
    items: [
      {
        name: order.representativeProductName,
        quantity: order.totalQuantity,
        unit: "개",
        price: order.totalAmount ?? 0,
        material: "-",
      },
    ],
    itemCount: order.itemCount,
    totalQuantity: order.totalQuantity,
    status: resolveDisplayOrderStatus(type, order.orderStatus),
    subtotal: order.totalAmount ?? 0,
    platformFee: 0,
    shippingFee: 0,
    trackingNo: null,
    paymentMethod: "결제 정보 확인 중",
    receiverName: "상세 화면에서 확인",
    receiverAddress: "상세 화면에서 확인",
    receiverAddressDetail: null,
    issueMemo: order.canceledReason ?? undefined,
    quoteId: order.quoteId,
  };
}

function applyOrderOverview(order: Order, overview: BuyerOrderOverviewResponse): Order {
  const summary = overview.amountSummary;

  return {
    ...order,
items: overview.items.map((item) => ({
  orderItemId: item.orderItemId,
  name: item.productName,
  quantity: item.quantity,
  unit: "개",
  price: item.unitPrice + item.additionalPrice,
  material: item.optionSummary ?? "-",
})),
    itemCount: overview.items.length,
    totalQuantity: overview.items.reduce((total, item) => total + item.quantity, 0),
    status: resolveDisplayOrderStatus(order.type, overview.orderStatus),
    subtotal: summary.subtotalAmount,
    platformFee: summary.platformFee,
    shippingFee: summary.shippingFee,
    paymentMethod: summary.paymentMethod ?? "결제 정보 없음",
    receiverName: summary.receiverName ?? "수령인 정보 없음",
    receiverAddress: summary.receiverAddress ?? "배송지 정보 없음",
    receiverAddressDetail: summary.receiverAddressDetail,
    stepTimestamps: buildStepTimestamps(order.type, overview.logs ?? []),
    quoteId: overview.quoteId,
  };
}

const searchOptions = [
  { value: "product", label: "제품명" },
  { value: "quantity", label: "수량" },
  { value: "brand", label: "브랜드" },
  { value: "material", label: "소재" },
] as const;

type SearchType = (typeof searchOptions)[number]["value"];

const CARRIER_TRACKING: Record<string, (no: string) => string> = {
  CJ대한통운: (no) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${no}`,
  한진택배: (no) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
  롯데택배: (no) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${no}`,
};

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function getOrderTotal(order: Order) {
  return order.subtotal + (order.shippingFee ?? 0);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CORP_CARD: "법인카드",
  TRANSFER: "무통장 입금",
};

function getPaymentMethodLabel(paymentMethod: string) {
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
}

function getTotalQuantity(order: Order) {
  return order.totalQuantity ?? order.items.reduce((total, item) => total + item.quantity, 0);
}

function getItemCount(order: Order) {
  return order.itemCount ?? order.items.length;
}

function getMainItemLabel(order: Order) {
  const itemCount = getItemCount(order);
  return itemCount > 1 ? `${order.items[0].name} 외 ${itemCount - 1}건` : order.items[0].name;
}

function getTrackingUrl(carrier: string | undefined, trackingNo: string) {
  if (!carrier || !CARRIER_TRACKING[carrier]) return CARRIER_TRACKING.CJ대한통운(trackingNo);
  return CARRIER_TRACKING[carrier](trackingNo);
}

// 백엔드 order.status는 항상 공통 값
// (PENDING/CONFIRMED/PREPARING/SHIPPED/DELIVERED/COMPLETED/DISPUTE/CANCELED/REFUNDED)만 내려온다.
// SAMPLE_PREPARING 같은 유형별 스텝 이름은 화면 표시용일 뿐 order.status로 그대로 내려오지 않으므로,
// 주문 유형(order.type)에 맞춰 실제 상태값을 화면 스텝으로 "치환"해야 완료 여부가 반영된다.
const STATUS_STEP_ALIAS: Partial<Record<OrderType, Partial<Record<OrderStatus, StepKey>>>> = {
  SAMPLE: {
    PREPARING: "SAMPLE_PREPARING",
    SHIPPED: "SAMPLE_SHIPPED",
    DELIVERED: "SAMPLE_DELIVERED",
  },
};

// 완료/예외 상태로 끝난 주문은 그 시점까지의 스텝을 어디까지 완료로 볼지 결정
const TERMINAL_REACHED_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  COMPLETED: "DELIVERED",
  DISPUTE: "DELIVERED",
  REFUNDED: "CONFIRMED",
  CANCELED: "PENDING",
};

function getTimelineSequence(type: OrderType): StepKey[] {
  return type === "SOURCING" ? SOURCING_STEPS : type === "SAMPLE" ? SAMPLE_STEPS : GENERAL_STEPS;
}

// 주문 유형(type) 기준으로, 실제 백엔드 상태값(status)이 화면 타임라인의 어느 스텝에 해당하는지 계산.
// stepTimestamps를 만들 때(로그 1건 단위)와 완료 여부를 계산할 때(현재 상태 1건) 공통으로 사용한다.
function resolveStepKeyForStatus(type: OrderType, status: OrderStatus): StepKey | null {
  const sequence = getTimelineSequence(type);
  const alias = STATUS_STEP_ALIAS[type]?.[status];
  if (alias) return alias;
  return sequence.includes(status as StepKey) ? (status as StepKey) : null;
}

// 화면 곳곳(액션 버튼, 다음 행동 안내, 배너 등)의 분기가 SAMPLE_DELIVERED 같은
// 유형별 상태 이름을 기준으로 짜여 있는데, 백엔드는 그 이름을 절대 내려주지 않는다
// (샘플 주문도 실제로는 그냥 DELIVERED로 옴). 그래서 매핑 시점에 한 번 치환해두면
// 아래에서 SAMPLE_DELIVERED를 참조하는 모든 분기가 실제로 동작하게 된다.
function resolveDisplayOrderStatus(type: OrderType, rawStatus: OrderStatus): OrderStatus {
  return STATUS_STEP_ALIAS[type]?.[rawStatus] ?? rawStatus;
}

function buildStepTimestamps(
  type: OrderType,
  logs: BuyerOrderLogResponse[]
): Partial<Record<StepKey, string>> {
  const timestamps: Partial<Record<StepKey, string>> = {};

  logs.forEach((log) => {
    const key = resolveStepKeyForStatus(type, log.newStatus);
    if (key) {
      timestamps[key] = formatOrderDate(log.createdAt);
    }
  });

  return timestamps;
}

function buildTimeline(order: Order) {
  let sequence = getTimelineSequence(order.type);

  if (order.status === "SAMPLE_RENEGOTIATING" && !sequence.includes("SAMPLE_RENEGOTIATING")) {
    const index = sequence.indexOf("SAMPLE_DELIVERED");
    sequence = [...sequence.slice(0, index + 1), "SAMPLE_RENEGOTIATING", ...sequence.slice(index + 1)];
  }

  // SOURCING 주문은 계약 체결 후에야 새로 생성되는 별도의 주문 건이라,
  // 이 주문이 존재한다는 것 자체가 샘플~계약 단계는 이미 끝났다는 뜻이다.
  const alwaysDone = new Set<StepKey>(
    order.type === "SOURCING"
      ? ["SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED"]
      : []
  );

  const milestoneStatus = TERMINAL_REACHED_STATUS[order.status] ?? order.status;
  const effectiveKey = resolveStepKeyForStatus(order.type, milestoneStatus);
  const reachedIndex = effectiveKey ? sequence.indexOf(effectiveKey) : -1;

  return sequence.map((key, index) => ({
    key,
    label: STEP_LABELS[key],
    done: alwaysDone.has(key) || index <= reachedIndex,
    time: order.stepTimestamps?.[key] ?? "대기 중",
  }));
}

function getNextAction(order: Order) {
  switch (order.status) {
    case "PENDING":
      return "결제 완료 후 주문이 확정됩니다";
    case "CONFIRMED":
      return "셀러가 주문을 확인하고 출고 준비를 시작합니다";
    case "PREPARING":
      return "셀러가 상품 출고를 준비 중입니다";
    case "SAMPLE_DELIVERED":
      return "샘플 확인 후 본생산 확정, 재협상, 취소 중 선택";
    case "SAMPLE_RENEGOTIATING":
      return "셀러가 수정 요청을 검토 중입니다";
    case "CONTRACT_SIGNING":
      return "계약서 서명이 필요합니다";
    case "CONTRACT_CONFIRMED":
      return "계약 완료 후 결제를 진행할 수 있습니다";
    case "SHIPPED":
      return "배송 추적 후 수령을 확인하세요";
    case "DELIVERED":
      return "상품 확인 후 거래 확정 및 이의제기를 할 수 있습니다. ";
    case "DISPUTE":
      return "관리자 중재 및 셀러 답변을 기다리는 중입니다";
    case "CANCELED":
      return "취소 처리된 주문입니다";
    case "COMPLETED":
      return "거래가 완료되었습니다";
    case "REFUNDED":
      return "환불 처리가 완료되었습니다";
    default:
      return "셀러의 다음 처리를 기다리는 중입니다";
  }
}

function needsBuyerAction(order: Order) {
  return ["PENDING", "SAMPLE_DELIVERED", "CONTRACT_SIGNING", "CONTRACT_CONFIRMED", "DELIVERED"].includes(order.status);
}

function getPassiveNotice(order: Order) {
  switch (order.status) {
    case "CONFIRMED":
      return "주문 확정";
    case "PREPARING":
      return "출고 준비 중";
    case "SAMPLE_RENEGOTIATING":
      return "셀러 검토 대기";
    case "SHIPPED":
      return "배송 진행 중";
    case "DISPUTE":
      return "이의제기 처리 중";
    case "COMPLETED":
      return "거래 완료";
    case "CANCELED":
      return "취소 처리된 주문입니다";
    case "REFUNDED":
      return "환불 완료";
    default:
      return "";
  }
}

// 샘플 주문은 resolveDisplayOrderStatus에서 실제 상태(SHIPPED/DELIVERED)를
// SAMPLE_SHIPPED/SAMPLE_DELIVERED로 바꿔서 쓰기 때문에, "배송 중"/"배송 완료" 탭도
// 그 별칭까지 같이 봐야 한다. 이걸 빼먹으면 배송이 시작되거나 끝난 샘플 주문이
// 영영 "진행 중" 탭에만 머물러서 탭과 실제 진행 상태가 어긋나 보인다.
// (CONTRACT_SIGNING/CONTRACT_CONFIRMED/SAMPLE_RENEGOTIATING는 현재 STATUS_STEP_ALIAS에
// 대응 항목이 없어 order.status가 실제로 이 값이 되는 경우가 없다 — 죽은 분기라 제거)
function matchesFilter(order: Order, filter: string) {
  if (filter === "ALL") return true;
  if (filter === "PROGRESS") {
    return ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "PREPARING"].includes(order.status);
  }
  if (filter === "SHIPPING") return order.status === "SHIPPED" || order.status === "SAMPLE_SHIPPED";
  if (filter === "DELIVERED") return order.status === "DELIVERED" || order.status === "SAMPLE_DELIVERED";
  if (filter === "DONE") return order.status === "COMPLETED";
  if (filter === "ISSUE") return ["DISPUTE", "CANCELED", "REFUNDED"].includes(order.status);
  return true;
}

export function Orders({ role = "BUYER" }: { role?: "BUYER" | "SELLER" }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOrderDemo = import.meta.env.DEV && searchParams.get("demo") === "orders";
  const [orders, setOrders] = useState<Order[]>(isOrderDemo ? exampleOrders : []);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingOverviewId, setLoadingOverviewId] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  // 탭(필터)을 URL 쿼리(?tab=)에도 반영해서, 상세보기 등 다른 페이지에 갔다가 뒤로가기로
  // 돌아왔을 때도 보고 있던 탭이 그대로 유지되게 한다.
  const [activeFilter, setActiveFilterState] = useState(
    () => searchParams.get("tab") ?? "PROGRESS"
  );
  const setActiveFilter = (filter: string) => {
    setActiveFilterState(filter);
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("tab", filter);
        return next;
      },
      { replace: true }
    );
  };
  const [searchType, setSearchType] = useState<SearchType>("product");
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Order | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<Order | null>(null);
  const [disputeType, setDisputeType] = useState("PRODUCT_DEFECT");
  const [requestedAction, setRequestedAction] = useState("EXCHANGE");
  const [disputeClaim, setDisputeClaim] = useState("");
  const [disputeItemId, setDisputeItemId] = useState<number | null>(null);
  const [claimQuantity, setClaimQuantity] = useState(1);
  const [claimReason, setClaimReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [renegotiateTarget, setRenegotiateTarget] = useState<Order | null>(null);
  const [renegotiateText, setRenegotiateText] = useState("");
  const [renegotiateType, setRenegotiateType] = useState("색상 수정");
  const [isSubmittingRenegotiate, setIsSubmittingRenegotiate] = useState(false);
  const [renegotiateError, setRenegotiateError] = useState("");
  const [selectedPaymentOrderIds, setSelectedPaymentOrderIds] = useState<number[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [isConfirmingTrade, setIsConfirmingTrade] = useState(false);
  const [confirmTradeError, setConfirmTradeError] = useState("");
  const [pageNotice, setPageNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

const handleCancelOrder = async () => {
  if (!cancelTarget?.orderId || !cancelReason.trim() || isCanceling) {
    return;
  }

  try {
    setIsCanceling(true);
    setCancelError("");

    await api.post(`/buyer/orders/${cancelTarget.orderId}/cancel`, {
      reason: cancelReason.trim(),
    });

    setOrders((previous) =>
      previous.map((order) =>
        order.orderId === cancelTarget.orderId
          ? {
              ...order,
              status: "CANCELED",
              issueMemo: cancelReason.trim(),
            }
          : order
      )
    );

    setSelectedPaymentOrderIds((previous) =>
      previous.filter((orderId) => orderId !== cancelTarget.orderId)
    );

    setActiveFilter("ISSUE");
    setCancelTarget(null);
    setCancelReason("");
  } catch (error) {
    console.error("주문 취소 실패", error);
    setCancelError("주문을 취소하지 못했습니다.");
  } finally {
    setIsCanceling(false);
  }
};

  useEffect(() => {
    const loadOrders = async () => {
      if (isOrderDemo) {
        setOrders(exampleOrders);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await api.get<BuyerOrderListResponse[]>("/buyer/orders");
        const orderResponses = Array.isArray(response) ? response : [];
        const nextOrders = orderResponses.map(mapOrderResponse);

        if (!Array.isArray(response)) {
          setLoadError("주문 목록 응답 형식이 올바르지 않습니다.");
        }

        setOrders(nextOrders);
        setExpandedId(null);
        setSelectedPaymentOrderIds([]);
      } catch (error) {
        console.error("주문 목록 조회 실패", error);
        setLoadError("주문 목록을 불러오지 못했습니다.");
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isOrderDemo]);

  const handleToggleOrder = async (order: Order) => {
    const nextExpandedId = expandedId === order.id ? null : order.id;
    setExpandedId(nextExpandedId);
    setOverviewError(null);

    if (!nextExpandedId || !order.orderId || order.isExample) {
      return;
    }

    try {
      setLoadingOverviewId(order.id);
      const overview = await api.get<BuyerOrderOverviewResponse>(`/buyer/orders/${order.orderId}`);

      setOrders((previous) =>
        previous.map((current) =>
          current.id === order.id ? applyOrderOverview(current, overview) : current
        )
      );
    } catch (error) {
      console.error("주문 상세 요약 조회 실패", error);
      setOverviewError("주문 상품 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingOverviewId(null);
    }
  };

const handleOpenDispute = async (order: Order) => {
  if (!order.orderId || order.isExample) {
    return;
  }

  try {
    setLoadingOverviewId(order.id);
    setOverviewError(null);

    const overview =
      await api.get<BuyerOrderOverviewResponse>(
        `/buyer/orders/${order.orderId}`
      );

    const detailedOrder =
      applyOrderOverview(order, overview);

    // 목록에도 상세 상품 정보를 반영한다.
    setOrders((previous) =>
      previous.map((current) =>
        current.id === order.id
          ? detailedOrder
          : current
      )
    );

    const firstOrderItem = detailedOrder.items.find(
      (item) => item.orderItemId !== undefined
    );

    setDisputeItemId(firstOrderItem?.orderItemId ?? null);
    setClaimQuantity(1);
    setClaimReason("");
    setDisputeClaim("");
    setDisputeError("");
    setDisputeTarget(detailedOrder);
  } catch (error) {
    console.error("이의제기 주문 상품 조회 실패", error);
    setOverviewError(
      "이의제기할 주문 상품을 불러오지 못했습니다."
    );
  } finally {
    setLoadingOverviewId(null);
  }
};

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const filterMatched = matchesFilter(order, activeFilter);
      const keywordMatched = !keyword || order.items.some((item) => {
        if (searchType === "product") return item.name.toLowerCase().includes(keyword);
        if (searchType === "quantity") return String(item.quantity).includes(keyword);
        if (searchType === "brand") return order.supplier.toLowerCase().includes(keyword);
        return item.material.toLowerCase().includes(keyword);
      });

      return filterMatched && keywordMatched;
    });
  }, [activeFilter, orders, search, searchType]);
  const payableOrders = filteredOrders.filter(
    (order): order is Order & { orderId: number } =>
      order.status === "PENDING" && order.orderId !== undefined && !order.isExample
  );
  const selectedPaymentOrders = orders.filter(
    (order) => order.orderId !== undefined && selectedPaymentOrderIds.includes(order.orderId)
  );
  const allPayableSelected =
    payableOrders.length > 0
    && payableOrders.every((order) => selectedPaymentOrderIds.includes(order.orderId));
  const selectedPaymentTotal = selectedPaymentOrders.reduce(
    (total, order) => total + getOrderTotal(order),
    0
  );

  const togglePaymentOrder = (orderId: number) => {
    setSelectedPaymentOrderIds((previous) =>
      previous.includes(orderId)
        ? previous.filter((selectedId) => selectedId !== orderId)
        : [...previous, orderId]
    );
  };

  const toggleAllPayableOrders = () => {
    const payableOrderIds = payableOrders.map((order) => order.orderId);
    setSelectedPaymentOrderIds((previous) =>
      allPayableSelected
        ? previous.filter((orderId) => !payableOrderIds.includes(orderId))
        : [...new Set([...previous, ...payableOrderIds])]
    );
  };

  const handleSelectedOrdersCheckout = () => {
    if (selectedPaymentOrderIds.length === 0) return;
    navigate(`/checkout?orderIds=${selectedPaymentOrderIds.join(",")}`);
  };

  const stats = useMemo(() => {
    // matchesFilter와 동일한 기준으로 집계해야 탭 배지 숫자와 실제 탭 목록이 일치한다.
    const inProgress = orders.filter((order) =>
      ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "PREPARING"].includes(order.status)
    ).length;
    const shipping = orders.filter((order) => order.status === "SHIPPED" || order.status === "SAMPLE_SHIPPED").length;
    const delivered = orders.filter((order) => order.status === "DELIVERED" || order.status === "SAMPLE_DELIVERED").length;
    const done = orders.filter((order) => order.status === "COMPLETED").length;
    const issues = orders.filter((order) => ["DISPUTE", "CANCELED", "REFUNDED"].includes(order.status)).length;

    return [
      { filter: "ALL", label: "전체 주문", value: `${orders.length}건`, icon: <ReceiptText size={18} />, tone: "bg-blue-50 text-blue-700" },
      { filter: "PROGRESS", label: "진행 중", value: `${inProgress}건`, icon: <Truck size={18} />, tone: "bg-sky-50 text-sky-700" },
      { filter: "SHIPPING", label: "배송 중", value: `${shipping}건`, icon: <Package size={18} />, tone: "bg-amber-50 text-amber-700" },
      { filter: "DELIVERED", label: "배송 완료", value: `${delivered}건`, icon: <PackageCheck size={18} />, tone: "bg-emerald-50 text-emerald-700" },
      { filter: "DONE", label: "거래 완료", value: `${done}건`, icon: <CheckCircle size={18} />, tone: "bg-green-50 text-green-700" },
      { filter: "ISSUE", label: "이슈", value: `${issues}건`, icon: <AlertCircle size={18} />, tone: "bg-red-50 text-red-700" },
    ];
  }, [orders]);

  const handleConfirmTrade = async () => {
    if (!confirmTarget?.orderId || isConfirmingTrade) return;

    try {
      setIsConfirmingTrade(true);
      setConfirmTradeError("");

      await api.post(`/buyer/orders/${confirmTarget.orderId}/complete`);

      setOrders((previous) =>
        previous.map((order) =>
          order.orderId === confirmTarget.orderId
            ? { ...order, status: "COMPLETED" }
            : order
        )
      );

      setActiveFilter("DONE");
      setConfirmTarget(null);
      setPageNotice({
        type: "success",
        message: "거래가 확정되었습니다 감사합니다.",
      });
    } catch (error) {
      console.error("거래 확정 실패", error);
      setConfirmTradeError("거래 확정에 실패했습니다.");
    } finally {
      setIsConfirmingTrade(false);
    }
  };

  const disputeRequiresItem = [
    "PRODUCT_DEFECT",
    "WRONG_ITEM",
    "MISSING_ITEM",
  ].includes(disputeType);

  const closeDisputeModal = () => {
    setDisputeTarget(null);
    setDisputeClaim("");
    setClaimReason("");
    setDisputeItemId(null);
    setClaimQuantity(1);
    setDisputeError("");
  };

  const handleSubmitDispute = async () => {
    if (
      !disputeTarget?.orderId
      || !disputeClaim.trim()
      || isSubmittingDispute
    ) {
      return;
    }

    if (
      disputeRequiresItem
      && (
        !disputeItemId
        || claimQuantity <= 0
        || !claimReason.trim()
      )
    ) {
      setDisputeError("문제가 발생한 상품과 수량, 사유를 입력해 주세요.");
      return;
    }

    try {
      setIsSubmittingDispute(true);
      setDisputeError("");

      await api.post(
        `/buyer/orders/${disputeTarget.orderId}/disputes`,
        {
          disputeType,
          buyerClaim: disputeClaim.trim(),
          requestedAction,
          items: disputeRequiresItem
            ? [
                {
                  orderItemId: disputeItemId,
                  claimQuantity,
                  claimReason: claimReason.trim(),
                },
              ]
            : [],
        }
      );

      setOrders((previous) =>
        previous.map((order) =>
          order.orderId === disputeTarget.orderId
            ? {
                ...order,
                status: "DISPUTE",
                issueMemo: disputeClaim.trim(),
              }
            : order
        )
      );

      setActiveFilter("ISSUE");
      closeDisputeModal();
    } catch (error) {
      console.error("이의제기 접수 실패", error);
      setDisputeError("이의제기를 접수하지 못했습니다.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const closeRenegotiateModal = () => {
    setRenegotiateTarget(null);
    setRenegotiateText("");
    setRenegotiateType("색상 수정");
    setRenegotiateError("");
  };

  const handleRenegotiate = async () => {
    if (
      !renegotiateTarget
      || !renegotiateText.trim()
      || isSubmittingRenegotiate
    ) {
      return;
    }

    if (!renegotiateTarget.quoteId) {
      setRenegotiateError("이 주문은 연결된 견적 정보를 찾을 수 없어 재협상을 요청할 수 없습니다.");
      return;
    }

    try {
      setIsSubmittingRenegotiate(true);
      setRenegotiateError("");

      await api.post("/negotiations", {
        quoteId: renegotiateTarget.quoteId,
        negotiationType: "QUOTE",
        content: `[${renegotiateType}] ${renegotiateText.trim()}`,
      });

      closeRenegotiateModal();
      setPageNotice({
        type: "success",
        message: "재협상 요청이 접수되었습니다. 공급사가 검토 후 수정안을 전달합니다.",
      });
    } catch (error) {
      console.error("재협상 요청 실패", error);
      setRenegotiateError(
        error instanceof Error
          ? error.message
          : "재협상 요청을 접수하지 못했습니다."
      );
    } finally {
      setIsSubmittingRenegotiate(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-700">
              {role === "SELLER" ? "셀러 주문 관리" : "구매 관리"}
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">주문 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              일반 주문, 샘플 주문, 소싱 주문의 진행 상태와 필요한 처리 항목을 함께 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Package size={15} />
              주문 하기
            </Link>
          </div>
        </header>

        {pageNotice && (
          <div
            className={`mb-5 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${
              pageNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span>{pageNotice.message}</span>
            <button
              type="button"
              onClick={() => setPageNotice(null)}
              className="text-xs font-bold"
            >
              닫기
            </button>
          </div>
        )}

        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => setActiveFilter(stat.filter)}
              className={`rounded-lg border-y border-slate-200 bg-white px-4 py-4 text-left transition sm:border sm:shadow-sm ${
                activeFilter === stat.filter
                  ? "border-b-2 border-b-blue-600"
                  : "hover:border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.tone}`}>{stat.icon}</span>
                <span className="text-2xl font-black text-slate-950">{stat.value}</span>
              </div>
              <p className={`mt-2 text-sm font-bold ${activeFilter === stat.filter ? "text-blue-700" : "text-slate-600"}`}>
                {stat.label}
              </p>
            </button>
          ))}
        </section>

        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              className="h-10 border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
            >
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="relative min-w-[240px] flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`${searchOptions.find((option) => option.value === searchType)?.label} 검색`}
                className="h-10 w-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </section>

        {(isLoading || loadError) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {isLoading ? "주문 목록을 불러오는 중입니다." : loadError}
          </div>
        )}

        {payableOrders.length > 0 && (
          <section className="mb-5 flex flex-col gap-3 rounded-lg border border-blue-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={allPayableSelected}
                onChange={toggleAllPayableOrders}
                className="h-4 w-4 accent-blue-600"
              />
              결제 대기 주문 전체 선택
              <span className="text-xs font-semibold text-slate-400">
                {selectedPaymentOrderIds.length}/{payableOrders.length}건
              </span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-slate-500">
                선택 금액 <strong className="font-black text-slate-950">{formatPrice(selectedPaymentTotal)}</strong>
              </span>
              <button
                type="button"
                onClick={handleSelectedOrdersCheckout}
                disabled={selectedPaymentOrderIds.length === 0}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                선택 주문 결제하기
              </button>
            </div>
          </section>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              overviewLoading={loadingOverviewId === order.id}
              overviewError={expandedId === order.id ? overviewError : null}
              onToggle={() => handleToggleOrder(order)}
              onConfirm={setConfirmTarget}
              onDispute={handleOpenDispute}
              onCancel={setCancelTarget}
              onRenegotiate={setRenegotiateTarget}
              paymentSelected={order.orderId !== undefined && selectedPaymentOrderIds.includes(order.orderId)}
              onPaymentSelect={togglePaymentOrder}
            />
          ))}
        </div>

        {!isLoading && !loadError && filteredOrders.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
            <Package size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">
              {orders.length === 0 ? "아직 주문 내역이 없습니다" : "조건에 맞는 주문이 없습니다"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length === 0
                ? "상품을 주문하면 이곳에서 진행 상태를 확인할 수 있습니다."
                : "검색어를 바꾸거나 다른 상태 필터를 선택해 보세요."}
            </p>
          </div>
        )}

        {renegotiateTarget && (
          <BaseModal onClose={isSubmittingRenegotiate ? () => undefined : closeRenegotiateModal} icon={<RefreshCw size={26} />} tone="orange" title="샘플 재협상 요청">
            <p className="mb-4 text-sm leading-6 text-slate-500">
              샘플 확인 후 수정이 필요한 부분을 정해진 양식으로 남깁니다.
            </p>
            <OrderMiniSummary order={renegotiateTarget} />
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">재협상 유형</label>
                <select
                  value={renegotiateType}
                  onChange={(event) => setRenegotiateType(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option>색상 수정</option>
                  <option>소재 변경</option>
                  <option>디자인 수정</option>
                  <option>사이즈 조정</option>
                  <option>봉제 품질</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">수정 요청 내용</label>
                <textarea
                  rows={4}
                  value={renegotiateText}
                  onChange={(event) => setRenegotiateText(event.target.value)}
                  placeholder="예) 블루그레이 컬러가 너무 밝습니다. 한 단계 진한 톤으로 재제작 요청드립니다."
                  className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              {renegotiateError && (
                <p className="text-xs font-semibold text-red-600">
                  {renegotiateError}
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <ModalButton variant="ghost" disabled={isSubmittingRenegotiate} onClick={closeRenegotiateModal}>취소</ModalButton>
              <ModalButton disabled={!renegotiateText.trim() || isSubmittingRenegotiate} onClick={handleRenegotiate}>
                {isSubmittingRenegotiate ? "요청 중..." : "요청하기"}
              </ModalButton>
            </div>
          </BaseModal>
        )}

        {confirmTarget && (
          <BaseModal
            onClose={() => {
              if (isConfirmingTrade) return;
              setConfirmTarget(null);
              setConfirmTradeError("");
            }}
            icon={<CheckCircle size={26} />}
            tone="green"
            title="거래를 확정하시겠습니까?"
          >
            <p className="mb-4 text-sm leading-6 text-slate-500">
              상품 수량과 하자 여부를 확인한 뒤 거래를 확정해 주세요.
            </p>
            <OrderMiniSummary order={confirmTarget} />
            {confirmTradeError && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {confirmTradeError}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <ModalButton
                variant="ghost"
                disabled={isConfirmingTrade}
                onClick={() => {
                  setConfirmTarget(null);
                  setConfirmTradeError("");
                }}
              >
                취소
              </ModalButton>
              <ModalButton disabled={isConfirmingTrade} onClick={() => void handleConfirmTrade()}>
                {isConfirmingTrade ? "처리 중..." : "거래 확정"}
              </ModalButton>
            </div>
          </BaseModal>
        )}

        {disputeTarget && (
          <BaseModal onClose={closeDisputeModal} icon={<AlertCircle size={26} />} tone="red" title="이의 제기 접수">
            <p className="mb-4 text-sm leading-6 text-slate-500">
              주문에서 발생한 문제와 원하는 처리 방법을 입력해 주세요.
            </p>
            <OrderMiniSummary order={disputeTarget} />
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">이의 유형</label>
                <select
                  value={disputeType}
                  onChange={(event) => setDisputeType(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="PRODUCT_DEFECT">상품 불량</option>
                  <option value="WRONG_ITEM">오배송</option>
                  <option value="MISSING_ITEM">상품 누락</option>
                  <option value="DELIVERY_DELAY">배송 지연</option>
                  <option value="PAYMENT">결제 문제</option>
                  <option value="ETC">기타</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">요청 처리 방법</label>
                <select
                  value={requestedAction}
                  onChange={(event) => setRequestedAction(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="REFUND">환불</option>
                  <option value="EXCHANGE">교환</option>
                  <option value="PARTIAL_REFUND">부분 환불</option>
                  <option value="RE_DELIVERY">재배송</option>
                  <option value="ETC">기타 요청</option>
                </select>
              </div>

              {disputeRequiresItem && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">문제 상품</label>
                  <select
                    value={disputeItemId ?? ""}
                    onChange={(event) => setDisputeItemId(Number(event.target.value))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    {disputeTarget.items
                      .filter((item) => item.orderItemId !== undefined)
                      .map((item) => (
                        <option key={item.orderItemId} value={item.orderItemId}>
                          {item.name} · {item.material}
                        </option>
                      ))}
                  </select>

                  <label className="mb-1.5 mt-3 block text-xs font-bold text-slate-500">문제 수량</label>
                  <input
                    type="number"
                    min={1}
                    max={
                      disputeTarget.items.find(
                        (item) => item.orderItemId === disputeItemId
                      )?.quantity ?? 1
                    }
                    value={claimQuantity}
                    onChange={(event) =>
                      setClaimQuantity(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />

                  <label className="mb-1.5 mt-3 block text-xs font-bold text-slate-500">상품별 문제 사유</label>
                  <textarea
                    rows={3}
                    value={claimReason}
                    onChange={(event) => setClaimReason(event.target.value)}
                    maxLength={1000}
                    placeholder="선택한 상품에서 확인한 문제를 작성해 주세요."
                    className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <label className="block text-xs font-bold text-slate-500">전체 이의제기 내용</label>
              <textarea
                rows={4}
                value={disputeClaim}
                onChange={(event) => setDisputeClaim(event.target.value)}
                maxLength={2000}
                placeholder="문제 상황과 요청 사항을 자세히 작성해 주세요."
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              {disputeError && (
                <p className="text-xs font-semibold text-red-600">
                  {disputeError}
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <ModalButton variant="ghost" onClick={closeDisputeModal}>취소</ModalButton>
              <ModalButton
                tone="red"
                disabled={!disputeClaim.trim() || isSubmittingDispute}
                onClick={handleSubmitDispute}
              >
                {isSubmittingDispute ? "접수 중..." : "접수하기"}
              </ModalButton>
            </div>
          </BaseModal>
        )}

        {cancelTarget && (
          <BaseModal
            onClose={() => {
              setCancelTarget(null);
              setCancelReason("");
              setCancelError("");
            }}
            icon={<XCircle size={26} />}
            tone="red"
            title={
              cancelTarget.status === "PENDING"
                ? "주문을 취소하시겠습니까?"
                : "주문 취소 정보"
            }
          >
            <OrderMiniSummary order={cancelTarget} />

            {cancelTarget.status === "PENDING" ? (
              <>
                <textarea
                  rows={4}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="주문 취소 사유를 입력해 주세요."
                  maxLength={500}
                  className="mt-4 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {cancelReason.length}/500
                </div>

                {cancelError && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {cancelError}
                  </p>
                )}

                <div className="mt-5 flex gap-2">
                  <ModalButton
                    variant="ghost"
                    onClick={() => {
                      setCancelTarget(null);
                      setCancelReason("");
                      setCancelError("");
                    }}
                  >
                    닫기
                  </ModalButton>

                  <ModalButton
                    tone="red"
                    disabled={!cancelReason.trim() || isCanceling}
                    onClick={handleCancelOrder}
                  >
                    {isCanceling ? "취소 처리 중..." : "주문 취소"}
                  </ModalButton>
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                  {cancelTarget.issueMemo ?? "취소 사유가 등록되지 않았습니다."}
                </div>

                <div className="mt-5">
                  <ModalButton onClick={() => setCancelTarget(null)}>
                    확인
                  </ModalButton>
                </div>
              </>
            )}
          </BaseModal>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  overviewLoading,
  overviewError,
  onToggle,
  onConfirm,
  onDispute,
  onCancel,
  onRenegotiate,
  paymentSelected,
  onPaymentSelect,
}: {
  order: Order;
  expanded: boolean;
  overviewLoading: boolean;
  overviewError: string | null;
  onToggle: () => void;
  onConfirm: (order: Order) => void;
  onDispute: (order: Order) => void;
  onCancel: (order: Order) => void;
  onRenegotiate: (order: Order) => void;
  paymentSelected: boolean;
  onPaymentSelect: (orderId: number) => void;
}) {
  const status = statusConfig[order.status];
  const type = typeConfig[order.type];
  const timeline = buildTimeline(order);
  const showActionNotice = needsBuyerAction(order);
  const passiveNotice = getPassiveNotice(order);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="block w-full text-left transition hover:bg-slate-50/70">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-950">{order.id}</span>
              {order.isExample && (
                <Badge className="border-slate-200 bg-slate-100 text-slate-500">예시 데이터</Badge>
              )}
              <Badge className={type.tone}>{type.label}</Badge>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <div className={`inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-xs font-bold ${status.tone}`}>
                {status.icon}
                {status.label}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-1 text-base font-black text-slate-950">{getMainItemLabel(order)}</h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{order.date}</span>
                  <span>{order.supplier}</span>
                  <span>{getItemCount(order)}개 품목</span>
                  <span>{getTotalQuantity(order).toLocaleString()}개</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 lg:block lg:text-right">
            <div>
              <p className="text-xs font-bold text-slate-500">결제 금액</p>
              <p className="mt-1 whitespace-nowrap text-xl font-black text-blue-700">{formatPrice(getOrderTotal(order))}</p>
            </div>
          </div>
        </div>
      </button>

      <div className={`border-t px-5 ${showActionNotice ? "border-blue-200 bg-blue-50 py-3" : "border-slate-100 bg-slate-50/70 py-2.5"}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {showActionNotice ? (
            <div className="flex min-w-0 items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Clock size={14} />
              </span>
              <div>
                <p className="font-black text-blue-700">확인 필요</p>
                <p className="mt-0.5 font-semibold text-slate-700">{getNextAction(order)}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-400">
              {passiveNotice && (
                <>
                  <Clock size={13} />
                  <span>{passiveNotice}</span>
                </>
              )}
            </div>
          )}
          <OrderActions
            order={order}
            onConfirm={onConfirm}
            onDispute={onDispute}
            onCancel={onCancel}
            onRenegotiate={onRenegotiate}
            paymentSelected={paymentSelected}
            onPaymentSelect={onPaymentSelect}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          {overviewLoading && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
              주문 상품 정보를 불러오는 중입니다.
            </div>
          )}
          {overviewError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {overviewError}
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <section>
                <SectionLabel icon={<Package size={14} />} title="주문 상품" />
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  {order.items.map((item) => (
                    <div key={item.name} className="grid gap-2 border-b border-slate-100 bg-white px-4 py-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_190px] md:items-center">
                      <div>
                        <p className="font-bold text-slate-950">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.quantity.toLocaleString()}
                          {item.unit} x {formatPrice(item.price)} · {item.material}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-right font-black text-slate-950">
                        {formatPrice(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionLabel icon={<Truck size={14} />} title="진행 타임라인" />
                <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {timeline.map((step) => (
                    <div
                      key={step.key}
                      className={`rounded-lg border p-3 ${
                        step.done ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            step.done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.done ? <CheckCircle size={13} /> : <Clock size={13} />}
                        </span>
                        <p className="text-xs font-black text-slate-900">{step.label}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">{step.time}</p>
                    </div>
                  ))}
                </div>
              </section>

              {order.issueMemo && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-800">
                  {order.issueMemo}
                </div>
              )}
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <SectionLabel icon={<ReceiptText size={14} />} title="주문 요약" />
              <div className="space-y-3 text-sm">
                <SummaryRow label="상품 금액" value={formatPrice(order.subtotal)} />
                <SummaryRow label="배송비" value={order.shippingFee === null ? "착불" : formatPrice(order.shippingFee)} />
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow label="최종 금액" value={formatPrice(getOrderTotal(order))} strong />
                </div>
                <SummaryRow label="결제 방식" value={getPaymentMethodLabel(order.paymentMethod)} />
                <SummaryRow label="수령인" value={order.receiverName} />
                <div>
                  <p className="text-xs font-bold text-slate-500">배송지</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                    {[order.receiverAddress, order.receiverAddressDetail].filter(Boolean).join(" ")}
                  </p>
                </div>
                {order.trackingNo && (
                  <SummaryRow label="송장번호" value={`${order.carrier ?? ""} ${order.trackingNo}`} />
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
}

function OrderActions({
  order,
  onConfirm,
  onDispute,
  onCancel,
  onRenegotiate,
  paymentSelected,
  onPaymentSelect,
}: {
  order: Order;
  onConfirm: (order: Order) => void;
  onDispute: (order: Order) => void;
  onCancel: (order: Order) => void;
  onRenegotiate: (order: Order) => void;
  paymentSelected: boolean;
  onPaymentSelect: (orderId: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {order.status === "PENDING" && (
        <>
          {order.orderId ? (
            <>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={paymentSelected}
                  onChange={() => onPaymentSelect(order.orderId!)}
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                함께 결제
              </label>
              <LinkButton to={`/checkout?orderIds=${order.orderId}`} icon={<Clock size={13} />}>결제하러 가기</LinkButton>
            </>
          ) : (
              <ActionButton tone="ghost" icon={<Clock size={13}/>} onClick={() => undefined}>결제 대기</ActionButton>
          )}
          <ActionButton tone="red" icon={<XCircle size={13} />} onClick={() => onCancel(order)}>주문 취소</ActionButton>
        </>
      )}

      {order.status === "CONFIRMED" && (
        <ActionButton tone="ghost" icon={<CheckCircle size={13} />} onClick={() => undefined}>주문 확정</ActionButton>
      )}

      {order.status === "PREPARING" && (
        <ActionButton tone="ghost" icon={<Package size={13} />} onClick={() => undefined}>출고 준비 중</ActionButton>
      )}

      {order.status === "SAMPLE_DELIVERED" && (
        <>
          <ActionButton tone="ghost" icon={<XCircle size={13} />} onClick={() => onCancel(order)}>샘플 거절</ActionButton>
          <ActionButton tone="orange" icon={<RefreshCw size={13} />} onClick={() => onRenegotiate(order)}>재협상 요청</ActionButton>
          {/* 본생산은 견적 채택 → 셀러 계약서 발송 → 바이어 계약서 서명까지 끝나야
             확정되는 단계라, 샘플 도착 시점에는 여기서 바로 결제로 보낼 수 없다.
             대신 견적 상세로 보내 채택 여부부터 진행하게 한다. */}
          {order.quoteId ? (
            <LinkButton to={`/buyer/quotes/${order.quoteId}`} icon={<PenLine size={13} />}>견적 확인하러 가기</LinkButton>
          ) : (
            <ActionButton tone="ghost" icon={<PenLine size={13} />} onClick={() => undefined}>연결된 견적 없음</ActionButton>
          )}
        </>
      )}

      {order.status === "SAMPLE_RENEGOTIATING" && (
        <ActionButton tone="ghost" icon={<XCircle size={13} />} onClick={() => onCancel(order)}>취소</ActionButton>
      )}

      {order.status === "CONTRACT_SIGNING" && (
        <LinkButton to={`/buyer/orders/${order.id}/contract-sign`} icon={<PenLine size={13} />}>계약서 서명</LinkButton>
      )}

      {order.status === "CONTRACT_CONFIRMED" && (
        <LinkButton to={`/checkout?type=custom&orderId=${order.id}`} icon={<FileText size={13} />}>결제 진행</LinkButton>
      )}

      {(order.status === "SHIPPED" || order.status === "SAMPLE_SHIPPED") && order.trackingNo && (
        <a
          href={getTrackingUrl(order.carrier, order.trackingNo)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
        >
          <ExternalLink size={13} />
          배송 추적
        </a>
      )}

      {(order.status === "SHIPPED" || order.status === "SAMPLE_SHIPPED") && !order.trackingNo && (
        <ActionButton tone="ghost" icon={<Truck size={13} />} onClick={() => undefined}>배송 진행 중</ActionButton>
      )}

      {/* SAMPLE_DELIVERED(샘플 도착)는 위쪽에 이미 전용 액션(거절/재협상/본생산 확정)이 있어
          여기서는 일반 DELIVERED만 처리한다 — 같이 넣으면 버튼이 중복으로 뜬다. */}
      {order.status === "DELIVERED" && (
        <>
          <ActionButton icon={<CheckCircle size={13} />} onClick={() => onConfirm(order)}>거래 확정</ActionButton>
          <ActionButton tone="red" icon={<AlertCircle size={13} />} onClick={() => onDispute(order)}>이의 제기</ActionButton>
        </>
      )}

      {order.status === "CANCELED" && (
        <ActionButton tone="ghost" icon={<Eye size={13} />} onClick={() => onCancel(order)}>취소 사유</ActionButton>
      )}

      {order.status === "REFUNDED" && (
        <ActionButton tone="ghost" icon={<RotateCcw size={13} />} onClick={() => undefined}>환불 완료</ActionButton>
      )}

      <Link
        to={order.orderId ? `/buyer/orders/${order.orderId}` : `/buyer/orders/${order.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-blue-700"
      >
        <Eye size={13} />
        상세
      </Link>
    </div>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function SectionLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? "text-base font-black text-blue-700" : "font-semibold text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  children,
  icon,
  tone = "primary",
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  tone?: "primary" | "ghost" | "red" | "orange";
  onClick: () => void;
}) {
  const className = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700",
    red: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
    orange: "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

function LinkButton({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
    >
      {icon}
      {children}
    </Link>
  );
}

function BaseModal({
  children,
  icon,
  onClose,
  title,
  tone,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClose: () => void;
  title: string;
  tone: "green" | "red" | "orange";
}) {
  const toneClass = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  }[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md border border-slate-200 bg-white p-6 shadow-lg">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900">
          <X size={20} />
        </button>
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-md ${toneClass}`}>{icon}</div>
        <h3 className="mb-2 text-lg font-black text-slate-950">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function OrderMiniSummary({ order }: { order: Order }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="font-black text-slate-950">{order.id}</p>
      <p className="mt-1 text-slate-500">
        {order.supplier} · {formatPrice(getOrderTotal(order))}
      </p>
    </div>
  );
}

function ModalButton({
  children,
  disabled = false,
  onClick,
  tone = "primary",
  variant = "solid",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tone?: "primary" | "red";
  variant?: "solid" | "ghost";
}) {
  const solidClass = tone === "red" ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-600 text-white hover:bg-blue-700";
  const className = variant === "ghost"
    ? "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
    : solidClass;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center rounded-md px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}