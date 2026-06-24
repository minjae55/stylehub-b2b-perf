import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "@/api/axios";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FlaskConical,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";


type CartItem = {
  cartItemId: number;
  productId: number;
  productOptionId: number;
  productName: string;
  optionLabel: string;
  options: Array<{
    optionName: string;
    optionValue: string;
  }>;
  unitPrice: number;
  moq: number;
  quantity: number;
  totalPrice: number;
  isChecked: boolean;
  sampleAvailable: boolean;
  samplePrice?: number | null;
  sampleMaxQuantity?: number;
  sellerId?: number;
  sellerName?: string;
  shippingFee?: number;
  freeShippingThreshold?: number;
  cartType: "NORMAL" | "SAMPLE";
};

type CartApiItem = Omit<CartItem, "sellerId" | "shippingFee"> & {
  companyId: number;
  baseShippingFee: number;
};

type CartTab = "BULK" | "SAMPLE";

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function getSampleMaxQuantity(item: CartItem) {
  return Math.max(1, item.sampleMaxQuantity ?? 5);
}

function mapCartApiItems(apiItems: CartApiItem[]): CartItem[] {
  return apiItems.map(({ companyId, baseShippingFee, ...item }) => ({
    ...item,
    sellerId: companyId,
    shippingFee: baseShippingFee,
    freeShippingThreshold: item.freeShippingThreshold ?? 0,
  }));
}

