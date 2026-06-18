import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FlaskConical,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";


type CartItem = {
  id: number;
  name: string;
  supplier: string;
  price: number;
  samplePrice: number;
  moq: number;
  quantity: number;
  sampleQty: number;
  image: string;
  approved: boolean;
  hasSample: boolean;
  sampleOrdered: boolean;
};

type CartTab = "BULK" | "SAMPLE";

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "여성 베이지 오버핏 셔츠",
    supplier: "라온패션",
    price: 18900,
    samplePrice: 28000,
    moq: 50,
    quantity: 50,
    sampleQty: 1,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=160&h=160&fit=crop&auto=format",
    approved: true,
    hasSample: true,
    sampleOrdered: false,
  },
  {
    id: 2,
    name: "여성 와이드 슬랙스",
    supplier: "모던클로젯",
    price: 24500,
    samplePrice: 35000,
    moq: 30,
    quantity: 30,
    sampleQty: 1,
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=160&h=160&fit=crop&auto=format",
    approved: true,
    hasSample: true,
    sampleOrdered: false,
  },
  {
    id: 3,
    name: "여성 봄 니트 가디건",
    supplier: "데일리앤코",
    price: 16200,
    samplePrice: 24000,
    moq: 40,
    quantity: 20,
    sampleQty: 1,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=160&h=160&fit=crop&auto=format",
    approved: false,
    hasSample: true,
    sampleOrdered: false,
  },
  {
    id: 4,
    name: "플로럴 미디 원피스",
    supplier: "모아어패럴",
    price: 25000,
    samplePrice: 0,
    moq: 20,
    quantity: 20,
    sampleQty: 0,
    image:
      "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=160&h=160&fit=crop&auto=format",
    approved: true,
    hasSample: false,
    sampleOrdered: false,
  },
];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [tab, setTab] = useState<CartTab>("BULK");
  const [selected, setSelected] = useState<number[]>(
    initialItems.filter((item) => item.approved).map((item) => item.id)
  );
  const [selectedSample, setSelectedSample] = useState<number[]>([]);

  const sampleItems = items.filter((item) => item.hasSample && item.sampleOrdered);
  const bulkSelected = items.filter((item) => selected.includes(item.id));
  const sampleSelected = sampleItems.filter((item) => selectedSample.includes(item.id));
  const bulkSubtotal = bulkSelected.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const sampleSubtotal = sampleSelected.reduce(
    (sum, item) => sum + item.samplePrice * item.sampleQty,
    0
  );
  const bulkValidIds = items.filter((item) => item.approved).map((item) => item.id);
  const sampleValidIds = sampleItems.filter((item) => item.approved).map((item) => item.id);
  const allBulkSelected = bulkValidIds.length > 0 && selected.length === bulkValidIds.length;
  const allSampleSelected =
    sampleValidIds.length > 0 && selectedSample.length === sampleValidIds.length;
  const sortedBulkItems = [...items].sort((a, b) => {
    const aBlocked = !a.approved || a.quantity < a.moq;
    const bBlocked = !b.approved || b.quantity < b.moq;
    return Number(aBlocked) - Number(bBlocked);
  });

  const updateQty = (id: number, delta: number, type: "bulk" | "sample") => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (type === "bulk") {
          const next = item.quantity + delta;
          return next < item.moq ? item : { ...item, quantity: next };
        }

        const next = item.sampleQty + delta;
        return next < 1 || next > 5 ? item : { ...item, sampleQty: next };
      })
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelected((prev) => prev.filter((selectedId) => selectedId !== id));
    setSelectedSample((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const toggleSampleOrdered = (id: number) => {
    const item = items.find((current) => current.id === id);
    if (!item) return;

    const next = !item.sampleOrdered;
    setItems((prev) =>
      prev.map((current) => (current.id === id ? { ...current, sampleOrdered: next } : current))
    );

    if (next && item.approved) {
      setSelectedSample((prev) => [...new Set([...prev, id])]);
    } else {
      setSelectedSample((prev) => prev.filter((selectedId) => selectedId !== id));
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-[1180px]">
          <PageTitle itemCount={0} sampleCount={0} />
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
  const currentCount = tab === "SAMPLE" ? sampleSelected.length : bulkSelected.length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1180px]">
        <PageTitle itemCount={items.length} sampleCount={sampleItems.length} />

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <TabButton
              active={tab === "BULK"}
              icon={<ShoppingCart size={16} />}
              label="일반 주문"
              count={items.length}
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
                {sortedBulkItems.map((item) => (
                  <CartProductCard
                    key={item.id}
                    item={item}
                    selected={selected.includes(item.id)}
                    mode="bulk"
                    onToggle={() => item.approved && toggleSelect(item.id, "BULK")}
                    onRemove={() => removeItem(item.id)}
                    onQtyChange={(delta) => updateQty(item.id, delta, "bulk")}
                    onSampleToggle={() => toggleSampleOrdered(item.id)}
                  />
                ))}
              </>
            ) : (
              <SampleCart
                sampleItems={sampleItems}
                selectedSample={selectedSample}
                allSelected={allSampleSelected}
                onSelectAll={() => toggleSelectAll("SAMPLE")}
                onGoBulk={() => setTab("BULK")}
                onToggle={(id) => toggleSelect(id, "SAMPLE")}
                onRemove={(id) => toggleSampleOrdered(id)}
                onQtyChange={(id, delta) => updateQty(id, delta, "sample")}
              />
            )}
          </main>

          <OrderSummary
            tab={tab}
            count={currentCount}
            subtotal={currentSubtotal}
            onContinuePath={tab === "SAMPLE" ? "/buyer/checkout?type=sample" : "/buyer/checkout"}
          />
        </div>
      </div>
    </div>
  );
}

