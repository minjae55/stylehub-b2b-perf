import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Package, MapPin, CreditCard, FileText, ArrowLeft,
  CheckCircle, X, ShoppingBag, PenLine, AlertCircle,
} from "lucide-react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

// ── 더미 주문 데이터 ──────────────────────────────────────────────────
const READY_ITEMS = [
  {
    id: 1,
    name: "여성 베이직 오버핏 셔츠",
    supplier: "라온어패럴",
    price: 18900,
    quantity: 50,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "여성 와이드 슬랙스",
    supplier: "모던클로젯",
    price: 24500,
    quantity: 30,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=80&h=80&fit=crop&auto=format",
  },
];

const CUSTOM_ITEMS: Record<string, { id: number; name: string; supplier: string; price: number; quantity: number; image: string }[]> = {
  "ORD-2024-0901": [
    {
      id: 1,
      name: "여성 린넨 오버핏 블라우스 (주문제작)",
      supplier: "르블랑 어패럴",
      price: 14000,
      quantity: 200,
      image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=80&h=80&fit=crop",
    },
  ],
};

const isSignedMap: Record<string, boolean> = {
  "ORD-2024-0901": false,
};

const TOSS_CLIENT_KEY = "test_ck_GePWvyJnrKme6gpAnkz63gLzN97E";

