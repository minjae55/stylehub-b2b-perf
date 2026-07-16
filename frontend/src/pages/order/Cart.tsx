import { useEffect, useRef, useState } from "react";
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

  imageUrl: string;
  productName: string;
  optionLabel: string;
  options: Array<{
    optionName: string;
    optionValue: string;
  }>;
  unitPrice: number;
  moq: number;
  quantity: number;
  stockQuantity: number;
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

function isOutOfStock(item: CartItem) {
  return item.quantity > item.stockQuantity;
}

function isBulkOrderable(item: CartItem) {
  return item.quantity >= item.moq && !isOutOfStock(item);
}

function isSampleOrderable(item: CartItem) {
  return !isOutOfStock(item) && item.quantity <= getSampleMaxQuantity(item);
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

        const response = await api.get<CartApiItem[]>("/carts");
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
  const bulkSelected = bulkItems.filter((item) => selected.includes(item.cartItemId) && isBulkOrderable(item));
  const sampleSelected = sampleItems.filter((item) => selectedSample.includes(item.cartItemId) && isSampleOrderable(item));
  const bulkSubtotal = bulkSelected.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const sampleSubtotal = sampleSelected.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const bulkValidIds = bulkItems
    .filter(isBulkOrderable)
    .map((item) => item.cartItemId);
  const sampleValidIds = sampleItems
    .filter(isSampleOrderable)
    .map((item) => item.cartItemId);
  const bulkSelectedCount = selected.filter((id) => bulkValidIds.includes(id)).length;
  const sampleSelectedCount = selectedSample.filter((id) => sampleValidIds.includes(id)).length;
  const allBulkSelected = bulkValidIds.length > 0 && bulkSelectedCount === bulkValidIds.length;
  const allSampleSelected =
    sampleValidIds.length > 0 && sampleSelectedCount === sampleValidIds.length;
  const sortedBulkItems = [...bulkItems].sort((a, b) => {
    const aBlocked = !isBulkOrderable(a);
    const bBlocked = !isBulkOrderable(b);
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

  const updateQtyTo = async (id: number, nextQuantity: number, type: "bulk" | "sample") => {
    const item = items.find((cartItem) => cartItem.cartItemId === id);
    if (!item || updatingQuantityIds.has(id)) return;

    if (nextQuantity < 1) return;

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

      const response = await api.patch<CartApiItem>(`/carts/${id}/quantity`, {
        quantity: nextQuantity,
      });
      if (response?.cartItemId === id) {
        // 백엔드는 GET /carts와 동일하게 companyId/baseShippingFee 형태로 응답한다.
        // 여기서 mapCartApiItems를 거치지 않고 그대로 state에 덮어쓰면 이 아이템만
        // sellerId/shippingFee가 undefined가 되어(-> 0으로 폴백) 같은 판매자의 다른
        // 상품들과 배송비 묶음 키가 달라지면서 묶음이 쪼개져 보이는 버그가 있었다.
        const [mappedItem] = mapCartApiItems([response]);
        setItems((prev) =>
          prev.map((cartItem) =>
            cartItem.cartItemId === id ? mappedItem : cartItem
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

  const updateQty = async (id: number, delta: number, type: "bulk" | "sample") => {
    const item = items.find((cartItem) => cartItem.cartItemId === id);
    if (!item) return;

    await updateQtyTo(id, Math.max(1, item.quantity + delta), type);
  };

  // 수량 입력창에 직접 타이핑하는 동안(blur 전) 서버 반영 없이 화면(주문 요약 포함)만
  // 즉시 갱신한다. 실제 API 커밋은 여전히 onBlur/Enter 시점에 updateQtyTo가 담당한다 —
  // 키 입력마다 API를 호출하면 요청이 과도하게 쌓이기 때문에, 입력 중엔 로컬 상태만 바꾼다.
  const updateQtyDraft = (id: number, nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) return;

    setItems((prev) =>
      prev.map((cartItem) =>
        cartItem.cartItemId === id
          ? { ...cartItem, quantity: nextQuantity, totalPrice: cartItem.unitPrice * nextQuantity }
          : cartItem
      )
    );
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
      await api.delete(`/carts/${id}`);
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

      await api.post("/carts", {
        productOptionId: item.productOptionId,
        quantity: 1,
        cartType: "SAMPLE",
      });

      const response = await api.get<CartApiItem[]>("/carts");
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
          <Loader2 size={20} className="animate-spin text-blue-600" />
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
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
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
    const cartItemIds = tab === "SAMPLE"
      ? sampleSelected.map((item) => item.cartItemId)
      : bulkSelected.map((item) => item.cartItemId);
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
            className="mb-5 flex w-full items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-50 px-4 py-3 text-left text-sm text-slate-800 transition hover:border-blue-400/40"
          >
            <FlaskConical size={16} className="shrink-0 text-blue-600" />
            <span className="font-semibold">샘플 주문 상품 {sampleItems.length}개가 담겨 있습니다.</span>
            <span className="ml-auto text-xs font-semibold text-blue-600">확인하기</span>
          </button>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-4">
            {tab === "BULK" ? (
              <>
                <SelectBar
                  checked={allBulkSelected}
                  onClick={() => toggleSelectAll("BULK")}
                  label={`전체 선택 (${bulkSelectedCount}/${bulkValidIds.length})`}
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
                  const showSellerGroup = group.sellerId != null;

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
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
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
                              {group.items.length > 1 && "같은 출고처 상품 · 배송비 함께 계산 · "}
                              선택 합계 <strong className="font-bold text-slate-800">{formatPrice(sellerSubtotal)}</strong>
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
                            onQuantityDraft={(quantity) => updateQtyDraft(item.cartItemId, quantity)}
                            onQuantityInput={(quantity) => updateQtyTo(item.cartItemId, quantity, "bulk")}
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
                selectedCount={sampleSelectedCount}
                selectableCount={sampleValidIds.length}
                allSelected={allSampleSelected}
                onSelectAll={() => toggleSelectAll("SAMPLE")}
                onGoBulk={() => setTab("BULK")}
                onToggle={(id) => toggleSelect(id, "SAMPLE")}
                onRemove={(id) => removeItem(id)}
                onQtyChange={(id, delta) => updateQty(id, delta, "sample")}
                onQuantityDraft={(id, quantity) => updateQtyDraft(id, quantity)}
                onQuantityChange={(id, quantity) => updateQtyTo(id, quantity, "sample")}
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
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
        active ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
            ? "border-blue-400 bg-blue-500"
            : "border-slate-300 bg-white hover:border-blue-400"
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
  onQuantityDraft,
  onQuantityInput,
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
  onQuantityDraft?: (quantity: number) => void;
  onQuantityInput: (quantity: number) => void;
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
  const sampleMaxQuantity = getSampleMaxQuantity(item);
  const minimumQuantity = 1;
  const moqShortfall = !isSample && item.quantity < item.moq;
  const stockShortfall = isOutOfStock(item);
  const sampleLimitExceeded = isSample && item.quantity > sampleMaxQuantity;
  const blocked = moqShortfall || stockShortfall || sampleLimitExceeded;

  return (
    <article
      className={grouped
        ? `overflow-hidden bg-white ${selected ? "bg-blue-500/[0.015]" : ""}`
        : `overflow-hidden rounded-xl border bg-white shadow-sm ${
            blocked ? "border-amber-300" : selected ? "border-blue-400/30" : "border-slate-200"
          }`}
    >
      {isSample && (
        <div className="flex items-center gap-2 border-b border-blue-400/10 bg-blue-50 px-5 py-2 text-xs font-bold text-blue-600">
          <FlaskConical size={13} />
          샘플 주문
          <span className="ml-auto text-[11px] text-blue-600/70">
            최대 {sampleMaxQuantity.toLocaleString()}개까지 선택 가능
          </span>
        </div>
      )}

      <div className="flex gap-4 p-5">
        <div className="pt-8">
          <Checkbox checked={selected} onClick={onToggle} disabled={blocked} />
        </div>
       <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
         <img
           src={item.imageUrl}
           alt={item.productName}
           className="h-full w-full object-cover"
         />
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
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 text-xs font-bold text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {isAddingSample ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : sampleAdded ? (
                      <Check size={11} />
                    ) : (
                      <FlaskConical size={11} />
                    )}
                    {isAddingSample ? "추가 중" : sampleAdded ? "샘플 담김" : "샘플 주문 담기"}
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
                <span className="text-sm font-black text-blue-600">{formatPrice(unitPrice)}</span>
                <span className="text-xs text-slate-400">/ 벌</span>
                {!isSample && <span className="text-xs text-slate-500">최소 {item.moq.toLocaleString()}벌</span>}
              </div>
              <QuantityControl
                value={quantity}
                unit={isSample ? "개" : "벌"}
                stepLabel={isSample ? `최대 ${sampleMaxQuantity.toLocaleString()}개` : "10벌 단위"}
                onMinus={() => onQtyChange(isSample ? -1 : -10)}
                onPlus={() => onQtyChange(isSample ? 1 : 10)}
                onDraftChange={onQuantityDraft}
                onValueCommit={onQuantityInput}
                min={minimumQuantity}
                minusDisabled={isUpdatingQuantity || quantity <= minimumQuantity}
                plusDisabled={isUpdatingQuantity}
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

          {stockShortfall && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              <AlertCircle size={12} />
              현재 재고보다 {(item.quantity - item.stockQuantity).toLocaleString()}개 더 담았습니다.
              재고는 {item.stockQuantity.toLocaleString()}개이며, 수량을 조정하기 전에는 주문할 수 없습니다.
            </div>
          )}

          {sampleLimitExceeded && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertCircle size={12} />
              샘플은 최대 {sampleMaxQuantity.toLocaleString()}개까지 주문할 수 있습니다.
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
  onDraftChange,
  onValueCommit,
  min,
  max,
  minusDisabled = false,
  plusDisabled = false,
}: {
  value: number;
  unit: string;
  stepLabel: string;
  onMinus: () => void;
  onPlus: () => void;
  onDraftChange?: (value: number) => void;
  onValueCommit: (value: number) => void;
  min: number;
  max?: number;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  // 타이핑 중에는 화면 반영을 위해 value prop 자체가 (draft 반영으로) 계속 바뀌므로,
  // "서버에 실제로 반영된 마지막 값"을 별도로 기억해둬야 blur 시 진짜 변경 여부를
  // 판단할 수 있다. 포커스가 들어온 시점의 value를 기준값으로 스냅샷해둔다.
  const lastCommittedRef = useRef(value);

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitValue = () => {
    const numericValue = Number(draftValue);

    if (!Number.isFinite(numericValue)) {
      setDraftValue(String(value));
      return;
    }

    const integerValue = Math.floor(numericValue);
    const clampedValue = Math.min(Math.max(integerValue, min), max ?? Number.MAX_SAFE_INTEGER);

    setDraftValue(String(clampedValue));

    if (clampedValue !== lastCommittedRef.current) {
      lastCommittedRef.current = clampedValue;
      onValueCommit(clampedValue);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onMinus}
        disabled={minusDisabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        value={draftValue}
        min={min}
        max={max}
        onFocus={() => {
          // 타이핑 시작 전 시점의 값을 "마지막 커밋값" 기준으로 스냅샷.
          lastCommittedRef.current = value;
        }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraftValue(nextDraft);

          // blur 전이라도 유효한 값이면 주문 요약 등 화면에는 바로 반영한다.
          // (실제 서버 반영 여부 판단은 여전히 blur/Enter의 commitValue가
          // lastCommittedRef와 비교해서 처리한다)
          const parsed = Number(nextDraft);
          if (Number.isFinite(parsed) && nextDraft.trim() !== "") {
            onDraftChange?.(Math.max(min, Math.floor(parsed)));
          }
        }}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-bold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <button
        type="button"
        onClick={onPlus}
        disabled={plusDisabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
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
  selectedCount,
  selectableCount,
  allSelected,
  onSelectAll,
  onGoBulk,
  onToggle,
  onRemove,
  onQtyChange,
  onQuantityDraft,
  onQuantityChange,
  updatingQuantityIds,
}: {
  sampleItems: CartItem[];
  selectedSample: number[];
  selectedCount: number;
  selectableCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onGoBulk: () => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onQtyChange: (id: number, delta: number) => void;
  onQuantityDraft?: (id: number, quantity: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
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
          className="rounded-lg border border-blue-400/30 px-5 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
        >
          일반 주문으로 이동
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-blue-400/20 bg-blue-50 px-4 py-3 text-sm text-slate-800">
        <div className="mb-1 flex items-center gap-2 font-bold text-blue-600">
          <FlaskConical size={14} />
          샘플 주문 안내
        </div>
        샘플 결제 후 실물 확인을 진행하고, 본 주문 진행 여부를 선택할 수 있습니다.
      </div>
      <SelectBar
        checked={allSelected}
        onClick={onSelectAll}
        label={`전체 선택 (${selectedCount}/${selectableCount})`}
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
        onQuantityDraft={(quantity) => onQuantityDraft?.(item.cartItemId, quantity)}
        onQuantityInput={(quantity) => onQuantityChange(item.cartItemId, quantity)}
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
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
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
          <p className="whitespace-nowrap text-right text-xl font-black leading-none text-blue-600 md:text-2xl">
            {formatPrice(total)}
          </p>
        </div>

        <div className="my-4 rounded-lg border border-blue-400/15 bg-blue-50/60 px-3 py-2.5 text-xs leading-5 text-slate-700">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
          >
            {isSample ? "샘플 주문하기" : "주문하기"}
            <ArrowRight size={16} />
          </button>
        )}

        <Link
          to="/products"
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
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