import { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { Package, Plane, Ship, Zap, CheckCircle2, Clock, ArrowLeft, Weight, Ruler, MapPin, RefreshCw, XCircle } from "lucide-react";

type Quote = {
  id: string;
  type: "air" | "sea" | "express";
  carrier: string;
  fee: number;
  currency: string;
  estimatedDays: string;
  status: "PENDING" | "ACCEPTED";
  icon: typeof Plane;
};

const initialQuotes: Quote[] = [
  {
    id: "AIR-001",
    type: "air",
    carrier: "DHL",
    fee: 320,
    currency: "USD",
    estimatedDays: "3–5 days",
    status: "PENDING",
    icon: Plane,
  },
  {
    id: "SEA-001",
    type: "sea",
    carrier: "HMM",
    fee: 95,
    currency: "USD",
    estimatedDays: "25–30 days",
    status: "PENDING",
    icon: Ship,
  },
  {
    id: "EXP-001",
    type: "express",
    carrier: "FedEx",
    fee: 450,
    currency: "USD",
    estimatedDays: "1–2 days",
    status: "PENDING",
    icon: Zap,
  },
];

const typeConfig = {
  air: {
    label: "항공 운송",
    gradient: "from-blue-400 to-indigo-400",
    bg: "from-blue-50 to-indigo-50",
    border: "border-blue-200",
  },
  sea: {
    label: "해상 운송",
    gradient: "from-cyan-400 to-teal-400",
    bg: "from-cyan-50 to-teal-50",
    border: "border-cyan-200",
  },
  express: {
    label: "특급 배송",
    gradient: "from-pink-400 to-rose-400",
    bg: "from-pink-50 to-rose-50",
    border: "border-pink-200",
  },
};

const orderData: Record<string, any> = {
  "ORD-2024-KR-0524": {
    id: "ORD-2024-KR-0524",
    seller: "코스메틱랩",
    product: "비타민C 세럼 30mL",
    quantity: "2,000개",
    destination: "미국, 뉴욕",
    warehouseCode: "WH-KR-001",
    actualWeight: "45.5",
    boxDimensions: { width: "60", height: "40", depth: "35" },
    volumeWeight: "16.8",
  },
  "ORD-2024-KR-0518": {
    id: "ORD-2024-KR-0518",
    seller: "뷰티팩토리",
    product: "시트 마스크 세트",
    quantity: "10,000개",
    destination: "캐나다, 토론토",
    warehouseCode: "WH-KR-002",
    actualWeight: "125.0",
    boxDimensions: { width: "80", height: "60", depth: "50" },
    volumeWeight: "48.0",
  },
  "ORD-2024-KR-0501": {
    id: "ORD-2024-KR-0501",
    seller: "메이크업프로",
    product: "쿠션 파운데이션",
    quantity: "2,500개",
    destination: "일본, 도쿄",
    warehouseCode: "WH-KR-003",
    actualWeight: "62.0",
    boxDimensions: { width: "50", height: "40", depth: "30" },
    volumeWeight: "12.0",
  },
};

export function BuyerShippingQuotes() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD-2024-KR-0524";
  const order = orderData[orderId] || orderData["ORD-2024-KR-0524"];
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setTrackingNo("");
  };

  const handleConfirm = () => {
    if (!selectedId || !trackingNo) {
      alert("운송장 번호를 입력해주세요");
      return;
    }

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === selectedId ? { ...q, status: "ACCEPTED" as const } : q
      )
    );
    alert("배송이 확정되었습니다!");
  };

  const handleReRequest = () => {
    alert("셀러에게 재견적 요청이 발송되었습니다.");
  };

  const handleReject = () => {
    alert("견적서가 거절되었습니다.");
    setShowRejectConfirm(false);
  };

  const selectedQuote = quotes.find((q) => q.id === selectedId);
  const hasAcceptedQuote = quotes.some((q) => q.status === "ACCEPTED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to="/mypage"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">마이페이지로 돌아가기</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full mb-4 shadow-lg">
            <Package className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">배송 견적 비교</h1>
          <p className="text-gray-600">주문번호: {order.id}</p>
        </div>

        {/* Order Info Card */}
        <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-3xl p-6 mb-6 border border-pink-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Package size={18} className="text-pink-600" />
            주문 정보
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">셀러</span>
              <div className="font-semibold text-gray-800 mt-0.5">{order.seller}</div>
            </div>
            <div>
              <span className="text-gray-600">제품</span>
              <div className="font-semibold text-gray-800 mt-0.5">{order.product}</div>
            </div>
            <div>
              <span className="text-gray-600">수량</span>
              <div className="font-semibold text-gray-800 mt-0.5">{order.quantity}</div>
            </div>
            <div>
              <span className="text-gray-600">배송지</span>
              <div className="font-semibold text-gray-800 mt-0.5">{order.destination}</div>
            </div>
          </div>
        </div>

        {/* 화물 정보 (중량, 박스 크기) */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-pink-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-pink-600" />
            화물 정보 (셀러 제공)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-pink-50 p-2.5 rounded-xl">
                <Weight size={20} className="text-pink-600" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-0.5">실제 중량</div>
                <div className="font-bold text-gray-800 text-lg">{order.actualWeight} kg</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-pink-50 p-2.5 rounded-xl">
                <Ruler size={20} className="text-pink-600" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-0.5">부피 중량</div>
                <div className="font-bold text-gray-800 text-lg">{order.volumeWeight} kg</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-pink-50 p-2.5 rounded-xl">
                <Ruler size={20} className="text-pink-600" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-0.5">박스 크기 (cm)</div>
                <div className="font-mono text-sm text-gray-800">
                  {order.boxDimensions.width} × {order.boxDimensions.height} × {order.boxDimensions.depth}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-pink-50 p-2.5 rounded-xl">
                <MapPin size={20} className="text-pink-600" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-0.5">출고 창고</div>
                <div className="font-mono text-sm text-gray-800">{order.warehouseCode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quotes.map((quote) => {
            const config = typeConfig[quote.type];
            const Icon = quote.icon;
            const isSelected = selectedId === quote.id;

            return (
              <div
                key={quote.id}
                className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                  isSelected ? "border-pink-400 ring-4 ring-pink-200" : "border-transparent"
                }`}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                        <Icon size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{config.label}</h3>
                        <p className="text-sm text-white/80">{quote.carrier}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Price */}
                  <div className="mb-6 text-center">
                    <div className="text-4xl font-bold text-gray-800 mb-1">
                      ${quote.fee}
                      <span className="text-lg text-gray-500 ml-1">{quote.currency}</span>
                    </div>
                    <p className="text-sm text-gray-500">배송비</p>
                  </div>

                  {/* Delivery Time */}
                  <div className="flex items-center justify-center gap-2 mb-4 bg-gray-50 rounded-2xl py-3">
                    <Clock size={18} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">{quote.estimatedDays}</span>
                  </div>

                  {/* Status */}
                  <div className="mb-6 text-center">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                        quote.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {quote.status === "ACCEPTED" ? "확정됨" : "대기중"}
                    </span>
                  </div>

                  {/* Select Button */}
                  {quote.status === "PENDING" && (
                    <button
                      onClick={() => handleSelect(quote.id)}
                      className={`w-full py-3 rounded-2xl font-bold transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? "선택됨" : "선택하기"}
                    </button>
                  )}

                  {quote.status === "ACCEPTED" && (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 size={20} />
                      배송 확정 완료
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 재요청 및 거절 버튼 (배송 확정 전에만) */}
        {!hasAcceptedQuote && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleReRequest}
              className="bg-white hover:bg-pink-50 border-2 border-pink-200 text-pink-600 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              셀러에게 재견적 요청
            </button>
            {showRejectConfirm ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold transition-colors"
                >
                  거절 확정
                </button>
                <button
                  onClick={() => setShowRejectConfirm(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-xl font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="bg-white hover:bg-red-50 border-2 border-red-200 text-red-600 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                제안 거절
              </button>
            )}
          </div>
        )}

        {/* Tracking Number Input (appears after selection) */}
        {selectedId && selectedQuote && selectedQuote.status === "PENDING" && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-200 animate-in slide-in-from-bottom">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-2 rounded-xl text-white">
                <Package size={24} />
              </div>
              운송장 정보 입력
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-200">
                <p className="text-xs text-gray-600 mb-1">선택한 운송사</p>
                <p className="text-lg font-bold text-gray-800">{selectedQuote.carrier}</p>
              </div>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-200">
                <p className="text-xs text-gray-600 mb-1">배송비</p>
                <p className="text-lg font-bold text-pink-600">
                  ${selectedQuote.fee} {selectedQuote.currency}
                </p>
              </div>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-200">
                <p className="text-xs text-gray-600 mb-1">배송 기간</p>
                <p className="text-lg font-bold text-gray-800">{selectedQuote.estimatedDays}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                운송장 번호 (Tracking Number)
              </label>
              <input
                type="text"
                placeholder="운송장 번호를 입력하세요"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={!trackingNo}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                trackingNo
                  ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg hover:shadow-xl hover:from-pink-500 hover:to-rose-500"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 size={24} />
              배송 확정하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
