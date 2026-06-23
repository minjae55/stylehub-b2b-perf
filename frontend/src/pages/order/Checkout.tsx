import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import api from "@/api/axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  FileText,
  LockKeyhole,
  MapPin,
  Package,
  PenLine,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

type OrderItem = {
  id: number;
  name: string;
  supplier: string;
  price: number;
  quantity: number;
  image: string;
};

type CheckoutLocationState = {
  cartItemIds: number[];
  cartType: "NORMAL" | "SAMPLE";
};

type CheckoutPreviewResponse = {
  cartType: "NORMAL" | "SAMPLE";
  items: Array<{
    cartItemId: number;
    productName: string;
    optionLabel: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  productAmount: number;
  shippingFee: number;
  totalAmount: number;
};

type OrderCreateResponse = {
  orderNos: string[];
  totalAmount: number;
};

type DeliveryAddress = {
  addressId: number;
  addressName: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
};

type AddressCreateRequest = {
  addressName: string;
  zipcode: string;
  address: string;
  addressDetail: string;
};

const EMPTY_ADDRESS_FORM: AddressCreateRequest = {
  addressName: "",
  zipcode: "",
  address: "",
  addressDetail: "",
};

const READY_ITEMS: OrderItem[] = [
  {
    id: 1,
    name: "여성 베이지 오버핏 셔츠",
    supplier: "라온패션",
    price: 18900,
    quantity: 50,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=120&h=120&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "여성 와이드 슬랙스",
    supplier: "모던클로젯",
    price: 24500,
    quantity: 30,
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=120&h=120&fit=crop&auto=format",
  },
];

const CUSTOM_ITEMS: Record<string, OrderItem[]> = {
  "ORD-2024-0901": [
    {
      id: 1,
      name: "여성 린넨 오버핏 블라우스 (주문제작)",
      supplier: "르블랑 어패럴",
      price: 14000,
      quantity: 200,
      image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=120&h=120&fit=crop",
    },
  ],
};

const isSignedMap: Record<string, boolean> = {
  "ORD-2024-0901": false,
};

const TOSS_CLIENT_KEY = "test_ck_GePWvyJnrKme6gpAnkz63gLzN97E";

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export function Checkout() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const checkoutState = location.state as CheckoutLocationState | null;

  const orderType = checkoutState?.cartType === "SAMPLE"
    ? "sample"
    : searchParams.get("type") ?? "ready";
  const orderId = searchParams.get("orderId") ?? "";

  const isCustom = orderType === "custom";
  const isSample = orderType === "sample";
  const isSigned = isCustom ? (isSignedMap[orderId] ?? false) : true;

  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(!isCustom);
  const [previewError, setPreviewError] = useState("");
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [addressForm, setAddressForm] = useState<AddressCreateRequest>(EMPTY_ADDRESS_FORM);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (isCustom) {
      setIsPreviewLoading(false);
      return;
    }

    if (!checkoutState?.cartItemIds.length) {
      setPreviewError("선택한 장바구니 상품이 없습니다.");
      setIsPreviewLoading(false);
      return;
    }

    const loadCheckoutPreview = async () => {
      try {
        const response = await api.post<CheckoutPreviewResponse>("/checkout/preview", {
          cartItemIds: checkoutState.cartItemIds,
          cartType: checkoutState.cartType,
        });
        setCheckoutPreview(response.data);
      } catch (error) {
        const apiError = error as { response?: { status?: number; data?: unknown } };
        console.error(
          "Checkout 조회 실패",
          apiError.response?.status,
          JSON.stringify(apiError.response?.data),
        );
        setPreviewError("주문 정보를 불러오지 못했습니다. 장바구니에서 다시 시도해주세요.");
      } finally {
        setIsPreviewLoading(false);
      }
    };

    void loadCheckoutPreview();
  }, [checkoutState, isCustom]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await api.get<DeliveryAddress[]>("/checkout/address");
        setAddresses(response.data);
        setSelectedAddress(response.data.find((address) => address.isDefault) ?? null);
      } catch (error) {
        console.error("배송지 조회 실패", error);
        setAddressError("배송지 목록을 불러오지 못했습니다.");
      } finally {
        setIsAddressLoading(false);
      }
    };

    void loadAddresses();
  }, []);

  const orderItems: OrderItem[] = checkoutPreview
    ? checkoutPreview.items.map((item) => ({
        id: item.cartItemId,
        name: item.productName,
        supplier: item.optionLabel,
        price: item.unitPrice,
        quantity: item.quantity,
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=120&h=120&fit=crop&auto=format",
      }))
    : isCustom
      ? CUSTOM_ITEMS[orderId] ?? READY_ITEMS
      : [];
  const [paymentMethod, setPaymentMethod] = useState<"wire" | "card">("wire");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [createdOrderNumbers, setCreatedOrderNumbers] = useState<string[]>([]);
  const [createdOrderTotal, setCreatedOrderTotal] = useState(0);
  const [isTestOrderLoading, setIsTestOrderLoading] = useState(false);
  const [testOrderError, setTestOrderError] = useState("");

  const subtotal = checkoutPreview?.productAmount
    ?? orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = checkoutPreview?.shippingFee
    ?? (isCustom ? (subtotal >= 1000000 ? 0 : 3000) : 0);
  const total = checkoutPreview?.totalAmount ?? subtotal + shipping;

  if (isPreviewLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        주문 정보를 확인하고 있습니다.
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={36} className="mx-auto mb-4 text-rose-500" />
          <p className="mb-5 text-sm font-semibold text-slate-700">{previewError}</p>
          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            장바구니로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
  const orderTypeLabel = isCustom ? "소싱 주문" : isSample ? "샘플 주문" : "일반 주문";

  const handleAddressFormChange = (field: keyof AddressCreateRequest, value: string) => {
    setAddressForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!addressForm.addressName.trim() || !addressForm.address.trim()) {
      setAddressSaveError("배송지 이름과 주소를 입력해 주세요.");
      return;
    }

    try {
      setIsAddressSaving(true);
      setAddressSaveError("");

      const response = await api.post<DeliveryAddress>("/checkout/address", addressForm);
      setAddresses((previous) => [...previous, response.data]);
      setSelectedAddress(response.data);
      setAddressForm(EMPTY_ADDRESS_FORM);
      setShowAddressForm(false);
      setShowAddressModal(false);
    } catch (error) {
      console.error("배송지 등록 실패", error);
      setAddressSaveError("배송지를 등록하지 못했습니다.");
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!agreeTerms || !isSigned || !selectedAddress || isPaymentLoading) return;

    const newOrderNumber = `STYLEHUB${Date.now()}`;

    try {
      setIsPaymentLoading(true);

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });
      const orderName = orderItems.length > 1
        ? `${orderItems[0].name} 외 ${orderItems.length - 1}건`
        : orderItems[0].name;
      const commonRequest = {
        amount: { currency: "KRW" as const, value: total },
        orderId: newOrderNumber,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: "구매 담당자",
      };

      if (paymentMethod === "card") {
        await payment.requestPayment({
          method: "CARD",
          ...commonRequest,
        });
        return;
      }

      await payment.requestPayment({
        method: "VIRTUAL_ACCOUNT",
        ...commonRequest,
      });
    } catch (error) {
      console.error("토스 결제창 호출 실패", error);
      alert("결제창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setIsPaymentLoading(false);
    }
  };

  const handleTestOrder = async () => {
    if (!checkoutState?.cartItemIds.length || !selectedAddress || isTestOrderLoading) return;

    try {
      setIsTestOrderLoading(true);
      setTestOrderError("");

      const response = await api.post<OrderCreateResponse>("/orders", {
        cartItemIds: checkoutState.cartItemIds,
        addressId: selectedAddress.addressId,
        cartType: checkoutState.cartType,
      });

      setCreatedOrderNumbers(response.data.orderNos);
      setCreatedOrderTotal(response.data.totalAmount);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("임시 주문 생성 실패", error);
      setTestOrderError("주문 생성에 실패했습니다. 백엔드 로그를 확인해 주세요.");
    } finally {
      setIsTestOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1180px]">
        <Link
          to="/cart"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary"
        >
          <ArrowLeft size={16} />
          장바구니로 돌아가기
        </Link>

        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                <ReceiptText size={13} />
                주문/결제
              </div>
              <h1 className="text-2xl font-bold text-slate-950">주문 정보를 확인하고 결제를 진행하세요</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                결제 완료 후 판매자에게 주문이 전달되고 배송 준비가 시작됩니다.
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-secondary px-4 py-3 text-sm">
              <p className="text-xs font-bold text-primary">주문 타입</p>
              <p className="mt-1 font-black text-slate-950">{orderTypeLabel}</p>
            </div>
          </div>
        </header>

        {isCustom && !isSigned && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-4">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="font-bold text-amber-900">전자서명이 필요합니다</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  소싱 주문은 결제 전 계약서 서명이 완료되어야 합니다.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/custom/${orderId}/sign`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
                >
                  <PenLine size={14} />
                  전자서명 하러 가기
                </button>
              </div>
            </div>
          </div>
        )}

        {isCustom && isSigned && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle size={16} />
            전자서명이 완료되었습니다. 결제를 진행해 주세요.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={<MapPin size={16} />} title="배송지 정보" />
              <div className="rounded-xl border border-primary/15 bg-secondary/50 p-4">
                {isAddressLoading ? (
                  <p className="text-sm font-semibold text-slate-500">배송지 목록을 불러오고 있습니다.</p>
                ) : selectedAddress ? (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-bold text-primary">{selectedAddress.addressName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-secondary"
                      >
                        변경
                      </button>
                    </div>
                    <div className="rounded-lg border border-white bg-white p-4 shadow-sm">
                      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                        <InfoRow label="우편번호" value={selectedAddress.zipcode} />
                        <InfoRow label="주소" value={selectedAddress.address} className="md:col-span-2" />
                        <InfoRow label="상세주소" value={selectedAddress.addressDetail} className="md:col-span-2" />
                      </div>
                      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        결제 완료 시 이 주소로 배송 정보가 확정됩니다.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-600">
                      {addressError || "선택된 배송지가 없습니다."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
                    >
                      {addresses.length > 0 ? "배송지 선택" : "배송지 등록"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-bold text-slate-700">배송 요청사항</label>
                <textarea
                  placeholder="배송 시 요청사항을 입력하세요."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10"
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={<CreditCard size={16} />} title="결제 방법" />
              <div className="grid gap-3 md:grid-cols-2">
                <PaymentMethodCard
                  active={paymentMethod === "wire"}
                  title="무통장 입금"
                  description="입금 확인 후 주문이 진행됩니다."
                  onClick={() => setPaymentMethod("wire")}
                />
                <PaymentMethodCard
                  active={paymentMethod === "card"}
                  title="법인카드 결제"
                  description="법인카드로 즉시 결제합니다."
                  onClick={() => setPaymentMethod("card")}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={<Truck size={16} />} title="결제 후 진행 흐름" />
              <div className="grid gap-3 md:grid-cols-4">
                <StepCard label="1" title="결제 완료" desc="주문 확정" />
                <StepCard label="2" title="출고 준비" desc="셀러 확인" />
                <StepCard label="3" title="배송 시작" desc="송장 등록" />
                <StepCard label="4" title="거래 확정" desc="수령 후 완료" />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={<FileText size={16} />} title="주문 동의" />
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm leading-6 text-slate-700">
                  <span className="font-bold text-slate-950">
                    주문 상품, 배송지, 결제 금액을 확인했으며 구매에 동의합니다.
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    상품 금액, 배송비, 플랫폼 이용 수수료를 확인했습니다.
                  </span>
                </span>
              </label>
            </section>
          </main>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-950">주문 상품</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-primary">
                  {orderItems.length}개
                </span>
              </div>

              <div className="mb-5 max-h-[300px] space-y-3 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950">{item.name}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">{item.supplier}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">{item.quantity.toLocaleString()}벌</span>
                        <span className="text-sm font-black text-slate-950">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <SummaryRow label="상품 금액" value={formatPrice(subtotal)} />
                <SummaryRow label="국내 배송비" value={shipping === 0 ? "무료" : formatPrice(shipping)} />
              </div>

              <div className="flex items-end justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-500">최종 결제 금액</p>
                  <p className="mt-1 text-xs text-slate-400">배송지와 결제 조건 확인 후 결제</p>
                </div>
                <p className="whitespace-nowrap text-2xl font-black text-primary">{formatPrice(total)}</p>
              </div>

              {isCustom && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                    isSigned
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {isSigned ? <CheckCircle size={13} /> : <PenLine size={13} />}
                  {isSigned ? "전자서명 완료" : "전자서명 대기 중"}
                </div>
              )}

              <button
                type="button"
                disabled={!agreeTerms || !selectedAddress || (isCustom && !isSigned) || isPaymentLoading}
                onClick={handlePayment}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold transition ${
                  agreeTerms && selectedAddress && (!isCustom || isSigned) && !isPaymentLoading
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                <LockKeyhole size={15} />
                {isPaymentLoading
                  ? "결제창을 불러오는 중..."
                  : !agreeTerms
                  ? "약관에 동의해 주세요"
                  : !selectedAddress
                    ? "배송지를 선택해 주세요"
                  : isCustom && !isSigned
                    ? "전자서명 후 결제 가능"
                    : `${formatPrice(total)} 결제하기`}
              </button>

              {import.meta.env.DEV && !isCustom && (
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={!selectedAddress || isTestOrderLoading || createdOrderNumbers.length > 0}
                    onClick={handleTestOrder}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-secondary/50 px-4 py-2.5 text-xs font-bold text-primary transition hover:border-primary hover:bg-secondary disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <ReceiptText size={14} />
                    {isTestOrderLoading
                      ? "주문 생성 중..."
                      : createdOrderNumbers.length > 0
                        ? "주문 생성 완료"
                        : "개발용: 결제 없이 주문 생성"}
                  </button>
                  {testOrderError && (
                    <p className="mt-2 text-center text-xs font-medium text-rose-600">{testOrderError}</p>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-primary/15 bg-white px-3 py-3 text-xs leading-5 text-slate-500">
                <div className="mb-1 flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck size={13} className="text-primary" />
                  안전결제 보장
                </div>
                결제 대금은 안전하게 보호되며, 거래 완료 확인 후 셀러에게 정산됩니다.
              </div>
            </div>
          </aside>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900"
              >
                <X size={20} />
              </button>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <CheckCircle size={48} className="text-primary" />
              </div>
              <h2 className="mb-2 text-center text-2xl font-bold text-slate-950">주문 생성 완료</h2>
              <p className="mb-6 text-center text-sm text-slate-500">
                판매사별로 {createdOrderNumbers.length}개의 주문이 생성되었습니다.
              </p>
              <div className="mb-6 rounded-xl border border-primary/20 bg-secondary/60 p-5 text-sm">
                <p className="mb-2 text-xs font-bold text-slate-500">생성된 주문번호</p>
                <div className="space-y-2">
                  {createdOrderNumbers.map((createdOrderNumber) => (
                    <div
                      key={createdOrderNumber}
                      className="rounded-lg border border-primary/15 bg-white px-3 py-2 font-bold text-slate-900"
                    >
                      {createdOrderNumber}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <SummaryRow label="주문 타입" value={orderTypeLabel} />
                </div>
                <div className="mt-3 border-t border-primary/20 pt-3">
                  <SummaryRow label="주문 총액" value={formatPrice(createdOrderTotal)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  홈으로
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/orders")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  <ShoppingBag size={18} />
                  주문 내역
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  setAddressSaveError("");
                  setShowAddressModal(false);
                }}
                className="absolute right-5 top-5 text-slate-400 transition hover:text-slate-900"
              >
                <X size={20} />
              </button>

              <div className="mb-5 pr-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                  <MapPin size={13} />
                  배송지 변경
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  {addresses.length === 0 || showAddressForm
                    ? "배송지를 등록하세요"
                    : "회사 배송지를 선택하세요"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {addresses.length === 0
                    ? "처음 등록한 배송지는 이번 주문의 수령지로 선택됩니다."
                    : "선택한 배송지는 이번 주문의 수령지로 적용됩니다."}
                </p>
              </div>

              {addresses.length === 0 || showAddressForm ? (
                <form className="space-y-4" onSubmit={handleAddressSubmit}>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setAddressSaveError("");
                      }}
                      className="text-sm font-bold text-primary transition hover:text-primary/80"
                    >
                      배송지 목록으로 돌아가기
                    </button>
                  )}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    등록된 배송지가 없습니다. 이번 주문에 사용할 배송지를 등록해 주세요.
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AddressInput
                      label="배송지 이름"
                      value={addressForm.addressName}
                      placeholder="예: 본사, 물류창고"
                      onChange={(value) => handleAddressFormChange("addressName", value)}
                    />
                    <AddressInput
                      label="우편번호"
                      value={addressForm.zipcode}
                      placeholder="우편번호"
                      onChange={(value) => handleAddressFormChange("zipcode", value)}
                    />
                    <AddressInput
                      label="주소"
                      value={addressForm.address}
                      placeholder="도로명 주소"
                      onChange={(value) => handleAddressFormChange("address", value)}
                      className="sm:col-span-2"
                    />
                    <AddressInput
                      label="상세주소"
                      value={addressForm.addressDetail}
                      placeholder="동, 호수 등 상세주소"
                      onChange={(value) => handleAddressFormChange("addressDetail", value)}
                      className="sm:col-span-2"
                    />
                  </div>
                  {addressSaveError && (
                    <p className="text-sm font-semibold text-rose-600">{addressSaveError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isAddressSaving}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddressSaving ? "등록 중..." : "배송지 등록하기"}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm(EMPTY_ADDRESS_FORM);
                      setAddressSaveError("");
                      setShowAddressForm(true);
                    }}
                    className="w-full rounded-lg border border-dashed border-primary/40 bg-secondary/40 px-4 py-3 text-sm font-bold text-primary transition hover:border-primary hover:bg-secondary"
                  >
                    새 배송지 등록
                  </button>
                  {addresses.map((address) => {
                    const isSelected = selectedAddress?.addressId === address.addressId;

                    return (
                      <button
                        key={address.addressId}
                        type="button"
                        onClick={() => {
                          setSelectedAddress(address);
                          setShowAddressForm(false);
                          setShowAddressModal(false);
                        }}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isSelected
                            ? "border-primary bg-secondary/70"
                            : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-950">{address.addressName}</p>
                              {address.isDefault && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                                  기본
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              [{address.zipcode}] {address.address} {address.addressDetail}
                            </p>
                          </div>
                          <span
                            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isSelected ? "border-primary bg-primary text-white" : "border-slate-200 text-transparent"
                            }`}
                          >
                            <CheckCircle size={15} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                결제 시 선택한 배송지가 주문 수령 정보로 저장됩니다.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
    </div>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AddressInput({
  label,
  value,
  placeholder,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10"
      />
    </label>
  );
}

function PaymentMethodCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active ? "border-primary bg-secondary/70" : "border-slate-200 bg-white hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
            active ? "border-primary bg-primary" : "border-slate-300"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-950">{title}</span>
          <span className="mt-1 block text-xs text-slate-500">{description}</span>
        </span>
      </div>
    </button>
  );
}

function StepCard({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {label}
      </div>
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