function PageTitle({ itemCount, sampleCount }: { itemCount: number; sampleCount: number }) {
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
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
  onSampleToggle,
}: {
  item: CartItem;
  selected: boolean;
  mode: "bulk" | "sample";
  onToggle: () => void;
  onRemove: () => void;
  onQtyChange: (delta: number) => void;
  onSampleToggle?: () => void;
}) {
  const isSample = mode === "sample";
  const unitPrice = isSample ? item.samplePrice : item.price;
  const quantity = isSample ? item.sampleQty : item.quantity;
  const amount = unitPrice * quantity;
  const moqShortfall = !isSample && item.quantity < item.moq;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        moqShortfall ? "border-amber-300" : selected ? "border-primary/30" : "border-slate-200"
      }`}
    >
      {isSample && (
        <div className="flex items-center gap-2 border-b border-primary/10 bg-secondary px-5 py-2 text-xs font-bold text-primary">
          <FlaskConical size={13} />
          샘플 주문
          <span className="ml-auto text-[11px] text-primary/70">최대 5개까지 선택 가능</span>
        </div>
      )}

      <div className="flex gap-4 p-5">
        <div className="pt-8">
          <Checkbox checked={selected} onClick={onToggle} disabled={!item.approved} />
        </div>
        <img
          src={item.image}
          alt={item.name}
          className="h-24 w-24 shrink-0 rounded-lg border border-slate-100 object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950">{item.name}</h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{item.supplier}</p>
              {!item.approved && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                  <AlertCircle size={11} />
                  판매 승인 대기
                </span>
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
                {isSample && (
                  <span className="text-xs text-slate-400 line-through">{formatPrice(item.price)} 도매가</span>
                )}
              </div>
              <QuantityControl
                value={quantity}
                unit={isSample ? "개" : "벌"}
                stepLabel={isSample ? "최대 5개" : "10벌 단위"}
                onMinus={() => onQtyChange(isSample ? -1 : -10)}
                onPlus={() => onQtyChange(isSample ? 1 : 10)}
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

          {!isSample && item.hasSample && onSampleToggle && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onSampleToggle}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  item.sampleOrdered
                    ? "border-primary/25 bg-secondary text-primary"
                    : "border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary"
                }`}
              >
                <FlaskConical size={13} />
                {item.sampleOrdered
                  ? `샘플 주문 추가됨 · ${formatPrice(item.samplePrice)}`
                  : `샘플 먼저 받아보기 · ${formatPrice(item.samplePrice)}`}
              </button>
            </div>
          )}

          {isSample && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              본 주문 예정: {item.quantity.toLocaleString()}벌 · {formatPrice(item.price * item.quantity)}
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
}: {
  value: number;
  unit: string;
  stepLabel: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onMinus}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary hover:text-primary"
      >
        <Minus size={13} />
      </button>
      <span className="min-w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-bold text-slate-950">
        {value.toLocaleString()}
      </span>
      <button
        type="button"
        onClick={onPlus}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary hover:text-primary"
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
}: {
  sampleItems: CartItem[];
  selectedSample: number[];
  allSelected: boolean;
  onSelectAll: () => void;
  onGoBulk: () => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onQtyChange: (id: number, delta: number) => void;
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
          key={item.id}
          item={item}
          selected={selectedSample.includes(item.id)}
          mode="sample"
          onToggle={() => item.approved && onToggle(item.id)}
          onRemove={() => onRemove(item.id)}
          onQtyChange={(delta) => onQtyChange(item.id, delta)}
        />
      ))}
    </>
  );
}

function OrderSummary({
  tab,
  count,
  subtotal,
  onContinuePath,
}: {
  tab: CartTab;
  count: number;
  subtotal: number;
  onContinuePath: string;
}) {
  const isSample = tab === "SAMPLE";

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
          <SummaryRow label="국내 배송비" value="착불" />
        </div>

        <div className="flex items-end justify-between border-b border-slate-100 py-5">
          <div>
                <h2 className="text-sm font-bold text-slate-950">
                    결제 예정 금액
                </ h2>
          </div>
          <p className="whitespace-nowrap text-right text-xl font-black leading-none text-primary md:text-2xl">
            {formatPrice(subtotal)}
          </p>
        </div>

        <div className="my-4 rounded-lg border border-primary/15 bg-secondary/60 px-3 py-2.5 text-xs leading-5 text-slate-700">
          플랫폼 이용 수수료와 배송비는 결제 단계에서 별도 계산됩니다.
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
          <Link
            to={onContinuePath}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            {isSample ? "샘플 주문하기" : "주문하기"}
            <ArrowRight size={16} />
          </Link>
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