import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
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

type BuyerOrderOverviewResponse = {
  items: BuyerOrderItemResponse[];
  amountSummary: BuyerOrderSummaryResponse;
  orderStatus: OrderStatus;
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

const DONE_STEPS_BY_STATUS: Record<OrderStatus, StepKey[]> = {
  PENDING: ["PENDING"],
  CONFIRMED: ["PENDING", "CONFIRMED"],
  SAMPLE_PREPARING: ["PENDING", "CONFIRMED", "SAMPLE_PREPARING"],
  SAMPLE_SHIPPED: ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED"],
  SAMPLE_DELIVERED: ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED"],
  SAMPLE_RENEGOTIATING: [
    "PENDING",
    "CONFIRMED",
    "SAMPLE_PREPARING",
    "SAMPLE_SHIPPED",
    "SAMPLE_DELIVERED",
    "SAMPLE_RENEGOTIATING",
  ],
  CONTRACT_SIGNING: ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "CONTRACT_SIGNING"],
  CONTRACT_CONFIRMED: [
    "PENDING",
    "CONFIRMED",
    "SAMPLE_PREPARING",
    "SAMPLE_SHIPPED",
    "SAMPLE_DELIVERED",
    "CONTRACT_SIGNING",
    "CONTRACT_CONFIRMED",
  ],
  PREPARING: [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
  ],
  SHIPPED: [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
  ],
  DELIVERED: [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
  ],
  COMPLETED: [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
  ],
  CANCELED: ["PENDING"],
  DISPUTE: ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"],
  REFUNDED: ["PENDING", "CONFIRMED"],
};

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
    tone: "border-primary/25 bg-secondary text-primary",
    icon: <PenLine size={13} />,
    group: "contract",
  },
  CONTRACT_CONFIRMED: {
    label: "계약 완료",
    tone: "border-primary/25 bg-secondary text-primary",
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
    label: "취소",
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
  SOURCING: { label: "소싱 주문", tone: "border-primary/25 bg-secondary text-primary" },
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
  return {
    orderId: order.orderId,
    id: order.orderNo,
    date: formatOrderDate(order.createdAt),
    supplier: "판매사 정보 확인 중",
    buyer: "내 주문",
    type: mapOrderType(order.orderType, order.isSample),
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
    status: order.orderStatus,
    subtotal: order.totalAmount ?? 0,
    platformFee: 0,
    shippingFee: 0,
    trackingNo: null,
    paymentMethod: "결제 정보 확인 중",
    receiverName: "상세 화면에서 확인",
    receiverAddress: "상세 화면에서 확인",
    receiverAddressDetail: null,
    issueMemo: order.canceledReason ?? undefined,
  };
}

function applyOrderOverview(order: Order, overview: BuyerOrderOverviewResponse): Order {
  const summary = overview.amountSummary;

  return {
    ...order,
    items: overview.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unit: "개",
      price: item.unitPrice + item.additionalPrice,
      material: item.optionSummary ?? "-",
    })),
    itemCount: overview.items.length,
    totalQuantity: overview.items.reduce((total, item) => total + item.quantity, 0),
    status: overview.orderStatus,
    subtotal: summary.subtotalAmount,
    platformFee: summary.platformFee,
    shippingFee: summary.shippingFee,
    paymentMethod: summary.paymentMethod ?? "결제 정보 없음",
    receiverName: summary.receiverName ?? "수령인 정보 없음",
    receiverAddress: summary.receiverAddress ?? "배송지 정보 없음",
    receiverAddressDetail: summary.receiverAddressDetail,
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
  return order.subtotal + order.platformFee + (order.shippingFee ?? 0);
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

