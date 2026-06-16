import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft, FileText, PenLine, CheckCircle, AlertCircle,
  Package, Truck, Calendar, RotateCcw, Shield, Download, X,
} from "lucide-react";

// ── 더미 계약 데이터 ─────────────────────────────────────────────────
const contractData: Record<string, {
  orderId: string;
  createdAt: string;
  buyer: { name: string; business: string; businessNumber: string };
  seller: { name: string; business: string; businessNumber: string };
  product: { name: string; category: string; material: string; detail: string,   image: string;};
  sizes: { color: string; size: string; quantity: number; unitPrice: number }[];
  shippingFee: number;
  leadTime: string;
  deliveryDate: string;
  sampleRequired: boolean;
  returnPolicy: string;
  specialTerms: string;
  validUntil: string;
}> = {
  "ORD-2024-0901": {
    orderId: "ORD-2024-0901",
    createdAt: "2024.05.20",
    buyer: { name: "김민재", business: "스타일마켓㈜", businessNumber: "123-45-67890" },
    seller: { name: "이지은", business: "르블랑 어패럴", businessNumber: "987-65-43210" },
    product: {
      name: "여성 린넨 오버핏 블라우스 (주문제작)",
      category: "상의 > 블라우스",
      material: "린넨 100%",
      detail: "오버핏 실루엣, 뒷면 버튼 디테일, 드롭숄더 라인. 바이어 제공 작업지시서 기준 제작.",
      image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=240&h=240&fit=crop",

    },
    sizes: [
      { color: "화이트", size: "S",  quantity: 30, unitPrice: 14000 },
      { color: "화이트", size: "M",  quantity: 50, unitPrice: 14000 },
      { color: "화이트", size: "L",  quantity: 40, unitPrice: 14000 },
      { color: "베이지", size: "S",  quantity: 20, unitPrice: 14000 },
      { color: "베이지", size: "M",  quantity: 40, unitPrice: 14000 },
      { color: "베이지", size: "L",  quantity: 20, unitPrice: 14000 },
    ],
    shippingFee: 0,
    leadTime: "14일",
    deliveryDate: "2024.06.10",
    sampleRequired: true,
    returnPolicy: "불량·오제작에 한해 수령 후 7일 이내 전량 교환 또는 환불. 단순 변심 반품 불가.",
    specialTerms: "샘플 확인 후 바이어 승인 시 본 생산 진행. 샘플 제작 기간 3~5일 별도 소요.",
    validUntil: "2024.05.27",
  },
};

