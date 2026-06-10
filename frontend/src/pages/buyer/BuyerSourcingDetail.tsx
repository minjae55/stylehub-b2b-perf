import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Package, FileText, FlaskConical, Clock,
  CheckCircle, XCircle, MessageSquare, CreditCard,
  ChevronRight, RotateCcw, X, Truck, Calendar,
  AlertTriangle, BadgeCheck, CircleDot,
} from "lucide-react";

// ── 타입 (BuyerSourcingList와 동일) ───────────────────────────────────
type RequestStatus = "대기중" | "견적수신" | "승인" | "거절" | "재요청됨" | "협의중";
type BidStatus = "검토중" | "승인" | "거절" | "협의중" | "샘플대기중" | "샘플발송됨";

interface Bid {
  bidId: string;
  supplierName: string;
  unitPrice?: number;
  totalBudget?: number;
  samplePrice?: number;
  availableDate: string;
  comment: string;
  quoteFileUrl?: string;
  status: BidStatus;
  submittedAt: string;
}

interface SourcingRequest {
  id: string;
  type: "CUSTOM";
  productName: string;
  quantity: number;
  deliveryDate: string;
  detail: string;
  totalBudget?: number;
  mainCategory?: string;
  subCategory?: string;
  needSample?: "Y" | "N";
  workFileCount?: number;
  status: RequestStatus;
  bids: Bid[];
  createdAt: string;
  prefillData: Record<string, unknown>;
}

// ── 더미 데이터 (CUSTOM만) ────────────────────────────────────────────
const DUMMY_CUSTOM_REQUESTS: SourcingRequest[] = [
  {
    id: "CUS-001",
    type: "CUSTOM",
    productName: "자체브랜드 시그니처 트렌치코트",
    quantity: 150,
    totalBudget: 12000000,
    deliveryDate: "2026-07-20",
    detail:
      "3페이지 컬러 샘플은 카멜 우선 진행 부탁드립니다. 안감 퀄리티 특히 신경써주세요.\n카멜/네이비/블랙 3컬러 각 50장씩 진행 예정입니다.",
    mainCategory: "아우터",
    subCategory: "코트",
    needSample: "Y",
    workFileCount: 3,
    status: "견적수신",
    createdAt: "2026-06-02",
    prefillData: {},
    bids: [
      {
        bidId: "BID-005",
        supplierName: "르블랑",
        totalBudget: 11000000,
        samplePrice: 80000,
        availableDate: "2026-07-18",
        comment: "동일 소재 납품 경력 5년입니다. 안감은 30수 폴리 혼방으로 진행 가능하며, 추가 원단 옵션도 제안 드릴 수 있습니다.",
        quoteFileUrl: "quote_BID-005.pdf",
        status: "검토중",
        submittedAt: "2026-06-05",
      },
      {
        bidId: "BID-006",
        supplierName: "코트팩토리",
        totalBudget: 11500000,
        samplePrice: 60000,
        availableDate: "2026-07-15",
        comment: "샘플 1주일 내 가능합니다.",
        quoteFileUrl: "quote_BID-006.pdf",
        status: "검토중",
        submittedAt: "2026-06-06",
      },
    ],
  },
  {
    id: "CUS-002",
    type: "CUSTOM",
    productName: "OEM 요가복 세트",
    quantity: 500,
    totalBudget: 8500000,
    deliveryDate: "2026-07-10",
    detail: "소재 샘플 먼저 받아보고 싶습니다.",
    mainCategory: "스포츠/애슬레저",
    subCategory: "요가복",
    needSample: "Y",
    workFileCount: 2,
    status: "협의중",
    createdAt: "2026-05-28",
    prefillData: {},
    bids: [
      {
        bidId: "BID-007",
        supplierName: "핏스튜디오",
        totalBudget: 8200000,
        samplePrice: 50000,
        availableDate: "2026-07-08",
        comment: "",
        quoteFileUrl: "quote_BID-007.pdf",
        status: "협의중",
        submittedAt: "2026-05-30",
      },
    ],
  },
  {
    id: "CUS-003",
    type: "CUSTOM",
    productName: "ODM 니트 가디건 시즌 라인",
    quantity: 200,
    totalBudget: 6000000,
    deliveryDate: "2026-08-01",
    detail: "작업지시서 외 추가 요청사항 없습니다.",
    mainCategory: "상의",
    subCategory: "니트",
    needSample: "N",
    workFileCount: 4,
    status: "대기중",
    createdAt: "2026-06-06",
    prefillData: {},
    bids: [],
  },
];