function buildTimeline(order: Order) {
  let sequence =
    order.type === "SOURCING"
      ? SOURCING_STEPS
      : order.type === "SAMPLE"
        ? SAMPLE_STEPS
        : GENERAL_STEPS;

  if (order.status === "SAMPLE_RENEGOTIATING" && !sequence.includes("SAMPLE_RENEGOTIATING")) {
    const index = sequence.indexOf("SAMPLE_DELIVERED");
    sequence = [...sequence.slice(0, index + 1), "SAMPLE_RENEGOTIATING", ...sequence.slice(index + 1)];
  }

  const done = new Set(DONE_STEPS_BY_STATUS[order.status]);
  return sequence.map((key) => ({
    key,
    label: STEP_LABELS[key],
    done: done.has(key),
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
      return "상품 확인 후 거래 확정 또는 이의 제기를 진행하세요";
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
      return "주문 취소";
    case "REFUNDED":
      return "환불 완료";
    default:
      return "";
  }
}

function matchesFilter(order: Order, filter: string) {
  if (filter === "ALL") return true;
  if (filter === "PROGRESS") {
    return [
      "PENDING",
      "CONFIRMED",
      "SAMPLE_PREPARING",
      "SAMPLE_SHIPPED",
      "SAMPLE_DELIVERED",
      "SAMPLE_RENEGOTIATING",
      "CONTRACT_SIGNING",
      "CONTRACT_CONFIRMED",
      "PREPARING",
    ].includes(order.status);
  }
  if (filter === "SHIPPING") return ["SHIPPED", "DELIVERED"].includes(order.status);
  if (filter === "DONE") return order.status === "COMPLETED";
  if (filter === "ISSUE") return ["DISPUTE", "CANCELED", "REFUNDED"].includes(order.status);
  return true;
}

export function Orders({ role = "BUYER" }: { role?: "BUYER" | "SELLER" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOrderDemo = import.meta.env.DEV && searchParams.get("demo") === "orders";
  const [orders, setOrders] = useState<Order[]>(isOrderDemo ? exampleOrders : []);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingOverviewId, setLoadingOverviewId] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("PROGRESS");
  const [searchType, setSearchType] = useState<SearchType>("product");
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Order | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [renegotiateTarget, setRenegotiateTarget] = useState<Order | null>(null);
  const [renegotiateText, setRenegotiateText] = useState("");
  const [selectedPaymentOrderIds, setSelectedPaymentOrderIds] = useState<number[]>([]);

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

        const response = await api.get<BuyerOrderListResponse[]>("/orders");
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
      const overview = await api.get<BuyerOrderOverviewResponse>(`/orders/${order.orderId}`);

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
    const inProgress = orders.filter((order) =>
      ["PENDING", "CONFIRMED", "SAMPLE_PREPARING", "SAMPLE_SHIPPED", "SAMPLE_DELIVERED", "SAMPLE_RENEGOTIATING", "PREPARING"].includes(order.status)
    ).length;
    const shipping = orders.filter((order) => ["SHIPPED", "DELIVERED"].includes(order.status)).length;
    const done = orders.filter((order) => order.status === "COMPLETED").length;
    const issues = orders.filter((order) => ["DISPUTE", "CANCELED", "REFUNDED"].includes(order.status)).length;

    return [
      { filter: "ALL", label: "전체 주문", value: `${orders.length}건`, icon: <ReceiptText size={18} />, tone: "bg-secondary text-primary" },
      { filter: "PROGRESS", label: "진행 중", value: `${inProgress}건`, icon: <Truck size={18} />, tone: "bg-sky-50 text-sky-700" },
      { filter: "SHIPPING", label: "배송 중", value: `${shipping}건`, icon: <Package size={18} />, tone: "bg-amber-50 text-amber-700" },
      { filter: "DONE", label: "거래 완료", value: `${done}건`, icon: <CheckCircle size={18} />, tone: "bg-green-50 text-green-700" },
      { filter: "ISSUE", label: "이슈", value: `${issues}건`, icon: <AlertCircle size={18} />, tone: "bg-red-50 text-red-700" },
    ];
  }, [orders]);

  const handleConfirmTrade = () => {
    setConfirmTarget(null);
    alert("거래가 확정되었습니다. 셀러 정산이 진행됩니다.");
  };

  const handleSubmitDispute = () => {
    setDisputeTarget(null);
    alert("이의 제기가 접수되었습니다. 관리자가 검토 후 안내드립니다.");
  };

  const handleRenegotiate = () => {
    if (!renegotiateText.trim()) return;
    setRenegotiateTarget(null);
    setRenegotiateText("");
    alert("재협상 요청이 접수되었습니다. 공급사가 검토 후 수정안을 전달합니다.");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                <ShoppingBag size={13} />
                {role === "SELLER" ? "셀러 주문 관리" : "바이어 주문 관리"}
              </div>
              <h1 className="text-2xl font-black text-slate-950">주문 진행 상태를 한눈에 확인하세요</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                일반 주문, 샘플 주문, 소싱 주문의 진행 상태와 필요한 처리 항목을 함께 관리합니다.
              </p>
            </div>
            <Link
              to="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              <Package size={15} />
              주문 하기
            </Link>
          </div>
        </header>

        <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => setActiveFilter(stat.filter)}
              className={`rounded-xl border p-4 text-left shadow-sm transition ${
                activeFilter === stat.filter
                  ? "border-primary bg-white ring-2 ring-primary/10"
                  : "border-slate-200 bg-white hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}>{stat.icon}</span>
                <span className="text-2xl font-black text-slate-950">{stat.value}</span>
              </div>
              <p className={`mt-3 text-sm font-bold ${activeFilter === stat.filter ? "text-primary" : "text-slate-600"}`}>
                {stat.label}
              </p>
            </button>
          ))}
        </section>

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-primary"
            >
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`${searchOptions.find((option) => option.value === searchType)?.label} 검색`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        {(isLoading || loadError) && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {isLoading ? "주문 목록을 불러오는 중입니다." : loadError}
          </div>
        )}

        {payableOrders.length > 0 && (
          <section className="mb-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={allPayableSelected}
                onChange={toggleAllPayableOrders}
                className="h-4 w-4 accent-primary"
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
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                선택 주문 결제하기
              </button>
            </div>
          </section>
        )}

        <main className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              overviewLoading={loadingOverviewId === order.id}
              overviewError={expandedId === order.id ? overviewError : null}
              onToggle={() => handleToggleOrder(order)}
              onConfirm={setConfirmTarget}
              onDispute={setDisputeTarget}
              onCancel={setCancelTarget}
              onRenegotiate={setRenegotiateTarget}
              paymentSelected={order.orderId !== undefined && selectedPaymentOrderIds.includes(order.orderId)}
              onPaymentSelect={togglePaymentOrder}
            />
          ))}
        </main>

        {!isLoading && !loadError && filteredOrders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
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
          <BaseModal onClose={() => setRenegotiateTarget(null)} icon={<RefreshCw size={26} />} tone="orange" title="샘플 재협상 요청">
            <p className="mb-4 text-sm leading-6 text-slate-500">
              샘플 확인 후 수정이 필요한 부분을 정해진 양식으로 남깁니다.
            </p>
            <OrderMiniSummary order={renegotiateTarget} />
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">재협상 유형</label>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
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
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-xs font-medium text-slate-500">
                참고 이미지 첨부
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <ModalButton variant="ghost" onClick={() => setRenegotiateTarget(null)}>취소</ModalButton>
              <ModalButton disabled={!renegotiateText.trim()} onClick={handleRenegotiate}>요청하기</ModalButton>
            </div>
          </BaseModal>
        )}

        {confirmTarget && (
          <BaseModal onClose={() => setConfirmTarget(null)} icon={<CheckCircle size={26} />} tone="green" title="거래를 확정하시겠습니까?">
            <p className="mb-4 text-sm leading-6 text-slate-500">
              상품 수량과 하자 여부를 확인한 뒤 거래를 확정해 주세요. 확정 후 셀러 정산이 진행됩니다.
            </p>
            <OrderMiniSummary order={confirmTarget} />
            <div className="mt-5 flex gap-2">
              <ModalButton variant="ghost" onClick={() => setConfirmTarget(null)}>취소</ModalButton>
              <ModalButton onClick={handleConfirmTrade}>거래 확정</ModalButton>
            </div>
          </BaseModal>
        )}

        {disputeTarget && (
          <BaseModal onClose={() => setDisputeTarget(null)} icon={<AlertCircle size={26} />} tone="red" title="이의 제기 접수">
            <p className="mb-4 text-sm leading-6 text-slate-500">
              수량 부족, 불량, 오배송 등 문제가 있는 경우 증빙과 함께 이의 제기를 접수합니다.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">이의 유형</label>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
                  <option>수량 부족</option>
                  <option>불량</option>
                  <option>오배송</option>
                  <option>배송 문제</option>
                  <option>기타</option>
                </select>
              </div>
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-xs font-medium text-slate-500">
                증빙 파일 첨부
              </div>
              <textarea
                rows={4}
                placeholder="문제 상황을 자세히 작성해 주세요."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="mt-5 flex gap-2">
              <ModalButton variant="ghost" onClick={() => setDisputeTarget(null)}>취소</ModalButton>
              <ModalButton tone="red" onClick={handleSubmitDispute}>접수하기</ModalButton>
            </div>
          </BaseModal>
        )}

        {cancelTarget && (
          <BaseModal onClose={() => setCancelTarget(null)} icon={<XCircle size={26} />} tone="red" title="주문 취소 정보">
            <OrderMiniSummary order={cancelTarget} />
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              {cancelTarget.issueMemo ?? "취소 사유가 등록되지 않았습니다."}
            </div>
            <div className="mt-5">
              <ModalButton onClick={() => setCancelTarget(null)}>확인</ModalButton>
            </div>
          </BaseModal>
        )}
      </div>
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
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="block w-full text-left transition hover:bg-slate-50">
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
              <div className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${status.tone}`}>
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
              <p className="mt-1 whitespace-nowrap text-xl font-black text-primary">{formatPrice(getOrderTotal(order))}</p>
            </div>
          </div>
        </div>
      </button>

      <div className={`border-t px-5 ${showActionNotice ? "border-primary/15 bg-secondary/80 py-3" : "border-slate-100 bg-slate-50/70 py-2.5"}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {showActionNotice ? (
            <div className="flex min-w-0 items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Clock size={14} />
              </span>
              <div>
                <p className="font-black text-primary">확인 필요</p>
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
                        step.done ? "border-primary/25 bg-secondary/60" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            step.done ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
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

            <aside className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionLabel icon={<ReceiptText size={14} />} title="주문 요약" />
              <div className="space-y-3 text-sm">
                <SummaryRow label="상품 금액" value={formatPrice(order.subtotal)} />
                <SummaryRow label="배송비" value={order.shippingFee === null ? "착불" : formatPrice(order.shippingFee)} />
                <SummaryRow label="플랫폼 수수료" value={formatPrice(order.platformFee)} />
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow label="최종 금액" value={formatPrice(getOrderTotal(order))} strong />
                </div>
                <SummaryRow label="결제 방식" value={order.paymentMethod} />
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
                  className="h-3.5 w-3.5 accent-primary"
                />
                함께 결제
              </label>
              <LinkButton to={`/checkout?orderIds=${order.orderId}`} icon={<Clock size={13} />}>결제하러 가기</LinkButton>
            </>
          ) : (
            <ActionButton tone="ghost" icon={<Clock size={13} ㅑ/>} onClick={() => undefined}>결제 대기</ActionButton>
          )}
          <ActionButton tone="ghost" icon={<XCircle size={13} />} onClick={() => onCancel(order)}>주문 취소</ActionButton>
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
          <LinkButton to={`/buyer/checkout`} icon={<PenLine size={13} />}>본생산 확정</LinkButton>
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

      {order.status === "SHIPPED" && order.trackingNo && (
        <a
          href={getTrackingUrl(order.carrier, order.trackingNo)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-secondary"
        >
          <ExternalLink size={13} />
          배송 추적
        </a>
      )}

      {order.status === "SHIPPED" && !order.trackingNo && (
        <ActionButton tone="ghost" icon={<Truck size={13} />} onClick={() => undefined}>배송 진행 중</ActionButton>
      )}

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
        to={order.orderId ? `/orders/${order.orderId}` : `/orders/${order.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-primary"
      >
        <Eye size={13} />
        상세
      </Link>
    </div>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function SectionLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? "text-base font-black text-primary" : "font-semibold text-slate-900"}`}>
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
    primary: "bg-primary text-white hover:bg-primary/90",
    ghost: "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary",
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90"
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
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900">
          <X size={20} />
        </button>
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>{icon}</div>
        <h3 className="mb-2 text-lg font-black text-slate-950">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function OrderMiniSummary({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
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
  const solidClass = tone === "red" ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-white hover:bg-primary/90";
  const className = variant === "ghost"
    ? "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
    : solidClass;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