export function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderType = searchParams.get("type") ?? "ready";   // "ready" | "custom"
  const orderId   = searchParams.get("orderId") ?? "";

  const isCustom = orderType === "custom";
  const isSigned = isCustom ? (isSignedMap[orderId] ?? false) : true;

  const orderItems = isCustom
    ? (CUSTOM_ITEMS[orderId] ?? READY_ITEMS)
    : READY_ITEMS;

  // 상태 타입 명시적으로 지정
  const [paymentMethod, setPaymentMethod] = useState<"wire" | "card">("wire");
  const [agreeTerms, setAgreeTerms]       = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber]     = useState("");

  const subtotal      = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping      = subtotal >= 1000000 ? 0 : 3000;
  const platformFee   = Math.floor(subtotal * 0.05);
  const total         = subtotal + shipping + platformFee;
  const formatPrice   = (n: number) => `${n.toLocaleString()}원`;

  const handlePayment = async () => {
    if (!agreeTerms || !isSigned) return;

    const newOrderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setOrderNumber(newOrderNumber);
    
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });

      const methodType = paymentMethod === "card" ? "CARD" : "VIRTUAL_ACCOUNT";

      const orderName = orderItems.length > 1 
        ? `${orderItems[0].name} 외 ${orderItems.length - 1}건`
        : orderItems[0].name;

      await payment.requestPayment({
        method: methodType,
        amount: {
          currency: "KRW",
          value: total,
        },
        orderId: newOrderNumber,
        orderName: orderName,
        successUrl: `${window.location.origin}/payment/success?type=${orderType}&orderId=${orderId}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: "홍길동",
      }as any);

    } catch (error) {
      console.error("토스페이먼츠 결제창 호출 에러:", error);
      alert("결제창을 여는 중 에러가 발생했습니다.");
    }
  }; 

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> 장바구니로 돌아가기
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Package size={24} className="text-primary" />
        주문/결제
        {isCustom && (
          <span className="ml-2 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-medium">
            주문제작
          </span>
        )}
      </h1>

      {/* 전자서명 미완료 게이트 — 주문제작 한정 */}
      {isCustom && !isSigned && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 mb-6 flex items-start gap-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 mb-1">전자서명이 필요합니다</p>
            <p className="text-sm text-amber-700 mb-3">
              주문제작 상품은 결제 전 계약서 전자서명이 완료되어야 합니다.
              계약 내용(스펙·수량·금액·납기·반품정책)을 확인하고 서명해 주세요.
            </p>
            <button
              onClick={() => navigate(`/orders/custom/${orderId}/sign`)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 rounded transition-colors flex items-center gap-2 w-fit"
            >
              <PenLine size={14} /> 전자서명 하러 가기
            </button>
          </div>
        </div>
      )}

      {isCustom && isSigned && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={16} className="text-green-500" />
          전자서명이 완료되었습니다. 결제를 진행해 주세요.
        </div>
      )}

      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* 배송지 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> 배송지 정보
            </h2>
            <div className="space-y-4">
              <div className="border border-border rounded p-4 bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">회사 기본 배송지</span>
                  <button className="text-xs text-primary hover:underline">변경</button>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="font-medium text-foreground">홍길동</span>
                    <span>010-1234-5678</span>
                  </div>
                  <div>서울특별시 강남구 테헤란로 123</div>
                  <div className="text-xs">A동 5층</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">배송 요청사항</label>
                <textarea
                  placeholder="배송 시 요청사항을 입력하세요"
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* 결제 방법 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> 결제 방법
            </h2>
            <div className="space-y-3">
              {[
                { value: "wire",   label: "무통장 입금",        desc: "입금 확인 후 주문이 진행됩니다" },
                { value: "card",   label: "법인카드 결제",      desc: "법인카드로 즉시 결제합니다" },
              ].map((m) => (
                <label key={m.value} className="flex items-center gap-3 border border-border rounded p-4 cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    // m.value가 string이므로 paymentMethod와 완벽히 비교 가능하도록 단언 혹은 가드 처리
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value as "wire" | "card")}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 주문 동의 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary" /> 주문 동의
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 mt-0.5" />
              <div className="text-sm text-foreground">
                <span className="font-semibold">주문 내용을 확인하였으며, 이용약관 및 개인정보 처리방침에 동의합니다.</span>
                <div className="text-xs text-muted-foreground mt-1">상품 금액, 배송비, 플랫폼 이용 수수료를 확인하였으며 구매에 동의합니다.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-6 sticky top-4">
            <h2 className="font-bold text-foreground mb-5">주문 상품</h2>
            <div className="space-y-3 mb-5 max-h-[300px] overflow-y-auto">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{item.name}</h4>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.supplier}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground font-mono">{item.quantity.toLocaleString()}장</span>
                      <span className="text-sm font-bold font-mono text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm border-t border-border pt-5">
              <div className="flex justify-between text-muted-foreground">
                <span>상품 금액</span><span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>국내 배송비</span><span className="font-mono">{shipping === 0 ? "무료배송" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>플랫폼 이용 수수료</span><span className="font-mono">{formatPrice(platformFee)}</span>
              </div>
              <div className="text-xs text-muted-foreground bg-secondary rounded p-2 leading-relaxed">
                플랫폼 이용 수수료는 안전결제, 주문 관리, 판매자 정산 처리에 사용됩니다.
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-base">
                <span>최종 결제 금액</span>
                <span className="font-mono text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {isCustom && (
              <div className={`mt-4 rounded p-3 text-xs flex items-center gap-2 ${isSigned ? "bg-green-50 border border-green-200 text-green-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
                {isSigned ? <><CheckCircle size={13} /> 전자서명 완료</> : <><PenLine size={13} /> 전자서명 대기 중</>}
              </div>
            )}

            <button
              disabled={!agreeTerms || (isCustom && !isSigned)}
              onClick={handlePayment}
              className={`mt-4 w-full py-3.5 rounded font-semibold text-sm transition-colors ${agreeTerms && (!isCustom || isSigned) ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              {!agreeTerms
                ? "약관에 동의해주세요"
                : isCustom && !isSigned
                ? "전자서명 후 결제 가능"
                : `${formatPrice(total)} 결제하기`}
            </button>

            <div className="mt-4 bg-secondary border border-primary/20 rounded p-3 text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1">
                <CheckCircle size={12} className="text-primary" /> 안전결제 보장
              </div>
              결제 대금은 안전하게 보호되며, 거래 완료 확인 후 판매자에게 정산됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* 결제 완료 모달 (타입 불일치 조건문 수정) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle size={48} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-foreground mb-2">결제가 완료되었습니다!</h2>
            <p className="text-center text-muted-foreground text-sm mb-6">주문이 성공적으로 접수되었습니다</p>
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-5 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">주문번호</span>
                  <span className="font-mono font-bold text-primary">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">주문 유형</span>
                  <span className="font-medium text-foreground">{isCustom ? "주문제작" : "일반 사입"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">결제 방법</span>
                  <span className="font-medium text-foreground">
                    {/* 기존 "escrow" 분기 제거하고 정의된 상태값에 맞춰 텍스트 변경 */}
                    {paymentMethod === "wire" ? "무통장 입금" : "법인카드 결제"}
                  </span>
                </div>
                <div className="border-t border-pink-200 pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">최종 결제 금액</span>
                  <span className="font-mono font-bold text-primary text-lg">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/")} className="flex-1 border-2 border-border text-muted-foreground hover:border-primary hover:text-primary py-3 rounded-lg font-semibold text-sm transition-colors">
                홈으로
              </button>
              <button onClick={() => navigate("/orders")} className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <ShoppingBag size={18} /> 주문 내역 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}