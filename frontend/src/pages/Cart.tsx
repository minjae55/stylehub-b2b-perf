import { useState } from "react";
import { Link } from "react-router";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, AlertCircle, Check } from "lucide-react";

type CartItem = {
  id: number;
  name: string;
  supplier: string;
  price: number;
  currency: string;
  moq: number;
  quantity: number;
  image: string;
  approved: boolean;
};

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "프리미엄 히알루론산 에센스 50mL",
    supplier: "코스맥스(주)",
    price: 16000,
    currency: "₩",
    moq: 1000,
    quantity: 1000,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=80&h=80&fit=crop&auto=format",
    approved: true,
  },
  {
    id: 2,
    name: "쿠션 파운데이션 SPF50+ PA+++ (15g)",
    supplier: "에스트라(주)",
    price: 20000,
    currency: "₩",
    moq: 500,
    quantity: 500,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=80&h=80&fit=crop&auto=format",
    approved: true,
  },
  {
    id: 3,
    name: "콜라겐 시트 마스크 25mL",
    supplier: "메디힐(주)",
    price: 3000,
    currency: "₩",
    moq: 5000,
    quantity: 3000,
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=80&h=80&fit=crop&auto=format",
    approved: false,
  },
];

export function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [selected, setSelected] = useState<number[]>(
    initialItems.filter((i) => i.approved).map((i) => i.id)
  );

  const updateQuantity = (id: number, delta: number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const next = item.quantity + delta;
        if (next < item.moq) return item;
        return { ...item, quantity: next };
      })
    );
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    setSelected(selected.filter((sid) => sid !== id));
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const validIds = items.filter((i) => i.approved).map((i) => i.id);
    if (selected.length === validIds.length) {
      setSelected([]);
    } else {
      setSelected(validIds);
    }
  };

  const selectedItems = items.filter((i) => selected.includes(i.id));
  const subtotal = selectedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingEst = subtotal > 10000000 ? "견적 후 확정" : "₩500,000 (예상)";
  const validIds = items.filter((i) => i.approved).map((i) => i.id);
  const allSelected = validIds.length > 0 && selected.length === validIds.length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <ShoppingCart size={24} className="text-primary" /> 장바구니
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <div className="font-semibold text-foreground mb-2">장바구니가 비어 있습니다</div>
          <div className="text-sm text-muted-foreground mb-6">K-Beauty 제품을 탐색하고 담아보세요</div>
          <Link
            to="/suppliers"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold text-sm transition-colors inline-block"
          >
            제품 탐색하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_340px] gap-6">
          <div className="space-y-4">
            <div className="bg-white border border-border rounded p-3 flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  allSelected ? "bg-primary border-primary" : "border-muted-foreground"
                }`}
              >
                {allSelected && <Check size={14} className="text-white" />}
              </button>
              <span className="text-sm font-medium text-foreground">
                전체 선택 ({selected.length}/{validIds.length})
              </span>
            </div>

            {items.map((item) => {
              const moqShortfall = item.quantity < item.moq;
              const isSelected = selected.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded overflow-hidden ${
                    moqShortfall ? "border-amber-300" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => item.approved && toggleSelect(item.id)}
                      disabled={!item.approved}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-7 transition-colors ${
                        !item.approved
                          ? "border-muted bg-muted cursor-not-allowed"
                          : isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-white" />}
                    </button>

                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm leading-snug">{item.name}</h3>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.supplier}</div>
                          {!item.approved && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex">
                              <AlertCircle size={11} /> 승인 대기 중인 상품
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="text-primary font-bold">
                          {item.currency}
                          {item.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          최소 주문: {item.moq.toLocaleString()}개
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -100)}
                            className="w-7 h-7 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                          >
                            <Minus size={12} />
                          </button>

                          <span className="font-mono text-sm w-20 text-center border border-border rounded px-2 py-1">
                            {item.quantity.toLocaleString()}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, 100)}
                            className="w-7 h-7 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus size={12} />
                          </button>

                          <span className="text-xs text-muted-foreground ml-1">개</span>
                        </div>

                        <div className="font-bold text-foreground font-mono">
                          {item.currency}
                          {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>

                      {moqShortfall && (
                        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle size={11} />
                          MOQ 미충족 — 최소 {item.moq.toLocaleString()}개 이상 주문해야 합니다
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-border rounded p-6">
              <h2 className="font-bold text-foreground mb-5">주문 요약</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>선택한 상품 ({selectedItems.length}개 품목)</span>
                  <span className="font-mono">₩{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>물류·배송비 (예상)</span>
                  <span className="font-mono">{shippingEst}</span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                  <span>결제 예정액</span>
                  <span className="font-mono text-primary text-base">₩{subtotal.toLocaleString()}</span>
                </div>
              </div>

              {selectedItems.length === 0 ? (
                <button
                  disabled
                  className="mt-5 w-full py-3 rounded font-semibold text-sm bg-muted text-muted-foreground cursor-not-allowed flex items-center justify-center gap-2"
                >
                  주문하기 (0) <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="mt-5 w-full py-3 rounded font-semibold text-sm bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  주문하기 ({selectedItems.length}) <ArrowRight size={16} />
                </Link>
              )}

              <Link
                to="/suppliers"
                className="mt-2 w-full border border-border text-muted-foreground hover:border-primary hover:text-primary py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 block text-center"
              >
                쇼핑 계속하기
              </Link>
            </div>

            <div className="bg-secondary border border-primary/20 rounded p-4 text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground mb-1.5">안전결제 안내</div>
              주문 생성 후 에스크로 계좌에 결제가 보관됩니다. 상품 검수 및 배송 완료 확인 후 셀러에게 대금이 지급되어 안전합니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
