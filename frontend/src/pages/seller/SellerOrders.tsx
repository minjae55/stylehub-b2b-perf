import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/api/axios";

type SellerOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTE"
  | "REFUNDED"
  | "CANCELED";

type SellerOrder = {
  orderId: number;
  orderNo: string;
  buyerReference: string;
  representativeProductName: string;
  itemCount: number;
  totalQuantity: number;
  assignedItemCount: number;
  assignedToMe: boolean;
  isSample: boolean;
  status: SellerOrderStatus;
  totalAmount: number;
  orderedAt: string;
  shipBy: string;
  isOverdue: boolean;
  preparation?: {
    totalItemCount: number;
    readyItemCount: number;
    allItemsReady: boolean;
  };
  myWaitingItemCount?: number;
};

type SellerOrderListResponse = {
  orderId: number;
  orderNo: string;
  orderStatus: SellerOrderStatus;
  isSample: boolean;
  representativeProductName: string;
  itemCount: number;
  totalQuantity: number;
  productAmount: number;
  createdAt: string;
  preparation: {
    totalItemCount: number;
    readyItemCount: number;
    allItemsReady: boolean;
  };
  myWaitingItemCount: number;
};

const initialOrders: SellerOrder[] = [
  {
    orderId: 100,
    orderNo: "ORD-20260629-19A8E72B",
    buyerReference: "바이어 주문 #1060",
    representativeProductName: "시어서커 퍼프 블라우스",
    itemCount: 2,
    totalQuantity: 120,
    assignedItemCount: 1,
    assignedToMe: true,
    isSample: false,
    status: "PENDING",
    totalAmount: 1320000,
    orderedAt: "2026. 06. 29. 11:08",
    shipBy: "-",
    isOverdue: false,
  },
  {
    orderId: 101,
    orderNo: "ORD-20260629-8F2A31C4",
    buyerReference: "바이어 주문 #1042",
    representativeProductName: "크롭 반팔 티셔츠",
    itemCount: 2,
    totalQuantity: 150,
    assignedItemCount: 1,
    assignedToMe: true,
    isSample: false,
    status: "CONFIRMED",
    totalAmount: 825000,
    orderedAt: "2026. 06. 29. 10:24",
    shipBy: "2026. 07. 01.",
    isOverdue: false,
  },
  {
    orderId: 102,
    orderNo: "ORD-20260629-4BC920D1",
    buyerReference: "바이어 주문 #1051",
    representativeProductName: "린넨 오버핏 블라우스",
    itemCount: 1,
    totalQuantity: 80,
    assignedItemCount: 1,
    assignedToMe: true,
    isSample: false,
    status: "PREPARING",
    totalAmount: 960000,
    orderedAt: "2026. 06. 29. 09:10",
    shipBy: "2026. 06. 30.",
    isOverdue: false,
  },
  {
    orderId: 103,
    orderNo: "ORD-20260628-A71D45E2",
    buyerReference: "바이어 주문 #1028",
    representativeProductName: "골지 니트 가디건",
    itemCount: 3,
    totalQuantity: 210,
    assignedItemCount: 2,
    assignedToMe: false,
    isSample: false,
    status: "PREPARING",
    totalAmount: 2310000,
    orderedAt: "2026. 06. 28. 15:42",
    shipBy: "2026. 06. 29.",
    isOverdue: true,
  },
  {
    orderId: 104,
    orderNo: "ORD-20260628-22E09B76",
    buyerReference: "바이어 주문 #1009",
    representativeProductName: "와이드 밴딩 슬랙스",
    itemCount: 1,
    totalQuantity: 2,
    assignedItemCount: 1,
    assignedToMe: true,
    isSample: true,
    status: "SHIPPED",
    totalAmount: 18000,
    orderedAt: "2026. 06. 28. 11:05",
    shipBy: "2026. 06. 28.",
    isOverdue: false,
  },
  {
    orderId: 105,
    orderNo: "ORD-20260627-C91A5530",
    buyerReference: "바이어 주문 #997",
    representativeProductName: "플리츠 롱스커트",
    itemCount: 2,
    totalQuantity: 120,
    assignedItemCount: 1,
    assignedToMe: false,
    isSample: false,
    status: "DELIVERED",
    totalAmount: 1440000,
    orderedAt: "2026. 06. 27. 14:18",
    shipBy: "2026. 06. 28.",
    isOverdue: false,
  },
];

