import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  History,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTE"
  | "CANCELED"
  | "REFUNDED";

type SellerOrderItemResponse = {
  orderItemId: number;
  productName: string;
  optionSummary: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImageUrl: string | null;
  itemStatus: "WAITING" | "READY";
  preparedAt: string | null;
  assignedToMe: boolean;
  assignedUserName: string;
  canPrepare: boolean;
};

type PaymentMethod = "TRANSFER" | "CORP_CARD";
type OrderLogType = "STATUS" | "PROCESS";

type SellerOrderAmountResponse = {
  subtotalAmount: number;
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
};

type SellerOrderDeliveryResponse = {
  receiverName: string;
  receiverPhone: string;
  receiverZipcode: string | null;
  receiverAddress: string;
  receiverAddressDetail: string | null;
  receiverMemo: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

type SellerOrderLogResponse = {
  orderLogId: number;
  logType: OrderLogType;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus | null;
  processStep: string | null;
  actorName: string;
  memo: string | null;
  createdAt: string;
};

type DeliveryTrackingEvent = {
  time: string;
  status: {
    code: string;
    name: string;
  };
  description: string | null;
  location: {
    name: string;
  } | null;
};

type DeliveryTrackingResponse = {
  lastEvent: DeliveryTrackingEvent | null;
  events: DeliveryTrackingEvent[];
};

type SellerOrderDetailResponse = {
  orderId: number;
  orderNo: string;
  buyerCompanyName: string;
  orderStatus: OrderStatus;
  isSample: boolean;
  items: SellerOrderItemResponse[];
  createdAt: string;
  amountSummary: SellerOrderAmountResponse;
  delivery: SellerOrderDeliveryResponse;
  statusLogs: SellerOrderLogResponse[];
  preparation: {
    totalItemCount: number;
    readyItemCount: number;
    allItemsReady: boolean;
  };
};

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  PENDING: {
    label: "결제 대기",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock size={14} />,
  },
  CONFIRMED: {
    label: "결제 완료",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <CheckCircle size={14} />,
  },
  PREPARING: {
    label: "출고 준비",
    className: "border-purple-200 bg-purple-50 text-purple-700",
    icon: <Package size={14} />,
  },
  SHIPPED: {
    label: "배송 중",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    icon: <Truck size={14} />,
  },
  DELIVERED: {
    label: "배송 완료",
    className: "border-green-200 bg-green-50 text-green-700",
    icon: <CheckCircle size={14} />,
  },
  COMPLETED: {
    label: "거래 완료",
    className: "border-green-200 bg-green-50 text-green-700",
    icon: <CheckCircle size={14} />,
  },
  DISPUTE: {
    label: "이의제기",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <AlertCircle size={14} />,
  },
  CANCELED: {
    label: "주문 취소",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  REFUNDED: {
    label: "환불 완료",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: <CheckCircle size={14} />,
  },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const paymentMethodLabel: Record<PaymentMethod, string> = {
  TRANSFER: "무통장 입금",
  CORP_CARD: "법인카드",
};

const trackingStatusLabel: Record<string, string> = {
  DELIVERED: "배송 완료",
  OUT_FOR_DELIVERY: "배송 출발",
  IN_TRANSIT: "배송 중",
  AT_PICKUP: "집화 완료",
  UNKNOWN: "배송 상태 확인 중",
};

function getTrackingStatusLabel(code: string, fallback: string) {
  return trackingStatusLabel[code] ?? fallback;
}

// 리머지택배(테스트용 더미 캐리어)는 외부 API가 이벤트 설명을 항상 "DUMMY!"로 내려준다.
// 그대로 보여주면 이상해 보이므로, 그 경우엔 상태 코드 기반의 안내 문구로 대체한다.
const trackingStatusDescription: Record<string, string> = {
  DELIVERED: "상품이 수령지에 배송 완료되었습니다.",
  OUT_FOR_DELIVERY: "배송기사가 상품을 싣고 출발했습니다.",
  IN_TRANSIT: "상품이 배송 중입니다.",
  AT_PICKUP: "상품이 집화되어 배송을 준비하고 있습니다.",
  UNKNOWN: "배송 상태를 확인하고 있습니다.",
};

function getTrackingDescription(description: string | null, statusCode: string) {
  if (description && description !== "DUMMY!") {
    return description;
  }
  return trackingStatusDescription[statusCode] ?? "배송 상태가 갱신되었습니다.";
}

// tracking.events는 시간 오름차순으로 내려오는데, 캐리어(특히 테스트용 더미 캐리어)가
// 상태 변화 없이 같은 상태를 반복해서 찍어주는 경우가 많다. 의미 있는 "상태가 바뀐 시점"만
// 남기고, 같은 상태가 연속으로 반복되는 구간은 첫 등장만 남긴다.
function collapseTrackingEvents(
  events: DeliveryTrackingEvent[]
): DeliveryTrackingEvent[] {
  const collapsed: DeliveryTrackingEvent[] = [];
  for (const event of events) {
    const previous = collapsed[collapsed.length - 1];
    if (!previous || previous.status.code !== event.status.code) {
      collapsed.push(event);
    }
  }
  return collapsed;
}

// 실제 배송완료 시각은 주문 엔티티의 deliveredAt이 정답이다(이 값은 테스트용 배송완료 처리
// 버튼을 눌렀을 때도 함께 채워진다). 외부 배송조회 API의 이벤트가 아직 이를 반영하지 못했더라도
// (더미 캐리어의 폴링/동기화 지연 등) 화면에는 이 시각을 기준으로 "배송완료" 항목을 항상
// 보여준다.
function withDeliveredEvent(
  events: DeliveryTrackingEvent[],
  deliveredAt: string | null
): DeliveryTrackingEvent[] {
  if (!deliveredAt) return events;
  if (events.some((event) => event.status.code === "DELIVERED")) return events;

  return [
    ...events,
    {
      time: deliveredAt,
      status: { code: "DELIVERED", name: "배송 완료" },
      description: null,
      location: null,
    },
  ];
}

// 리머지택배(dev.track.dummy)는 실제 운송장 번호 대신, 3시간 단위(0/3/6/9/12/15/18/21시, UTC)로
// "yyyy-MM-ddTHH:00:00Z" 형식의 운송장 번호를 매일 자동 생성해두고 그걸로만 조회가 된다.
// 아무 숫자나 넣으면 조회가 실패하므로, 현재 시각 기준으로 이미 생성되어 있는(과거) 슬롯을
// 계산해서 바로 쓸 수 있는 예시 값을 만들어준다.
// 리머지택배(더미 캐리어)는 운송장 번호 자체가 "배송 완료 시각"이다.
// 현재 시각과 같은 3시간 슬롯을 넣으면 등록 즉시 배송완료로 조회되므로,
// 시연에서 "배송 중" 흐름을 보여주려면 미래 슬롯을 등록해야 한다.
// 3칸(9시간) 뒤 슬롯을 기본값으로 사용한다.
function getDummyTrackingNumber(slotsAhead = 3) {
  const now = new Date();
  const flooredHour = Math.floor(now.getUTCHours() / 3) * 3;

  const slot = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      flooredHour + slotsAhead * 3,
    ),
  );

  return slot.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const normalOrderStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

const exceptionStatuses: OrderStatus[] = [
  "DISPUTE",
  "CANCELED",
  "REFUNDED",
];

export function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [order, setOrder] = useState<SellerOrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isRegisteringShipment, setIsRegisteringShipment] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  const [tracking, setTracking] = useState<DeliveryTrackingResponse | null>(
    null
  );
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadOrderDetail = useCallback(
    async (showLoading = true) => {
      if (!id) {
        setLoadError("주문 번호가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setLoadError("");
        const response = await api.get<SellerOrderDetailResponse>(
          `/seller/orders/${id}`
        );
        setOrder(response);

        if (
          response.delivery.carrier &&
          response.delivery.trackingNumber
        ) {
          try {
            setIsTrackingLoading(true);
            setTrackingError("");

            const trackingResponse =
              await api.get<DeliveryTrackingResponse>(
                `/delivery/orders/${response.orderId}`
              );

            setTracking(trackingResponse);
          } catch (trackingLoadError) {
            console.error("배송 추적 조회 실패", trackingLoadError);
            setTracking(null);
            setTrackingError("배송 이력을 불러오지 못했습니다.");
          } finally {
            setIsTrackingLoading(false);
          }
        } else {
          setTracking(null);
          setTrackingError("");
          setIsTrackingLoading(false);
        }
      } catch (error) {
        console.error("셀러 주문 상세 조회 실패", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "주문 상세를 불러오지 못했습니다."
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    void loadOrderDetail();
  }, [loadOrderDetail]);

  const handleMarkItemReady = async (orderItemId: number) => {
    try {
      setUpdatingItemId(orderItemId);
      setActionNotice(null);
      await api.patch(`/seller/orders/items/${orderItemId}/ready`);
      await loadOrderDetail(false);
      setActionNotice({
        type: "success",
        message: "담당 상품을 준비 완료 처리했습니다.",
      });
    } catch (error) {
      setActionNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "상품 준비 상태를 변경하지 못했습니다.",
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleMarkAllItemsReady = async () => {
    if (!id) return;

    try {
      setIsUpdatingAll(true);
      setActionNotice(null);
      await api.patch(`/seller/orders/${id}/items/ready`);
      await loadOrderDetail(false);
      setActionNotice({
        type: "success",
        message: "주문의 모든 상품을 준비 완료 처리했습니다.",
      });
    } catch (error) {
      setActionNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "전체 상품 준비 상태를 변경하지 못했습니다.",
      });
    } finally {
      setIsUpdatingAll(false);
    }
  };

  const handleRegisterShipment = async () => {
    if (!id || !carrier || !trackingNumber.trim()) return;

    try {
      setIsRegisteringShipment(true);
      setActionNotice(null);

      await api.patch(`/seller/orders/${id}/shipment`, {
        carrier,
        trackingNumber: trackingNumber.trim(),
      });

      await loadOrderDetail(false);
      setActionNotice({
        type: "success",
        message: "출고 정보가 등록되어 배송이 시작되었습니다.",
      });
    } catch (error) {
      setActionNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "출고 정보를 등록하지 못했습니다.",
      });
    } finally {
      setIsRegisteringShipment(false);
    }
  };

  // [테스트용] 실제 배송 API 연동 없이 배송완료로 전환한다. 출고(배송 시작) 이후에만 노출되는
  // 임시 버튼 — 데모/QA 목적.
  const handleMarkDeliveredTest = async () => {
    if (!id) return;

    try {
      setIsMarkingDelivered(true);
      setActionNotice(null);

      await api.patch(`/seller/orders/${id}/delivered/test`);

      await loadOrderDetail(false);
      setActionNotice({
        type: "success",
        message: "(테스트) 배송완료로 전환되었습니다.",
      });
    } catch (error) {
      setActionNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "배송완료 처리에 실패했습니다.",
      });
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center text-sm text-muted-foreground">
        주문 상세를 불러오는 중입니다.
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 text-center">
        <AlertCircle
          size={42}
          className="mx-auto mb-4 text-muted-foreground/50"
        />
        <h2 className="mb-2 text-lg font-bold text-foreground">
          주문 상세를 불러오지 못했습니다.
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">{loadError}</p>
        <Link
          to="/seller/orders"
          className="inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          주문 목록으로
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.orderStatus];
  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const currentNormalStatusIndex = normalOrderStatuses.indexOf(
    order.orderStatus
  );
  const isPresident = user?.role === "PRESIDENT";
  const canPrepareItems =
    order.orderStatus === "CONFIRMED" || order.orderStatus === "PREPARING";
  const canRegisterShipment =
    order.orderStatus === "PREPARING" &&
    order.preparation.allItemsReady &&
    !order.delivery.trackingNumber;
  const exceptionLogs = order.statusLogs.filter(
    (log) => log.newStatus && exceptionStatuses.includes(log.newStatus)
  );
  // 최신 이벤트(배송완료 등)가 가장 위로 오게 보여준다.
  const trackingEvents = [...collapseTrackingEvents(
    withDeliveredEvent(tracking?.events ?? [], order.delivery.deliveredAt)
  )].reverse();
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="bg-[#24352d] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 lg:px-10">
          <Link
            to="/seller/orders"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ChevronLeft size={16} />
            주문 목록으로
          </Link>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-100">
                  {order.isSample ? "샘플 주문" : "일반 주문"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${status.className}`}
                >
                  {status.icon}
                  {status.label}
                </span>
              </div>
              <h1 className="font-mono text-2xl font-black tracking-normal md:text-3xl">
                {order.orderNo}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                <span>구매사 <strong className="text-white">{order.buyerCompanyName}</strong></span>
                <span>주문일 <strong className="text-white">{formatDate(order.createdAt)}</strong></span>
              </div>
            </div>

            <div className="min-w-[240px] rounded-lg border border-white/10 bg-white/5 p-5 md:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-300">
                Total amount
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {order.amountSummary.totalAmount.toLocaleString()}원
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-300">
                {order.amountSummary.paymentMethod
                  ? `${paymentMethodLabel[order.amountSummary.paymentMethod]} 결제`
                  : "결제 수단 미등록"} · 총 {totalQuantity.toLocaleString()}개
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
      {actionNotice && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm font-semibold ${
            actionNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold"
          >
            닫기
          </button>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-7 lg:col-span-8">


          <section className="order-1 space-y-4">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black text-slate-950">
                            주문 상품 ({order.items.length})
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            준비 완료 {order.preparation.readyItemCount} /{" "}
                            {order.preparation.totalItemCount}
                            {order.preparation.allItemsReady
                              ? " · 모든 상품 준비 완료"
                              : " · 출고 준비 진행 중"}
                          </p>
                        </div>
                        {isPresident &&
                          canPrepareItems &&
                          !order.preparation.allItemsReady && (
                            <button
                              type="button"
                              disabled={isUpdatingAll}
                              onClick={() => void handleMarkAllItemsReady()}
                              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                            >
                              <CheckCircle size={14} />
                              {isUpdatingAll ? "처리 중" : "전체 준비 완료"}
                            </button>
                          )}
                      </div>

                      {order.items.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">
                          조회된 주문 상품이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <article
                              key={item.orderItemId}
                              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_minmax(0,1fr)_140px] sm:items-center"
                            >
                              <div className="flex size-24 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                {item.productImageUrl ? (
                                  <img
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package
                                    size={28}
                                    className="text-slate-300"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded px-2 py-1 text-[11px] font-bold ${
                                      item.assignedToMe
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {item.assignedToMe
                                      ? "내 담당 상품"
                                      : `${item.assignedUserName} 담당자의 상품`}
                                  </span>
                                  <span
                                    className={`rounded px-2 py-1 text-[11px] font-bold ${
                                      item.itemStatus === "READY"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {item.itemStatus === "READY" ? "준비 완료" : "준비 중"}
                                  </span>
                                </div>
                                <h3 className="text-base font-black text-slate-950">
                                  {item.productName}
                                </h3>
                                <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-400">옵션</p>
                                    <p className="mt-1 truncate font-bold text-slate-800">
                                      {item.optionSummary || "기본 옵션"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400">수량</p>
                                    <p className="mt-1 font-bold text-slate-800">
                                      {item.quantity.toLocaleString()}개
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400">단가</p>
                                    <p className="mt-1 font-bold text-slate-800">
                                      {item.unitPrice.toLocaleString()}원
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="self-center text-left sm:text-right">
                                <p className="text-xs font-semibold text-slate-400">합계</p>
                                <p className="mt-1 text-lg font-black text-slate-950">
                                  {item.totalPrice.toLocaleString()}원
                                </p>
                                {item.preparedAt && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatDate(item.preparedAt)}
                                  </p>
                                )}
                                {item.canPrepare &&
                                  canPrepareItems &&
                                  item.itemStatus !== "READY" && (
                                    <button
                                      type="button"
                                      disabled={updatingItemId === item.orderItemId}
                                      onClick={() =>
                                        void handleMarkItemReady(item.orderItemId)
                                      }
                                      className="mt-4 h-9 rounded-md border border-blue-600 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                                    >
                                      {updatingItemId === item.orderItemId
                                        ? "처리 중"
                                        : "준비 완료"}
                                    </button>
                                  )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
          <section className="order-2 mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 px-5 py-4">
                                  <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
                                    <History size={17} className="text-blue-700" />
                                    주문 상태 흐름
                                  </h2>
                                </div>
                                <ol className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                                  {normalOrderStatuses.map((step, index) => {
                                    const stepLog = order.statusLogs.find(
                                      (log) => log.newStatus === step
                                    );
                                    const isCompleted =
                                      index === 0 ||
                                      (currentNormalStatusIndex >= 0 &&
                                        index <= currentNormalStatusIndex) ||
                                      Boolean(stepLog);
                                    const isCurrent = order.orderStatus === step;

                                    return (
                                      <li
                                        key={step}
                                        className={`flex min-h-[112px] items-start gap-3 rounded-lg border p-4 ${
                                          isCurrent
                                            ? "border-2 border-blue-600 bg-blue-50"
                                            : isCompleted
                                              ? "border-blue-200 bg-blue-50/50"
                                              : "border-slate-200 bg-slate-50"
                                        }`}
                                      >
                                        <span
                                            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                              isCurrent
                                                ? "bg-blue-600 text-white"
                                                : isCompleted
                                                  ? "bg-blue-100 text-blue-700"
                                                  : "bg-slate-200 text-slate-400"
                                            }`}
                                          >
                                            {isCompleted ? (
                                              <CheckCircle size={14} />
                                            ) : (
                                              <Clock size={14} />
                                            )}
                                          </span>
                                        <div className="min-w-0">
                                          <p
                                            className={`text-sm font-black ${
                                              isCompleted
                                                ? "text-slate-900"
                                                : "text-slate-400"
                                            }`}
                                          >
                                            {statusConfig[step].label}
                                            {isCurrent && (
                                              <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                                                현재
                                              </span>
                                            )}
                                          </p>
                                        <p className="mt-2 text-xs text-slate-500">
                                          {stepLog
                                            ? formatDate(stepLog.createdAt)
                                            : index === 0
                                              ? formatDate(order.createdAt)
                                              : "진행 전"}
                                        </p>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ol>

                                {exceptionLogs.length > 0 && (
                                  <div className="border-t border-slate-200 px-5 py-4">
                                    <p className="mb-3 text-xs font-semibold text-red-700">
                                      예외 처리 이력
                                    </p>
                                    <div className="space-y-2">
                                      {exceptionLogs.map((log) => (
                                        <div
                                          key={log.orderLogId}
                                          className="flex flex-wrap items-center justify-between gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                                        >
                                          <span className="font-semibold">
                                            {log.newStatus
                                              ? statusConfig[log.newStatus].label
                                              : "예외 처리"}
                                          </span>
                                          <span>
                                            {formatDate(log.createdAt)} · {log.actorName}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </section>

          {order.delivery.trackingNumber && (
            <section className="order-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
                    <Truck size={17} className="text-blue-700" />
                    배송 추적
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.delivery.carrier} · {order.delivery.trackingNumber}
                  </p>
                  {order.delivery.deliveredAt && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      배송완료: {formatDate(order.delivery.deliveredAt)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {trackingEvents[0] && (
                    <span className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                      {getTrackingStatusLabel(
                        trackingEvents[0].status.code,
                        trackingEvents[0].status.name
                      )}
                    </span>
                  )}
                  {order.orderStatus === "SHIPPED" && (
                    <button
                      type="button"
                      disabled={isMarkingDelivered}
                      onClick={() => void handleMarkDeliveredTest()}
                      className="whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isMarkingDelivered ? "처리 중" : "테스트: 배송완료 처리"}
                    </button>
                  )}
                </div>
              </div>

              {isTrackingLoading ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  배송 이력을 불러오는 중입니다.
                </p>
              ) : trackingError ? (
                <div className="m-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle size={16} className="shrink-0" />
                  {trackingError}
                </div>
              ) : trackingEvents.length > 0 ? (
                <ol className="divide-y divide-slate-100 px-5">
                  {trackingEvents.map((event, index) => (
                    <li
                      key={`${event.time}-${event.status.code}-${index}`}
                      className="grid gap-3 py-4 sm:grid-cols-[120px_140px_minmax(0,1fr)] sm:items-start"
                    >
                      <time className="text-xs font-semibold text-slate-500">
                        {formatDate(event.time)}
                      </time>
                      <span
                        className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${
                          index === 0
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getTrackingStatusLabel(
                          event.status.code,
                          event.status.name
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700">
                          {getTrackingDescription(
                            event.description,
                            event.status.code
                          )}
                        </p>
                        {event.location?.name && (
                          <p className="mt-1 text-xs text-slate-400">
                            {event.location.name}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  표시할 배송 이력이 없습니다.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5 lg:col-span-4">
          {canRegisterShipment && (
            <section className="order-1 rounded-lg border-2 border-blue-600 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Truck size={17} />
                </div>
                <div>
                  <h2 className="font-black text-blue-700">출고 정보 등록</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    모든 상품의 준비가 완료되었습니다.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    택배사
                  </span>
                  <select
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">택배사 선택</option>
                    <option value="CJ대한통운">CJ대한통운</option>
                    <option value="한진택배">한진택배</option>
                    <option value="롯데택배">롯데택배</option>
                    <option value="로젠택배">로젠택배</option>
                    <option value="우체국택배">우체국택배</option>
                    {/* 실제 배송 없이 배송추적 데모/테스트용 더미 캐리어 */}
                    <option value="리머지택배">리머지택배</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    운송장 번호
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(event) =>
                        setTrackingNumber(
                          event.target.value.replace(/[^0-9A-Za-z:-]/g, "")
                        )
                      }
                      placeholder={
                        carrier === "리머지택배"
                          ? "예: 2026-07-07T09:00:00Z"
                          : "운송장 번호 입력"
                      }
                      className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {carrier === "리머지택배" && (
                      <button
                        type="button"
                        onClick={() =>
                          setTrackingNumber(getDummyTrackingNumber())
                        }
                        className="h-11 shrink-0 whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        자동 채우기
                      </button>
                    )}
                  </div>
                  <span className="mt-1.5 block text-[11px] text-slate-400">
                    {carrier === "리머지택배"
                      ? "리머지택배는 실제 운송장 번호 대신 \"yyyy-MM-ddTHH:00:00Z\"(3시간 단위, UTC) 형식의 테스트 번호만 조회됩니다. 아무 숫자나 넣으면 조회에 실패해요 — 오른쪽 \"자동 채우기\"를 눌러주세요."
                      : "숫자와 하이픈(-)만 입력, 8~30자"}
                  </span>
                </label>

                <button
                  type="button"
                  disabled={
                    !carrier ||
                    !trackingNumber.trim() ||
                    isRegisteringShipment
                  }
                  onClick={() => void handleRegisterShipment()}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Truck size={16} />
                  {isRegisteringShipment ? "처리 중" : "배송 시작"}
                </button>
              </div>
            </section>
          )}

          <section className="order-2 mt-17 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-base font-black text-slate-950">
              <CreditCard size={17} className="text-blue-700" />
              주문 금액 요약
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">상품 금액</dt>
                <dd>{order.amountSummary.subtotalAmount.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">배송비</dt>
                <dd>{order.amountSummary.shippingFee.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">플랫폼 수수료</dt>
                <dd>{order.amountSummary.platformFee.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">결제 수단</dt>
                <dd>
                  {order.amountSummary.paymentMethod
                    ? paymentMethodLabel[order.amountSummary.paymentMethod]
                    : "미등록"}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
                <dt className="font-black text-slate-950">최종 금액</dt>
                <dd className="text-xl font-black text-blue-700">
                  {order.amountSummary.totalAmount.toLocaleString()}원
                </dd>
              </div>
            </dl>
          </section>

          <section className="order-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-base font-black text-slate-950">
              <MapPin size={17} className="text-blue-700" />
              배송 정보
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="mb-1 text-xs font-semibold text-slate-400">수령인</dt>
                <dd className="font-medium">
                  {order.delivery.receiverName} · {order.delivery.receiverPhone}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold text-slate-400">배송지</dt>
                <dd className="leading-6">
                  {order.delivery.receiverZipcode &&
                    `[${order.delivery.receiverZipcode}] `}
                  {order.delivery.receiverAddress}{" "}
                  {order.delivery.receiverAddressDetail}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold text-slate-400">
                  배송 요청사항
                </dt>
                <dd>{order.delivery.receiverMemo || "요청사항 없음"}</dd>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <dt className="mb-1 text-xs font-semibold text-slate-400">
                  운송 정보
                </dt>
                <dd>
                  {order.delivery.carrier && order.delivery.trackingNumber
                    ? `${order.delivery.carrier} ${order.delivery.trackingNumber}`
                    : "운송장 미등록"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
      </main>
    </div>
  );
}