function calculateShippingFee(selectedItems: CartItem[]) {
  const groups = selectedItems.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = String(item.sellerId ?? item.productId);
    acc[key] ??= [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.values(groups).reduce((totalShippingFee, groupItems) => {
    const groupSubtotal = groupItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const firstItem = groupItems[0];
    const shippingFee = firstItem?.shippingFee ?? 0;
    const freeShippingThreshold = firstItem?.freeShippingThreshold ?? 0;
    const isFreeShipping =
      freeShippingThreshold > 0 && groupSubtotal >= freeShippingThreshold;

    return totalShippingFee + (isFreeShipping ? 0 : shippingFee);
  }, 0);
}

const demoCartItems: CartItem[] = [
  {
    cartItemId: -1,
    productId: 101,
    productOptionId: 1001,
    productName: "베이직 크롭 반팔 티셔츠",
    optionLabel: "블랙 / M",
    options: [{ optionName: "색상", optionValue: "블랙" }, { optionName: "사이즈", optionValue: "M" }],
    unitPrice: 5500,
    moq: 100,
    quantity: 100,
    totalPrice: 550000,
    isChecked: true,
    sampleAvailable: true,
    sampleMaxQuantity: 3,
    sellerId: 11,
    sellerName: "스타일컴퍼니",
    shippingFee: 5000,
    freeShippingThreshold: 800000,
    cartType: "NORMAL",
  },
  {
    cartItemId: -2,
    productId: 102,
    productOptionId: 1002,
    productName: "핀턱 와이드 슬랙스",
    optionLabel: "차콜 / L",
    options: [{ optionName: "색상", optionValue: "차콜" }, { optionName: "사이즈", optionValue: "L" }],
    unitPrice: 12800,
    moq: 20,
    quantity: 20,
    totalPrice: 256000,
    isChecked: true,
    sampleAvailable: true,
    sampleMaxQuantity: 2,
    sellerId: 11,
    sellerName: "스타일컴퍼니",
    shippingFee: 5000,
    freeShippingThreshold: 800000,
    cartType: "NORMAL",
  },
  {
    cartItemId: -3,
    productId: 201,
    productOptionId: 2001,
    productName: "썸머 린넨 셔츠",
    optionLabel: "아이보리 / FREE",
    options: [{ optionName: "색상", optionValue: "아이보리" }, { optionName: "사이즈", optionValue: "FREE" }],
    unitPrice: 9200,
    moq: 50,
    quantity: 50,
    totalPrice: 460000,
    isChecked: true,
    sampleAvailable: false,
    sellerId: 22,
    sellerName: "동대문 어패럴",
    shippingFee: 3500,
    freeShippingThreshold: 600000,
    cartType: "NORMAL",
  },
  {
    cartItemId: -4,
    productId: 202,
    productOptionId: 2002,
    productName: "셔링 밴딩 롱스커트",
    optionLabel: "베이지 / FREE",
    options: [{ optionName: "색상", optionValue: "베이지" }, { optionName: "사이즈", optionValue: "FREE" }],
    unitPrice: 10500,
    moq: 10,
    quantity: 10,
    totalPrice: 105000,
    isChecked: true,
    sampleAvailable: true,
    sampleMaxQuantity: 2,
    sellerId: 22,
    sellerName: "동대문 어패럴",
    shippingFee: 3500,
    freeShippingThreshold: 600000,
    cartType: "NORMAL",
  },
  {
    cartItemId: -5,
    productId: 301,
    productOptionId: 3001,
    productName: "프리미엄 트위드 재킷",
    optionLabel: "핑크 / S",
    options: [{ optionName: "색상", optionValue: "핑크" }, { optionName: "사이즈", optionValue: "S" }],
    unitPrice: 24800,
    moq: 10,
    quantity: 10,
    totalPrice: 248000,
    isChecked: true,
    sampleAvailable: true,
    sampleMaxQuantity: 1,
    sellerId: 33,
    sellerName: "서울 부티크 도매",
    shippingFee: 3000,
    freeShippingThreshold: 0,
    cartType: "NORMAL",
  },
];

export function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSellerDemo = searchParams.get("demo") === "sellers";
  const [items, setItems] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<CartTab>("BULK");
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedSample, setSelectedSample] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [addingSampleOptionId, setAddingSampleOptionId] = useState<number | null>(null);
  const [updatingQuantityIds, setUpdatingQuantityIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadCart = async () => {
      try {
        if (isSellerDemo) {
          setItems(demoCartItems);
          setSelected(demoCartItems.map((item) => item.cartItemId));
          setSelectedSample([]);
          return;
        }

        const response = await api.get<CartApiItem[]>("/cart");
        const cartItems = mapCartApiItems(response);
        setItems(cartItems);
        setSelected(
          cartItems
            .filter((item) => item.cartType === "NORMAL" && item.isChecked)
            .map((item) => item.cartItemId)
        );
        setSelectedSample(
          cartItems
            .filter((item) => item.cartType === "SAMPLE" && item.isChecked)
            .map((item) => item.cartItemId)
        );
      } catch (error) {
        const apiError = error as { response?: { status?: number; data?: unknown } };
        console.error(
          "장바구니 조회 실패",
          apiError.response?.status,
          JSON.stringify(apiError.response?.data),
        );
        setErrorMessage("장바구니를 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCart();
  }, [isSellerDemo]);

  const bulkItems = items.filter((item) => item.cartType === "NORMAL");
  const sampleItems = items.filter((item) => item.cartType === "SAMPLE");
  const sampleOptionIds = new Set(sampleItems.map((item) => item.productOptionId));
  const bulkSelected = bulkItems.filter((item) => selected.includes(item.cartItemId));
  const sampleSelected = sampleItems.filter((item) => selectedSample.includes(item.cartItemId));
  const bulkSubtotal = bulkSelected.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const sampleSubtotal = sampleSelected.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const bulkValidIds = bulkItems
    .filter((item) => item.quantity >= item.moq)
    .map((item) => item.cartItemId);
  const sampleValidIds = sampleItems.map((item) => item.cartItemId);
  const allBulkSelected = bulkValidIds.length > 0 && selected.length === bulkValidIds.length;
  const allSampleSelected =
    sampleValidIds.length > 0 && selectedSample.length === sampleValidIds.length;
  const sortedBulkItems = [...bulkItems].sort((a, b) => {
    const aBlocked = a.quantity < a.moq;
    const bBlocked = b.quantity < b.moq;
    return Number(aBlocked) - Number(bBlocked);
  });
  const sellerGroups = Object.values(
    sortedBulkItems.reduce<Record<string, { sellerId: number; sellerName: string; items: CartItem[] }>>(
      (groups, item) => {
        const sellerId = item.sellerId ?? 0;
        const sellerName = item.sellerName ?? "판매자 정보 확인 중";
        const key = `${sellerId}-${sellerName}`;
        groups[key] ??= { sellerId, sellerName, items: [] };
        groups[key].items.push(item);
        return groups;
      },
      {}
    )
  );

  const updateQty = async (id: number, delta: number, type: "bulk" | "sample") => {
    const item = items.find((cartItem) => cartItem.cartItemId === id);
    if (!item || updatingQuantityIds.has(id)) return;

    const nextQuantity = item.quantity + delta;
    const minimum = type === "bulk" ? item.moq : 1;
    const maximum = type === "sample" ? getSampleMaxQuantity(item) : Number.MAX_SAFE_INTEGER;
    if (nextQuantity < minimum || nextQuantity > maximum) return;

    if (isSellerDemo) {
      setItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cartItemId === id
            ? { ...cartItem, quantity: nextQuantity, totalPrice: cartItem.unitPrice * nextQuantity }
            : cartItem
        )
      );
      return;
    }

    try {
      setUpdatingQuantityIds((prev) => new Set(prev).add(id));
      setItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cartItemId === id
            ? {
                ...cartItem,
                quantity: nextQuantity,
                totalPrice: cartItem.unitPrice * nextQuantity,
              }
            : cartItem
        )
      );

      const response = await api.patch<CartItem>(`/cart/${id}/quantity`, {
        quantity: nextQuantity,
      });
      if (response?.cartItemId === id) {
        setItems((prev) =>
          prev.map((cartItem) =>
            cartItem.cartItemId === id ? response : cartItem
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cartItemId === id ? item : cartItem
        )
      );
      window.alert("수량을 변경하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setUpdatingQuantityIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const removeItemFromState = (id: number) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== id));
    setSelected((prev) => prev.filter((selectedId) => selectedId !== id));
    setSelectedSample((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const removeItem = async (id: number) => {
    if (isSellerDemo) {
      removeItemFromState(id);
      return;
    }

    try {
      await api.delete(`/cart/${id}`);
      removeItemFromState(id);
    } catch (error) {
      const apiError = error as { response?: { status?: number; data?: unknown } };
      console.error(
        "장바구니 삭제 실패",
        apiError.response?.status,
        JSON.stringify(apiError.response?.data),
      );
      window.alert("장바구니 상품을 삭제하지 못했습니다. 다시 시도해주세요.");
    }
  };

  const handleAddSample = async (item: CartItem) => {
    if (!item.sampleAvailable || addingSampleOptionId !== null) return;

    if (isSellerDemo) {
      const sampleItem: CartItem = {
        ...item,
        cartItemId: item.cartItemId - 1000,
        quantity: 1,
        totalPrice: item.unitPrice,
        cartType: "SAMPLE",
      };
      setItems((prev) =>
        prev.some((cartItem) => cartItem.cartType === "SAMPLE" && cartItem.productOptionId === item.productOptionId)
          ? prev
          : [...prev, sampleItem]
      );
      setSelectedSample([sampleItem.cartItemId]);
      setTab("SAMPLE");
      return;
    }

    try {
      setAddingSampleOptionId(item.productOptionId);

      await api.post("/cart", {
        productOptionId: item.productOptionId,
        quantity: 1,
        cartType: "SAMPLE",
      });

      const response = await api.get<CartApiItem[]>("/cart");
      const cartItems = mapCartApiItems(response);
      setItems(cartItems);
      setSelectedSample(
        cartItems
          .filter((cartItem) => cartItem.cartType === "SAMPLE" && cartItem.isChecked)
          .map((cartItem) => cartItem.cartItemId)
      );
      setTab("SAMPLE");
    } catch {
      window.alert("샘플 상품을 장바구니에 담지 못했습니다. 다시 시도해주세요.");
    } finally {
      setAddingSampleOptionId(null);
    }
  };

  const toggleSelect = (id: number, type: CartTab) => {
    if (type === "BULK") {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
      );
      return;
    }

    setSelectedSample((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (type: CartTab) => {
    if (type === "BULK") {
      setSelected(allBulkSelected ? [] : bulkValidIds);
      return;
    }

    setSelectedSample(allSampleSelected ? [] : sampleValidIds);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2 size={20} className="animate-spin text-primary" />
          장바구니를 불러오는 중입니다
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-[1180px] rounded-xl border border-red-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertCircle size={42} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-lg font-bold text-slate-950">{errorMessage}</h1>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-[1180px]">
          <PageTitle />
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <h2 className="mb-2 text-xl font-bold text-slate-950">장바구니가 비어 있습니다</h2>
            <p className="mb-6 text-sm text-slate-500">도매 상품을 둘러보고 필요한 품목을 담아보세요.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              상품 둘러보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSubtotal = tab === "SAMPLE" ? sampleSubtotal : bulkSubtotal;
  const currentShipping = calculateShippingFee(tab === "SAMPLE" ? sampleSelected : bulkSelected);
  const currentTotal = currentSubtotal + currentShipping;
  const currentCount = tab === "SAMPLE" ? sampleSelected.length : bulkSelected.length;

  const handleCheckout = () => {
    const cartItemIds = tab === "SAMPLE" ? selectedSample : selected;
    if (cartItemIds.length === 0) return;

    navigate("/checkout", {
      state: {
        cartItemIds,
        cartType: tab === "SAMPLE" ? "SAMPLE" : "NORMAL",
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1180px]">
        <PageTitle />

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <TabButton
              active={tab === "BULK"}
              icon={<ShoppingCart size={16} />}
              label="일반 주문"
              count={bulkItems.length}
              onClick={() => setTab("BULK")}
            />
            <TabButton
              active={tab === "SAMPLE"}
              icon={<FlaskConical size={16} />}
              label="샘플 주문"
              count={sampleItems.length}
              onClick={() => setTab("SAMPLE")}
            />
          </div>
        </div>

        {tab === "BULK" && sampleItems.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("SAMPLE")}
            className="mb-5 flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-secondary px-4 py-3 text-left text-sm text-slate-800 transition hover:border-primary/40"
          >
            <FlaskConical size={16} className="shrink-0 text-primary" />
            <span className="font-semibold">샘플 주문 상품 {sampleItems.length}개가 담겨 있습니다.</span>
            <span className="ml-auto text-xs font-semibold text-primary">확인하기</span>
          </button>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-4">
            {tab === "BULK" ? (
              <>
                <SelectBar
                  checked={allBulkSelected}
                  onClick={() => toggleSelectAll("BULK")}
                  label={`전체 선택 (${selected.length}/${bulkValidIds.length})`}
                />
                {sellerGroups.map((group, groupIndex) => {
                  const groupLabel = String.fromCharCode(65 + groupIndex);
                  const selectedGroupItems = group.items.filter((item) => selected.includes(item.cartItemId));
                  const sellerSubtotal = selectedGroupItems.reduce(
                    (sum, item) => sum + item.unitPrice * item.quantity,
                    0
                  );
                  const shippingFee = group.items[0]?.shippingFee ?? 0;
                  const freeShippingThreshold = group.items[0]?.freeShippingThreshold ?? 0;
                  const qualifiesForFreeShipping =
                    freeShippingThreshold > 0 && sellerSubtotal >= freeShippingThreshold;
                  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - sellerSubtotal);
                  const showSellerGroup = isSellerDemo || group.items.some((item) => item.sellerName);

                  return (
                    <section
                      key={`${group.sellerId}-${group.sellerName}`}
                      className={showSellerGroup
                        ? "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                        : "space-y-3"}
                    >
                      {showSellerGroup && (
                        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Package size={17} />
                              </div>
                              <h2 className="truncate text-base font-black text-slate-950">
                                배송비 묶음 {groupLabel}
                              </h2>
                              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {group.items.length}개 상품
                              </span>
                            </div>
                            <p className="mt-1 pl-11 text-xs text-slate-500">
                              같은 출고처 상품 · 배송비 함께 계산 · 선택 합계 <strong className="font-bold text-slate-800">{formatPrice(sellerSubtotal)}</strong>
                            </p>
                          </div>
                          <div
                            className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold sm:self-auto ${
                              qualifiesForFreeShipping
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <Truck size={14} />
                            {qualifiesForFreeShipping
                              ? "무료배송 적용"
                              : freeShippingThreshold > 0
                                ? `${formatPrice(amountUntilFreeShipping)} 추가 시 무료배송`
                                : `배송비 ${formatPrice(shippingFee)}`}
                          </div>
                          </div>
                        </div>
                      )}

                      <div className={showSellerGroup ? "divide-y divide-slate-100" : "space-y-3"}>
                        {group.items.map((item) => (
                          <CartProductCard
                            key={item.cartItemId}
                            item={item}
                            selected={selected.includes(item.cartItemId)}
                            mode="bulk"
                            onToggle={() => toggleSelect(item.cartItemId, "BULK")}
                            onRemove={() => removeItem(item.cartItemId)}
                            onQtyChange={(delta) => updateQty(item.cartItemId, delta, "bulk")}
                            onAddSample={() => handleAddSample(item)}
                            sampleAdded={sampleOptionIds.has(item.productOptionId)}
                            isAddingSample={addingSampleOptionId === item.productOptionId}
                            isUpdatingQuantity={updatingQuantityIds.has(item.cartItemId)}
                            grouped={showSellerGroup}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            ) : (
              <SampleCart
                sampleItems={sampleItems}
                selectedSample={selectedSample}
                allSelected={allSampleSelected}
                onSelectAll={() => toggleSelectAll("SAMPLE")}
                onGoBulk={() => setTab("BULK")}
                onToggle={(id) => toggleSelect(id, "SAMPLE")}
                onRemove={(id) => removeItem(id)}
                onQtyChange={(id, delta) => updateQty(id, delta, "sample")}
                updatingQuantityIds={updatingQuantityIds}
              />
            )}
          </main>

          <OrderSummary
            tab={tab}
            count={currentCount}
            subtotal={currentSubtotal}
            shipping={currentShipping}
            total={currentTotal}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}

function PageTitle() {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
        </div>
        <h1 className="text-2xl font-bold text-slate-950">장바구니</h1>
        <p className="mt-1 text-sm text-slate-500">
          일반 주문과 샘플 주문을 나눠 확인하고 결제를 진행하세요.
        </p>
      </div>
    </header>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${
        active ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20" : "bg-slate-100"}`}>
        {count}
      </span>
    </button>
  );
}

function Checkbox({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100"
          : checked
            ? "border-primary bg-primary"
            : "border-slate-300 bg-white hover:border-primary"
      }`}
    >
      {checked && !disabled && <Check size={13} className="text-white" />}
    </button>
  );
}

function SelectBar({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Checkbox checked={checked} onClick={onClick} />
      <span className="text-sm font-bold text-slate-900">{label}</span>
    </div>
  );
}

function CartProductCard({
  item,
  selected,
  mode,
  onToggle,
  onRemove,
  onQtyChange,
  onAddSample,
  sampleAdded = false,
  isAddingSample = false,
  isUpdatingQuantity = false,
  grouped = false,
}: {
  item: CartItem;
  selected: boolean;
  mode: "bulk" | "sample";
  onToggle: () => void;
  onRemove: () => void;
  onQtyChange: (delta: number) => void;
  onAddSample?: () => void;
  sampleAdded?: boolean;
  isAddingSample?: boolean;
  isUpdatingQuantity?: boolean;
  grouped?: boolean;
}) {
  const isSample = mode === "sample";
  const unitPrice = item.unitPrice;
  const quantity = item.quantity;
  const amount = unitPrice * quantity;
  const moqShortfall = !isSample && item.quantity < item.moq;
  const sampleMaxQuantity = getSampleMaxQuantity(item);

  return (
    <article
      className={grouped
        ? `overflow-hidden bg-white ${selected ? "bg-primary/[0.015]" : ""}`
        : `overflow-hidden rounded-xl border bg-white shadow-sm ${
            moqShortfall ? "border-amber-300" : selected ? "border-primary/30" : "border-slate-200"
          }`}
    >
      {isSample && (
        <div className="flex items-center gap-2 border-b border-primary/10 bg-secondary px-5 py-2 text-xs font-bold text-primary">
          <FlaskConical size={13} />
          샘플 주문
          <span className="ml-auto text-[11px] text-primary/70">
            최대 {sampleMaxQuantity.toLocaleString()}개까지 선택 가능
          </span>
        </div>
      )}

      <div className="flex gap-4 p-5">
        <div className="pt-8">
          <Checkbox checked={selected} onClick={onToggle} disabled={moqShortfall} />
        </div>
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300">
          <Package size={32} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-950">{item.productName}</h3>
                {!isSample && item.sampleAvailable && (
                  <button
                    type="button"
                    onClick={onAddSample}
                    disabled={sampleAdded || isAddingSample}
                    className="inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {isAddingSample ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : sampleAdded ? (
                      <Check size={11} />
                    ) : (
                      <FlaskConical size={11} />
                    )}
                    {isAddingSample ? "추가 중" : sampleAdded ? "샘플 담김" : "샘플 주문"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{item.optionLabel}</p>
              {item.options.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.options.map((option) => (
                    <span
                      key={`${option.optionName}-${option.optionValue}`}
                      className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {option.optionName}: {option.optionValue}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-primary">{formatPrice(unitPrice)}</span>
                <span className="text-xs text-slate-400">/ 벌</span>
                {!isSample && <span className="text-xs text-slate-500">최소 {item.moq.toLocaleString()}벌</span>}
              </div>
              <QuantityControl
                value={quantity}
                unit={isSample ? "개" : "벌"}
                stepLabel={isSample ? `최대 ${sampleMaxQuantity.toLocaleString()}개` : "10벌 단위"}
                onMinus={() => onQtyChange(isSample ? -1 : -10)}
                onPlus={() => onQtyChange(isSample ? 1 : 10)}
                minusDisabled={isUpdatingQuantity || (isSample ? quantity <= 1 : quantity <= item.moq)}
                plusDisabled={isUpdatingQuantity || (isSample && quantity >= sampleMaxQuantity)}
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">상품 금액</p>
              <p className="mt-1 text-base font-black text-slate-950">{formatPrice(amount)}</p>
            </div>
          </div>

          {moqShortfall && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertCircle size={12} />
              최소 주문 수량 {item.moq.toLocaleString()}벌 이상부터 주문할 수 있습니다.
            </div>
          )}

          {isSample && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              샘플 옵션: {item.optionLabel}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function QuantityControl({
  value,
  unit,
  stepLabel,
  onMinus,
  onPlus,
  minusDisabled = false,
  plusDisabled = false,
}: {
  value: number;
  unit: string;
  stepLabel: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onMinus}
        disabled={minusDisabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
      >
        <Minus size={13} />
      </button>
      <span className="min-w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-bold text-slate-950">
        {value.toLocaleString()}
      </span>
      <button
        type="button"
        onClick={onPlus}
        disabled={plusDisabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
      >
        <Plus size={13} />
      </button>
      <span className="text-xs text-slate-400">
        {unit} · {stepLabel}
      </span>
    </div>
  );
}

function SampleCart({
  sampleItems,
  selectedSample,
  allSelected,
  onSelectAll,
  onGoBulk,
  onToggle,
  onRemove,
  onQtyChange,
  updatingQuantityIds,
}: {
  sampleItems: CartItem[];
  selectedSample: number[];
  allSelected: boolean;
  onSelectAll: () => void;
  onGoBulk: () => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onQtyChange: (id: number, delta: number) => void;
  updatingQuantityIds: Set<number>;
}) {
  if (sampleItems.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <FlaskConical size={40} className="mx-auto mb-4 text-slate-300" />
        <h2 className="mb-2 text-lg font-bold text-slate-950">샘플 주문 상품이 없습니다</h2>
        <p className="mb-5 text-sm text-slate-500">일반 주문 탭에서 샘플을 먼저 추가해 주세요.</p>
        <button
          type="button"
          onClick={onGoBulk}
          className="rounded-lg border border-primary/30 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary"
        >
          일반 주문으로 이동
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-secondary px-4 py-3 text-sm text-slate-800">
        <div className="mb-1 flex items-center gap-2 font-bold text-primary">
          <FlaskConical size={14} />
          샘플 주문 안내
        </div>
        샘플 결제 후 실물 확인을 진행하고, 본 주문 진행 여부를 선택할 수 있습니다.
      </div>
      <SelectBar
        checked={allSelected}
        onClick={onSelectAll}
        label={`전체 선택 (${selectedSample.length}/${sampleItems.length})`}
      />
      {sampleItems.map((item) => (
        <CartProductCard
          key={item.cartItemId}
          item={item}
          selected={selectedSample.includes(item.cartItemId)}
          mode="sample"
          onToggle={() => onToggle(item.cartItemId)}
          onRemove={() => onRemove(item.cartItemId)}
          onQtyChange={(delta) => onQtyChange(item.cartItemId, delta)}
          isUpdatingQuantity={updatingQuantityIds.has(item.cartItemId)}
        />
      ))}
    </>
  );
}

function OrderSummary({
  tab,
  count,
  subtotal,
  shipping,
  total,
  onCheckout,
}: {
  tab: CartTab;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  onCheckout: () => void;
}) {
  const isSample = tab === "SAMPLE";
  const shippingText = shipping === 0 ? "무료" : formatPrice(shipping);
  const shippingDescription =
    shipping === 0
      ? "무료 배송 조건이 적용되었습니다."
      : "판매사별 배송비가 합산되어 결제 예정 금액에 포함됩니다.";

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-950">
            {isSample ? "샘플 주문 요약" : "주문 요약"}
          </h2>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-primary">
            {count}개 선택
          </span>
        </div>

        <div className="space-y-3 border-b border-slate-100 pb-4 text-sm">
          <SummaryRow label={isSample ? "샘플 상품 금액" : "상품 금액"} value={formatPrice(subtotal)} />
          <SummaryRow label="국내 배송비" value={shippingText} />

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Truck size={14} />
                배송비
              </div>
              {shipping > 0 && (
                <span className="text-sm font-black text-amber-900">{shippingText}</span>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-amber-700">{shippingDescription}</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-b border-slate-100 py-5">
          <div>
                <h2 className="text-sm font-bold text-slate-950">
                    결제 예정 금액
                </h2>
          </div>
          <p className="whitespace-nowrap text-right text-xl font-black leading-none text-primary md:text-2xl">
            {formatPrice(total)}
          </p>
        </div>

        <div className="my-4 rounded-lg border border-primary/15 bg-secondary/60 px-3 py-2.5 text-xs leading-5 text-slate-700">
          플랫폼 이용 수수료는 결제 단계에서 별도 계산됩니다.
        </div>

        {count === 0 ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
          >
            주문하기
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onCheckout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            {isSample ? "샘플 주문하기" : "주문하기"}
            <ArrowRight size={16} />
          </button>
        )}

        <Link
          to="/products"
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </aside>
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