const statusConfig: Record<
  SellerOrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "결제 대기",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  CONFIRMED: {
    label: "결제 완료",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PREPARING: {
    label: "출고 준비",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  SHIPPED: {
    label: "배송 중",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  DELIVERED: {
    label: "배송 완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  COMPLETED: {
    label: "거래 완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  DISPUTE: {
    label: "이의제기",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  REFUNDED: {
    label: "환불 완료",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  CANCELED: {
    label: "주문 취소",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

const statusGuide: Record<
  SellerOrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "바이어 결제 대기",
    className: "text-slate-400",
  },
  CONFIRMED: {
    label: "상품 준비 필요",
    className: "text-blue-700",
  },
  PREPARING: {
    label: "출고 처리 중",
    className: "text-amber-700",
  },
  SHIPPED: {
    label: "배송 진행 중",
    className: "text-sky-700",
  },
  DELIVERED: {
    label: "거래 확정 대기",
    className: "text-emerald-700",
  },
  COMPLETED: {
    label: "처리 완료",
    className: "text-slate-400",
  },
  DISPUTE: {
    label: "이의제기 확인 필요",
    className: "text-rose-600",
  },
  REFUNDED: {
    label: "환불 처리 완료",
    className: "text-slate-400",
  },
  CANCELED: {
    label: "처리 종료",
    className: "text-slate-400",
  },
};

const statusFilters: Array<{
  value: "ALL" | "SHIPMENT_PENDING" | SellerOrderStatus;
  label: string;
}> = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "결제 대기" },
  { value: "CONFIRMED", label: "결제 완료" },
  { value: "SHIPMENT_PENDING", label: "출고 대기" },
  { value: "SHIPPED", label: "배송 중" },
  { value: "DELIVERED", label: "배송 완료" },
  { value: "COMPLETED", label: "거래 완료" },
];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function matchesStatus(
  status: SellerOrderStatus,
  filter: string
) {
  if (filter === "ALL") return true;
  if (filter === "SHIPMENT_PENDING") {
    return status === "CONFIRMED" || status === "PREPARING";
  }
  return status === filter;
}

export function SellerOrders() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const isPresident = user?.role === "PRESIDENT" || user?.role === "ADMIN";
  const isDemo = searchParams.get("demo") === "seller-orders";
  const requestedStatus = searchParams.get("status") ?? "ALL";
  const activeStatus = statusFilters.some(
    (filter) => filter.value === requestedStatus
  )
    ? requestedStatus
    : "ALL";

  useEffect(() => {
    if (isDemo) {
      setOrders(initialOrders);
      setIsLoading(false);
      return;
    }

    const loadSellerOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const response =
          await api.get<SellerOrderListResponse[]>("/seller/orders");

        setOrders(
          response.map((order) => ({
            orderId: order.orderId,
            orderNo: order.orderNo,
            buyerReference: "판매 주문",
            representativeProductName: order.representativeProductName,
            itemCount: order.itemCount,
            totalQuantity: order.totalQuantity,
            assignedItemCount: order.itemCount,
            assignedToMe: !isPresident,
            isSample: order.isSample,
            status: order.orderStatus,
            totalAmount: order.productAmount,
            orderedAt: new Date(order.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            shipBy: "-",
            isOverdue: false,
            preparation: order.preparation,
            myWaitingItemCount: order.myWaitingItemCount,
          }))
        );
      } catch (error) {
        console.error("셀러 주문 목록 조회 실패", error);
        setLoadError("주문 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSellerOrders();
  }, [isDemo, isPresident]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        order.orderNo.toLowerCase().includes(normalizedQuery) ||
        order.representativeProductName
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesQuery &&
        matchesStatus(order.status, activeStatus)
      );
    });
  }, [activeStatus, orders, searchQuery]);

  const scopeOrders = orders;

  const counts = {
    pending: scopeOrders.filter((order) => order.status === "PENDING").length,
    confirmed: scopeOrders.filter((order) => order.status === "CONFIRMED").length,
    preparing: scopeOrders.filter((order) => order.status === "PREPARING").length,
    shipped: scopeOrders.filter((order) => order.status === "SHIPPED").length,
    overdue: scopeOrders.filter(
      (order) =>
        order.isOverdue &&
        (order.status === "CONFIRMED" || order.status === "PREPARING")
    ).length,
  };

  const handleStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === "ALL") next.delete("status");
    else next.set("status", status);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">판매 관리</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              주문 관리
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              담당 상품의 주문을 확인하고 출고 상태를 관리합니다.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm">
            {isPresident ? "회사 전체 주문" : "내 담당 주문"}
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "결제 대기",
              value: counts.pending,
              icon: <Clock3 size={17} />,
              tone: "text-slate-600 bg-slate-100",
            },
            {
              label: "결제 완료",
              value: counts.confirmed,
              icon: <CheckCircle2 size={17} />,
              tone: "text-blue-700 bg-blue-50",
            },
            {
              label: "출고 준비",
              value: counts.preparing,
              icon: <PackageCheck size={17} />,
              tone: "text-amber-700 bg-amber-50",
            },
            {
              label: "배송 중",
              value: counts.shipped,
              icon: <Truck size={17} />,
              tone: "text-sky-700 bg-sky-50",
            },
            {
              label: "기한 경과",
              value: counts.overdue,
              icon: <AlertTriangle size={17} />,
              tone: "text-rose-700 bg-rose-50",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-y border-slate-200 bg-white px-4 py-4 sm:border sm:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{item.label}</p>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${item.tone}`}
                >
                  {item.icon}
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {item.value}
                <span className="ml-1 text-sm font-bold text-slate-400">건</span>
              </p>
            </div>
          ))}
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 pt-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-1 overflow-x-auto">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusFilter(filter.value)}
                    className={`h-9 shrink-0 border-b-2 px-3 text-sm font-bold transition-colors ${
                      activeStatus === filter.value
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <label className="relative mb-3 block w-full lg:w-80">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="주문번호 또는 상품명 검색"
                  className="h-10 w-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-left">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="w-[16%] px-5 py-3">주문</th>
                  <th className="w-[22%] px-4 py-3">담당 상품</th>
                  <th className="w-[10%] px-4 py-3">상태</th>
                  <th className="w-[12%] px-4 py-3">주문일</th>
                  <th className="w-[10%] px-4 py-3">출고 기한</th>
                  <th className="w-[11%] px-4 py-3 text-right">상품 금액</th>
                  <th className="w-[19%] px-5 py-3 text-right">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                      주문 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                )}
                {!isLoading && loadError && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-rose-600">
                      {loadError}
                    </td>
                  </tr>
                )}
                {visibleOrders.map((order) => {
                  const status = statusConfig[order.status];
                  const preparation = order.preparation;
                  const isPreparationStatus =
                    order.status === "CONFIRMED" ||
                    order.status === "PREPARING";

                  return (
                    <tr
                      key={order.orderId}
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/seller/orders/${order.orderId}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          navigate(`/seller/orders/${order.orderId}`);
                        }
                      }}
                      className="cursor-pointer align-middle transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/seller/orders/${order.orderId}`}
                            className="font-mono text-sm font-black text-slate-950 hover:text-primary"
                          >
                            {order.orderNo}
                          </Link>
                          {order.isSample && (
                            <span className="border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                              샘플
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {order.buyerReference}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <PackageCheck
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {order.representativeProductName}
                              {order.itemCount > 1 &&
                                ` 외 ${order.itemCount - 1}건`}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              총 {order.totalQuantity.toLocaleString()}개 · 내
                              담당 {order.assignedItemCount}품목
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex border px-2 py-1 text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                        {order.orderedAt}
                      </td>
                      <td className="px-4 py-4">
                        <p
                          className={`text-sm font-bold ${
                            order.isOverdue ? "text-rose-600" : "text-slate-700"
                          }`}
                        >
                          {order.shipBy}
                        </p>
                        {order.isOverdue && (
                          <p className="mt-1 text-xs font-bold text-rose-500">
                            기한 경과
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-black text-slate-950">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPreparationStatus && preparation ? (
                            <div className="min-w-[150px] text-right">
                              <p className="text-xs font-bold text-slate-700">
                                준비 완료 {preparation.readyItemCount} /{" "}
                                {preparation.totalItemCount}
                              </p>
                              <p
                                className={`mt-1 text-[11px] font-semibold ${
                                  preparation.allItemsReady
                                    ? "text-emerald-700"
                                    : order.myWaitingItemCount &&
                                        order.myWaitingItemCount > 0
                                      ? "text-amber-700"
                                      : "text-slate-400"
                                }`}
                              >
                                {preparation.allItemsReady
                                  ? "전체 준비 완료"
                                  : !isPresident &&
                                      (order.myWaitingItemCount ?? 0) === 0
                                    ? "내 담당 완료 · 다른 담당자 대기"
                                    : !isPresident
                                      ? `내 담당 ${order.myWaitingItemCount}개 준비 필요`
                                      : `미완료 ${preparation.totalItemCount - preparation.readyItemCount}개`}
                              </p>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex h-9 items-center text-xs font-semibold ${statusGuide[order.status].className}`}
                            >
                              {statusGuide[order.status].label}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && !loadError && visibleOrders.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Clock3 size={36} className="text-slate-300" />
              <p className="mt-3 text-base font-black text-slate-800">
                조건에 맞는 주문이 없습니다.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                검색어 또는 주문 상태를 다시 확인해 주세요.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