// ── 서명 캔버스 컴포넌트 ──────────────────────────────────────────────
function SignatureCanvas({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1a2e1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <PenLine size={14} className="text-primary" />
          {label}
        </label>
        {!isEmpty && (
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors">
            <X size={12} /> 다시 서명
          </button>
        )}
      </div>
      <div className={`relative border-2 rounded-lg overflow-hidden transition-colors ${value ? "border-primary" : "border-dashed border-border"}`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="w-full h-28 cursor-crosshair bg-white touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground/60">이 곳에 서명해 주세요</p>
          </div>
        )}
        {value && (
          <div className="absolute bottom-2 right-2">
            <CheckCircle size={16} className="text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────
export function SellerContractSign() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const contract = orderId ? contractData[orderId] : null;

  const [buyerSign, setBuyerSign] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedSpec,  setAgreedSpec]  = useState(false);
  const [agreedReturn, setAgreedReturn] = useState(false);
  const [signed, setSigned] = useState(false);

  const canSign = buyerSign && agreedTerms && agreedSpec && agreedReturn;

  if (!contract) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-16 text-center">
        <FileText size={48} className="mx-auto mb-4 opacity-30 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground mb-2">계약서를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-5">주문번호를 확인해 주세요.</p>
        <Link to="/buyer/orders" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors">
          주문 목록으로
        </Link>
      </div>
    );
  }

  const subtotal = contract.sizes.reduce((s, sz) => s + sz.quantity * sz.unitPrice, 0);
  const total = subtotal + contract.shippingFee;
  const totalQty = contract.sizes.reduce((s, sz) => s + sz.quantity, 0);

  if (signed) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-border rounded-lg p-10">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">전자서명 완료</h2>
          <p className="text-sm text-muted-foreground mb-1">계약서가 양측에 전달되었습니다.</p>
          <p className="text-sm text-muted-foreground mb-8">이제 결제를 진행해 주세요.</p>
          <div className="bg-secondary border border-border rounded-lg px-5 py-4 text-sm text-left space-y-2 mb-8">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-mono font-semibold text-foreground">{contract.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">서명 일시</span>
              <span className="text-foreground">{new Date().toLocaleString("ko-KR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">계약 금액</span>
              <span className="font-semibold text-foreground">₩{total.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {}}
              className="border border-border text-foreground hover:border-primary hover:text-primary px-5 py-2.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download size={14} /> 계약서 PDF 저장
            </button>
            <button
onClick={() => navigate("/seller")}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              결제 진행하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/buyer/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
        <ChevronLeft size={14} /> 주문 목록으로
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2e1a] to-[#2d4a35] text-white rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={20} />
              <h1 className="text-xl font-bold">주문제작 전자서명</h1>
            </div>
            <p className="text-sm text-white/70">
              결제 전 계약 내용을 확인하고 서명해 주세요.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60 mb-0.5">계약 금액</div>
            <div className="text-2xl font-bold">₩{total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 유효기간 경고 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 flex items-center gap-2 text-xs text-amber-700">
        <AlertCircle size={14} className="flex-shrink-0" />
        이 견적서의 서명 유효 기간은 <strong className="ml-1">{contract.validUntil}</strong>까지입니다. 기한 내 서명해 주세요.
      </div>

      <div className="space-y-5">
        {/* 계약 당사자 */}
        <section className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={15} className="text-primary" /> 계약 당사자
            </h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-4">
              <div className="text-xs text-muted-foreground mb-2 font-medium">발주자 (바이어)</div>
              <div className="font-semibold text-foreground text-sm">{contract.buyer.business}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{contract.buyer.name}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">사업자 {contract.buyer.businessNumber}</div>
            </div>
            <div className="px-5 py-4">
              <div className="text-xs text-muted-foreground mb-2 font-medium">수주자 (셀러)</div>
              <div className="font-semibold text-foreground text-sm">{contract.seller.business}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{contract.seller.name}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">사업자 {contract.seller.businessNumber}</div>
            </div>
          </div>
        </section>

        {/* 제품 스펙 */}
        {/* 제품 스펙 */}
        <section className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Package size={15} className="text-primary" /> 제품 스펙
            </h2>
          </div>

          <div className="px-5 py-4 space-y-4 text-sm">
            <div className="flex gap-4">
              <img
                src={contract.product.image}
                alt={contract.product.name}
                className="w-28 h-28 rounded-lg object-cover border border-border flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/112x112/f3f4f6/9ca3af?text=NO+IMG";
                }}
              />

              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">상품명</div>
                  <div className="font-medium text-foreground">{contract.product.name}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">카테고리</div>
                  <div className="font-medium text-foreground">{contract.product.category}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">소재</div>
                  <div className="font-medium text-foreground">{contract.product.material}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">샘플 제작</div>
                  <div className="font-medium text-foreground">
                    {contract.sampleRequired ? "필수" : "미필수"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-0.5">제작 상세</div>
              <div className="text-foreground bg-secondary/40 rounded px-3 py-2 text-xs leading-relaxed">
                {contract.product.detail}
              </div>
            </div>
          </div>

          {/* 수량 그리드 */}
          <div className="border-t border-border px-5 py-4">
            <div className="text-xs font-medium text-muted-foreground mb-3">
              컬러·사이즈별 수량
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground font-medium pb-1.5 pr-4">컬러</th>
                    <th className="text-left text-muted-foreground font-medium pb-1.5 pr-4">사이즈</th>
                    <th className="text-right text-muted-foreground font-medium pb-1.5 pr-4">수량</th>
                    <th className="text-right text-muted-foreground font-medium pb-1.5 pr-4">단가</th>
                    <th className="text-right text-muted-foreground font-medium pb-1.5">금액</th>
                  </tr>
                </thead>

                <tbody>
                  {contract.sizes.map((sz, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 pr-4 text-foreground">{sz.color}</td>
                      <td className="py-1.5 pr-4 font-medium text-foreground">{sz.size}</td>
                      <td className="py-1.5 pr-4 text-right">{sz.quantity}장</td>
                      <td className="py-1.5 pr-4 text-right text-muted-foreground">
                        ₩{sz.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right font-medium">
                        ₩{(sz.quantity * sz.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>총 수량</span>
                <span>{totalQty}장</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>상품 금액</span>
                <span>₩{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>택배비</span>
                <span>
                  {contract.shippingFee === 0
                    ? "무료"
                    : `₩${contract.shippingFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 text-base">
                <span>계약 총액</span>
                <span>₩{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 납기 및 배송 */}
        <section className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Truck size={15} className="text-primary" /> 납기 및 배송
            </h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <Calendar size={11} /> 제작 소요일
              </div>
              <div className="font-semibold text-foreground">{contract.leadTime}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <Truck size={11} /> 납기 예정일
              </div>
              <div className="font-semibold text-foreground">{contract.deliveryDate}</div>
            </div>
          </div>
        </section>

        {/* 반품·특약 */}
        <section className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <RotateCcw size={15} className="text-primary" /> 반품·교환 정책 및 특약사항
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">반품·교환 정책</div>
              <div className="bg-secondary/40 rounded px-3 py-2 text-xs leading-relaxed text-foreground">{contract.returnPolicy}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">특약사항</div>
              <div className="bg-secondary/40 rounded px-3 py-2 text-xs leading-relaxed text-foreground">{contract.specialTerms}</div>
            </div>
          </div>
        </section>

        {/* 동의 체크박스 */}
        <section className="bg-white border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Shield size={15} className="text-primary" /> 계약 내용 동의
          </h2>
          {[
            { key: "terms",  state: agreedTerms,  set: setAgreedTerms,  label: "위 계약 내용(제품 스펙, 수량, 금액)을 확인하였으며 이에 동의합니다." },
            { key: "spec",   state: agreedSpec,   set: setAgreedSpec,   label: "납기일 및 배송 조건을 확인하였으며 이에 동의합니다." },
            { key: "return", state: agreedReturn, set: setAgreedReturn, label: "반품·교환 정책 및 특약사항을 확인하였으며 이에 동의합니다." },
          ].map((item) => (
            <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${item.state ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                {item.state && <CheckCircle size={13} className="text-white" />}
              </div>
              <input type="checkbox" checked={item.state} onChange={(e) => item.set(e.target.checked)} className="hidden" />
              <span className="text-sm text-foreground leading-relaxed">{item.label}</span>
            </label>
          ))}
        </section>

        {/* 전자서명 */}
        <section className="bg-white border border-border rounded-lg p-5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <PenLine size={15} className="text-primary" /> 전자서명
          </h2>
          <SignatureCanvas
            label={`발주자 서명 — ${contract.buyer.name} (${contract.buyer.business})`}
            value={buyerSign}
            onChange={setBuyerSign}
          />
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle size={11} />
            서명은 법적 효력이 있는 전자서명으로 처리됩니다. 신중하게 서명해 주세요.
          </div>
        </section>

        {/* 셀러 서명 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 text-xs text-blue-700">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">셀러 서명 안내</p>
            <p>바이어 서명 완료 후 셀러({contract.seller.business})에게 서명 요청이 자동 발송됩니다. 양측 서명 완료 후 계약이 확정됩니다.</p>
          </div>
        </div>

        {/* 서명 완료 버튼 */}
        <div className="flex gap-3 justify-end pb-8">
          <Link
            to="/buyer/orders"
            className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded text-sm font-medium transition-colors"
          >
            나중에 하기
          </Link>
          <button
            onClick={() => setSigned(true)}
            disabled={!canSign}
            className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <PenLine size={15} />
            서명 완료 및 결제 진행
          </button>
        </div>
      </div>
    </div>
  );
}