// ── 스타일 상수 ───────────────────────────────────────────────────────
const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  "대기중":   "bg-secondary text-muted-foreground border-border",
  "견적수신": "bg-blue-50 text-blue-600 border-blue-200",
  "승인":     "bg-green-50 text-green-600 border-green-200",
  "거절":     "bg-red-50 text-red-500 border-red-200",
  "재요청됨": "bg-amber-50 text-amber-600 border-amber-200",
  "협의중":   "bg-purple-50 text-purple-600 border-purple-200",
};

const BID_STATUS_STYLE: Record<BidStatus, string> = {
  "검토중":     "bg-secondary text-muted-foreground border-border",
  "승인":       "bg-green-50 text-green-600 border-green-200",
  "거절":       "bg-red-50 text-red-500 border-red-200",
  "협의중":     "bg-purple-50 text-purple-600 border-purple-200",
  "샘플대기중": "bg-amber-50 text-amber-600 border-amber-200",
  "샘플발송됨": "bg-teal-50 text-teal-600 border-teal-200",
};

const BID_STATUS_ICON: Record<BidStatus, React.ReactNode> = {
  "검토중":     <CircleDot size={12} />,
  "승인":       <BadgeCheck size={12} />,
  "거절":       <XCircle size={12} />,
  "협의중":     <MessageSquare size={12} />,
  "샘플대기중": <Clock size={12} />,
  "샘플발송됨": <Truck size={12} />,
};

// ── 샘플 결제 모달 ────────────────────────────────────────────────────
function SamplePaymentModal({
  bid,
  request,
  onClose,
  onPaid,
}: {
  bid: Bid;
  request: SourcingRequest;
  onClose: () => void;
  onPaid: (bidId: string) => void;
}) {
  const [step, setStep] = useState<"confirm" | "paying" | "done">("confirm");
  const samplePrice = bid.samplePrice ?? 0;

  const handlePay = () => {
    setStep("paying");
    setTimeout(() => {
      onPaid(bid.bidId);
      setStep("done");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== "paying" ? onClose : undefined}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-amber-500" />
            <h3 className="font-bold text-foreground">샘플 결제</h3>
          </div>
          {step !== "paying" && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {step === "done" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={22} className="text-amber-500" />
            </div>
            <div className="font-bold text-foreground mb-1">샘플 결제 완료!</div>
            <div className="text-sm text-muted-foreground mb-6">
              공급사에게 알림이 전송됩니다.
              <br />샘플 출고 후 수령 확인이 가능합니다.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              확인
            </button>
          </div>
        ) : step === "paying" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CreditCard size={22} className="text-primary" />
            </div>
            <div className="font-bold text-foreground mb-1">결제 처리 중...</div>
            <div className="text-sm text-muted-foreground">잠시만 기다려주세요.</div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">공급사</span>
                <span className="font-semibold text-foreground">{bid.supplierName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품명</span>
                <span className="font-semibold text-foreground truncate ml-4">
                  {request.productName}
                </span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between">
                <span className="text-sm font-semibold text-foreground">샘플비</span>
                <span className="font-bold text-lg text-foreground">
                  {samplePrice.toLocaleString()}원
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded px-3 py-2.5 leading-relaxed">
              샘플비는 수령 후 발주 진행 여부와 무관하게 환불되지 않습니다.
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handlePay}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={14} /> {samplePrice.toLocaleString()}원 결제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 견적 상세 모달 ────────────────────────────────────────────────────
function BidDetailModal({
  request,
  bid,
  onClose,
  onAction,
  onSampleRequest,
}: {
  request: SourcingRequest;
  bid: Bid;
  onClose: () => void;
  onAction: (bidId: string, action: "승인" | "거절" | "협의중", memo?: string) => void;
  onSampleRequest: (bid: Bid) => void;
}) {
  const [memo, setMemo] = useState("");
  const [showMemo, setShowMemo] = useState(false);
  const [confirmed, setConfirmed] = useState<"승인" | "거절" | "협의중" | null>(null);

  const needSample = request.needSample === "Y";
  const isSampleFlow = needSample;

  const handleAction = (action: "승인" | "거절" | "협의중") => {
    if (action === "협의중" && !showMemo) {
      setShowMemo(true);
      return;
    }
    onAction(bid.bidId, action, memo || undefined);
    setConfirmed(action);
  };

  const inputCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[460px] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">{bid.bidId}</div>
            <h3 className="font-bold text-foreground">{bid.supplierName}의 견적</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${BID_STATUS_STYLE[bid.status]}`}
            >
              {BID_STATUS_ICON[bid.status]} {bid.status}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {confirmed ? (
          <div className="px-6 py-10 text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmed === "승인"
                  ? "bg-green-100"
                  : confirmed === "협의중"
                  ? "bg-purple-100"
                  : "bg-red-100"
              }`}
            >
              {confirmed === "승인" ? (
                <CheckCircle size={22} className="text-green-500" />
              ) : confirmed === "협의중" ? (
                <MessageSquare size={22} className="text-purple-500" />
              ) : (
                <XCircle size={22} className="text-red-500" />
              )}
            </div>
            <div className="font-bold text-foreground mb-1">
              {confirmed === "승인"
                ? "견적이 승인되었습니다!"
                : confirmed === "협의중"
                ? "협의 요청이 전달되었습니다."
                : "견적이 거절되었습니다."}
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              관리자를 통해 공급사에게 전달됩니다.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* 견적 핵심 정보 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-0.5">제시 총예산</div>
                <div className="font-bold text-foreground">
                  {((bid.totalBudget ?? 0) / 10000).toLocaleString()}만원
                </div>
                {request.totalBudget && (
                  <div
                    className={`text-[10px] mt-0.5 font-medium ${
                      bid.totalBudget! <= request.totalBudget
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    희망예산 대비{" "}
                    {bid.totalBudget! <= request.totalBudget
                      ? `▼ ${((request.totalBudget - bid.totalBudget!) / 10000).toLocaleString()}만원`
                      : `▲ ${((bid.totalBudget! - request.totalBudget) / 10000).toLocaleString()}만원`}
                  </div>
                )}
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-0.5">납품 가능일</div>
                <div className="font-bold text-foreground">{bid.availableDate}</div>
                <div
                  className={`text-[10px] mt-0.5 font-medium ${
                    bid.availableDate <= request.deliveryDate ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {bid.availableDate <= request.deliveryDate ? "납기 충족" : "납기 초과"}
                </div>
              </div>
              {bid.samplePrice != null && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center col-span-2">
                  <div className="text-xs text-amber-600 mb-0.5">샘플비</div>
                  <div className="font-bold text-amber-700">
                    {bid.samplePrice.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-amber-500 mt-0.5">승인 전 샘플 수령 필요</div>
                </div>
              )}
            </div>

            {bid.comment && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">공급사 메모</div>
                <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">
                  {bid.comment}
                </div>
              </div>
            )}

            {bid.quoteFileUrl && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">견적서</div>
                <div className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors cursor-pointer group/file">
                  <FileText size={14} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1">{bid.quoteFileUrl}</span>
                  <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">
                    다운로드
                  </span>
                </div>
              </div>
            )}

            {showMemo && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  협의 요청 내용 <span className="text-primary">*</span>
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="예: 납기일을 1주일 앞당길 수 있는지 확인 부탁드립니다."
                  className={`${inputCls} resize-none`}
                  autoFocus
                />
              </div>
            )}

            {/* 액션 버튼 — 검토중 */}
            {bid.status === "검토중" && (
              <div className={`grid gap-2 ${isSampleFlow ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  onClick={() => handleAction("거절")}
                  className="py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} /> 거절
                </button>
                <button
                  onClick={() => handleAction("협의중")}
                  disabled={showMemo && !memo.trim()}
                  className={`py-2.5 border rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                    showMemo && !memo.trim()
                      ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-purple-200 text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  <MessageSquare size={14} /> {showMemo ? "전달하기" : "협의"}
                </button>
                {isSampleFlow ? (
                  <button
                    onClick={() => onSampleRequest(bid)}
                    className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FlaskConical size={14} /> 샘플 요청
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction("승인")}
                    className="py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5 col-span-1"
                  >
                    <CheckCircle size={14} /> 승인
                  </button>
                )}
              </div>
            )}

            {/* 샘플 발송됨 — 수령 후 승인/거절 */}
            {bid.status === "샘플발송됨" && (
              <div className="space-y-2">
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-sm text-teal-700 flex items-center gap-2">
                  <FlaskConical size={14} /> 샘플이 발송되었습니다. 수령 후 결정해주세요.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction("거절")}
                    className="py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} /> 거절
                  </button>
                  <button
                    onClick={() => handleAction("승인")}
                    className="py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} /> 승인
                  </button>
                </div>
              </div>
            )}

            {bid.status === "샘플대기중" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                <Clock size={14} /> 공급사가 샘플을 준비 중입니다.
              </div>
            )}

            {(bid.status === "승인" || bid.status === "거절") && (
              <div
                className={`text-center py-3 rounded-lg text-sm font-medium border ${BID_STATUS_STYLE[bid.status]}`}
              >
                이 견적은 <strong>{bid.status}</strong> 상태입니다
              </div>
            )}

            {bid.status === "협의중" && (
              <div
                className={`text-center py-3 rounded-lg text-sm font-medium border ${BID_STATUS_STYLE[bid.status]}`}
              >
                협의 진행 중입니다
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 요청 상태 타임라인 ────────────────────────────────────────────────
function StatusTimeline({ status, needSample }: { status: RequestStatus; needSample?: "Y" | "N" }) {
  const steps = needSample === "Y"
    ? ["대기중", "견적수신", "협의중", "샘플대기중", "승인"] as const
    : ["대기중", "견적수신", "협의중", "승인"] as const;

  const statusOrder: Record<string, number> = {
    "대기중": 0,
    "견적수신": 1,
    "협의중": 2,
    "샘플대기중": 3,
    "승인": needSample === "Y" ? 4 : 3,
    "거절": -1,
    "재요청됨": -1,
  };

  const currentIdx = statusOrder[status] ?? 0;

  if (status === "거절") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <XCircle size={14} /> 이 소싱 요청은 거절 처리되었습니다.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const last = idx === steps.length - 1;
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-secondary border-2 border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle size={12} /> : idx + 1}
              </div>
              <div
                className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </div>
            </div>
            {!last && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${
                  done ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 견적 카드 ─────────────────────────────────────────────────────────
function BidCard({
  bid,
  request,
  onClick,
}: {
  bid: Bid;
  request: SourcingRequest;
  onClick: () => void;
}) {
  const budgetDiff = request.totalBudget
    ? request.totalBudget - (bid.totalBudget ?? 0)
    : null;
  const isUnder = budgetDiff !== null && budgetDiff >= 0;
  const dateOk = bid.availableDate <= request.deliveryDate;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-border rounded-xl px-5 py-4 hover:border-primary hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bold text-foreground group-hover:text-primary transition-colors">
            {bid.supplierName}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{bid.submittedAt} 제출</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${BID_STATUS_STYLE[bid.status]}`}
          >
            {BID_STATUS_ICON[bid.status]} {bid.status}
          </span>
          <ChevronRight
            size={14}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-secondary rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground mb-0.5">제시 예산</div>
          <div className="font-bold text-sm text-foreground">
            {((bid.totalBudget ?? 0) / 10000).toLocaleString()}만
          </div>
          {budgetDiff !== null && (
            <div className={`text-[10px] font-medium ${isUnder ? "text-green-600" : "text-red-500"}`}>
              {isUnder ? `▼ ${(budgetDiff / 10000).toLocaleString()}만` : `▲ ${(Math.abs(budgetDiff) / 10000).toLocaleString()}만`}
            </div>
          )}
        </div>
        <div className="bg-secondary rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground mb-0.5">납품 가능일</div>
          <div className="font-bold text-sm text-foreground">{bid.availableDate.slice(5)}</div>
          <div className={`text-[10px] font-medium ${dateOk ? "text-green-600" : "text-red-500"}`}>
            {dateOk ? "납기 충족" : "납기 초과"}
          </div>
        </div>
        <div
          className={`rounded-lg p-2.5 text-center ${
            bid.samplePrice != null
              ? "bg-amber-50 border border-amber-200"
              : "bg-secondary"
          }`}
        >
          <div className={`text-[10px] mb-0.5 ${bid.samplePrice != null ? "text-amber-600" : "text-muted-foreground"}`}>
            샘플비
          </div>
          <div className={`font-bold text-sm ${bid.samplePrice != null ? "text-amber-700" : "text-muted-foreground"}`}>
            {bid.samplePrice != null ? `${bid.samplePrice.toLocaleString()}원` : "—"}
          </div>
        </div>
      </div>

      {bid.comment && (
        <div className="text-xs text-muted-foreground bg-secondary rounded px-3 py-2 line-clamp-1">
          {bid.comment}
        </div>
      )}

      {bid.quoteFileUrl && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
          <FileText size={11} /> {bid.quoteFileUrl}
        </div>
      )}
    </button>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function BuyerSourcingDetail() {
  const navigate = useNavigate();
  // useParams로 실제 라우팅 시 id를 받아오는 구조
  // 데모에서는 첫 번째 CUSTOM 요청을 기본값으로 사용
  const { id } = useParams<{ id: string }>();
  const request = DUMMY_CUSTOM_REQUESTS.find((r) => r.id === (id ?? "CUS-001")) ?? DUMMY_CUSTOM_REQUESTS[0];

  const [requests, setRequests] = useState<SourcingRequest[]>(DUMMY_CUSTOM_REQUESTS);
  const currentRequest = requests.find((r) => r.id === request.id) ?? request;

  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [samplePayBid, setSamplePayBid] = useState<Bid | null>(null);

  const handleBidAction = (
    bidId: string,
    action: "승인" | "거절" | "협의중",
    _memo?: string
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== currentRequest.id) return req;
        const newBids = req.bids.map((b) =>
          b.bidId === bidId ? { ...b, status: action as BidStatus } : b
        );
        const newStatus: RequestStatus =
          action === "승인" ? "승인" : action === "협의중" ? "협의중" : req.status;
        return { ...req, bids: newBids, status: newStatus };
      })
    );
    setSelectedBid((prev) =>
      prev?.bidId === bidId ? { ...prev, status: action as BidStatus } : prev
    );
  };

  const handleSamplePaid = (bidId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== currentRequest.id) return req;
        const newBids = req.bids.map((b) =>
          b.bidId === bidId ? { ...b, status: "샘플대기중" as BidStatus } : b
        );
        return { ...req, bids: newBids };
      })
    );
    setSelectedBid((prev) =>
      prev?.bidId === bidId ? { ...prev, status: "샘플대기중" as BidStatus } : prev
    );
    setSamplePayBid(null);
  };

  const handleRerequest = () => {
    navigate("/sourcing-request", {
      state: {
        prefillItem: currentRequest.prefillData,
        isRerequest: true,
        originalRequestId: currentRequest.id,
      },
    });
  };

  const activeBidCount = currentRequest.bids.length;
  const approvedBid = currentRequest.bids.find((b) => b.status === "승인");

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} /> 소싱 요청 목록
      </button>

      {/* ── 상단: 요청 정보 ────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        {/* 헤더 바 */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">
                  {currentRequest.id}
                </span>
                <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded font-medium">
                  ✂️ 주문제작
                </span>
                {currentRequest.mainCategory && (
                  <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                    {currentRequest.mainCategory}
                    {currentRequest.subCategory ? ` > ${currentRequest.subCategory}` : ""}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${REQUEST_STATUS_STYLE[currentRequest.status]}`}
                >
                  {currentRequest.status}
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                {currentRequest.productName}
              </h1>
              <div className="text-xs text-muted-foreground">
                {currentRequest.createdAt} 등록
              </div>
            </div>
            {/* 재요청 버튼 — 대기중/견적수신일 때만 */}
            {["대기중", "견적수신"].includes(currentRequest.status) && (
              <button
                onClick={handleRerequest}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary rounded-lg text-xs font-medium transition-colors"
              >
                <RotateCcw size={12} /> 재요청
              </button>
            )}
          </div>
        </div>

        {/* 핵심 수치 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
          {[
            {
              label: "희망 수량",
              value: `${currentRequest.quantity.toLocaleString()}벌`,
              icon: <Package size={13} />,
            },
            {
              label: "전체 예산",
              value: `${((currentRequest.totalBudget ?? 0) / 10000).toLocaleString()}만원`,
              icon: <CreditCard size={13} />,
            },
            {
              label: "희망 납기",
              value: currentRequest.deliveryDate,
              icon: <Calendar size={13} />,
            },
            {
              label: "샘플",
              value: currentRequest.needSample === "Y" ? "필요" : "불필요",
              icon: <FlaskConical size={13} />,
              highlight: currentRequest.needSample === "Y",
            },
          ].map(({ label, value, icon, highlight }) => (
            <div key={label} className="px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                {icon} {label}
              </div>
              <div
                className={`font-bold text-sm ${
                  highlight ? "text-amber-600" : "text-foreground"
                }`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* 세부 내용 + 작업지시서 */}
        <div className="px-6 py-5 grid sm:grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              요청 상세
            </div>
            <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
              {currentRequest.detail || "—"}
            </div>
          </div>
          {(currentRequest.workFileCount ?? 0) > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                작업지시서 ({currentRequest.workFileCount}건)
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: currentRequest.workFileCount ?? 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors cursor-pointer group/file"
                  >
                    <FileText size={13} className="text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1 text-xs">
                      작업지시서_{currentRequest.id}_{i + 1}.pdf
                    </span>
                    <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">
                      다운로드
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 진행 상태 타임라인 */}
        <div className="px-6 py-4 border-t border-border bg-secondary/30">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            진행 현황
          </div>
          <StatusTimeline
            status={currentRequest.status}
            needSample={currentRequest.needSample}
          />
        </div>
      </div>

      {/* ── 하단: 견적 목록 ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-foreground">접수된 견적</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeBidCount > 0
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {activeBidCount}건
            </span>
          </div>
          {approvedBid && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 font-medium">
              <BadgeCheck size={12} /> {approvedBid.supplierName} 승인 완료
            </div>
          )}
        </div>

        {activeBidCount === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-white border border-border rounded-xl">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium mb-1">아직 접수된 견적이 없습니다</div>
            <div className="text-sm">
              공급사들이 견적을 제출하면 이곳에 표시됩니다.
            </div>
            {currentRequest.status === "대기중" && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                <AlertTriangle size={11} /> 견적 수신까지 시간이 걸릴 수 있습니다
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentRequest.bids.map((bid) => (
              <BidCard
                key={bid.bidId}
                bid={bid}
                request={currentRequest}
                onClick={() => setSelectedBid(bid)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 견적 상세 모달 */}
      {selectedBid && !samplePayBid && (
        <BidDetailModal
          request={currentRequest}
          bid={selectedBid}
          onClose={() => setSelectedBid(null)}
          onAction={handleBidAction}
          onSampleRequest={(bid) => setSamplePayBid(bid)}
        />
      )}

      {/* 샘플 결제 모달 */}
      {samplePayBid && (
        <SamplePaymentModal
          bid={samplePayBid}
          request={currentRequest}
          onClose={() => setSamplePayBid(null)}
          onPaid={handleSamplePaid}
        />
      )}
    </div>
  );
}
