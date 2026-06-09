import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, X, Zap, FileText, ChevronRight,
  CheckCircle, XCircle, RotateCcw, MessageSquare, Clock,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
type RequestStatus = "대기중" | "견적수신" | "승인" | "거절" | "재요청됨" | "협의중";
type BidStatus = "검토중" | "승인" | "거절" | "협의중";
type SourcingType = "READY" | "CUSTOM";

interface Bid {
  bidId: string;
  supplierName: string;
  unitPrice?: number;       // READY
  totalBudget?: number;     // CUSTOM
  samplePrice?: number;
  availableDate: string;
  comment: string;
  quoteFileUrl?: string;
  status: BidStatus;
  submittedAt: string;
}

interface SourcingRequest {
  id: string;
  type: SourcingType;
  productName: string;
  quantity: number;
  deliveryDate: string;
  detail: string;
  // READY
  unitPrice?: number;
  mainCategory?: string;
  subCategory?: string;
  // CUSTOM
  totalBudget?: number;
  needSample?: "Y" | "N";
  workFileCount?: number;
  status: RequestStatus;
  bids: Bid[];
  createdAt: string;
  // 재요청용 프리필 데이터
  prefillData: Record<string, unknown>;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────
const DUMMY_REQUESTS: SourcingRequest[] = [
  {
    id: "REQ-001", type: "READY", productName: "여성 린넨 와이드 팬츠",
    quantity: 200, unitPrice: 18000, deliveryDate: "2026-06-20",
    detail: "* 컬러/사이즈/수량: 아이보리 / S / 50장\n* 컬러/사이즈/수량: 아이보리 / M / 80장\n* 컬러/사이즈/수량: 베이지 / M / 70장",
    mainCategory: "하의", subCategory: "팬츠",
    status: "견적수신", createdAt: "2026-06-01",
    prefillData: { type: "READY", productName: "여성 린넨 와이드 팬츠", quantity: "200", unitPrice: "18000", deliveryDate: "2026-06-20", detail: "* 컬러/사이즈/수량: 아이보리 / S / 50장\n* 컬러/사이즈/수량: 아이보리 / M / 80장\n* 컬러/사이즈/수량: 베이지 / M / 70장", mainCategory: "하의", subCategory: "팬츠", totalBudget: "", needSample: "", workFiles: [] },
    bids: [
      { bidId: "BID-001", supplierName: "르블랑", unitPrice: 16500, availableDate: "2026-06-18", comment: "인증서 보유, 당일 퀵 가능합니다.", status: "검토중", submittedAt: "2026-06-03" },
      { bidId: "BID-002", supplierName: "패션마트", unitPrice: 17200, availableDate: "2026-06-19", comment: "동일 소재 재고 보유 중입니다.", status: "검토중", submittedAt: "2026-06-04" },
      { bidId: "BID-003", supplierName: "스타일플러스", unitPrice: 15800, availableDate: "2026-06-20", comment: "대량 주문 시 추가 할인 가능합니다.", status: "검토중", submittedAt: "2026-06-04" },
    ],
  },
  {
    id: "REQ-002", type: "READY", productName: "플리츠 미디 스커트",
    quantity: 210, unitPrice: 22000, deliveryDate: "2026-06-15",
    detail: "* 컬러/사이즈/수량: 블랙 / S / 70장\n* 컬러/사이즈/수량: 네이비 / M / 70장\n* 컬러/사이즈/수량: 네이비 / L / 70장",
    mainCategory: "하의", subCategory: "스커트",
    status: "승인", createdAt: "2026-05-25",
    prefillData: { type: "READY", productName: "플리츠 미디 스커트", quantity: "210", unitPrice: "22000", deliveryDate: "2026-06-15", detail: "* 컬러/사이즈/수량: 블랙 / S / 70장", mainCategory: "하의", subCategory: "스커트", totalBudget: "", needSample: "", workFiles: [] },
    bids: [
      { bidId: "BID-004", supplierName: "트렌드온", unitPrice: 21000, availableDate: "2026-06-14", comment: "", status: "승인", submittedAt: "2026-05-27" },
    ],
  },
  {
    id: "REQ-003", type: "READY", productName: "크롭 볼레로 가디건",
    quantity: 100, unitPrice: 25000, deliveryDate: "2026-07-01",
    detail: "* 컬러/사이즈/수량: 화이트 / S / 30장\n* 컬러/사이즈/수량: 베이지 / M / 40장\n* 컬러/사이즈/수량: 베이지 / L / 30장",
    mainCategory: "상의", subCategory: "가디건",
    status: "대기중", createdAt: "2026-06-05",
    prefillData: { type: "READY", productName: "크롭 볼레로 가디건", quantity: "100", unitPrice: "25000", deliveryDate: "2026-07-01", detail: "* 컬러/사이즈/수량: 화이트 / S / 30장", mainCategory: "상의", subCategory: "가디건", totalBudget: "", needSample: "", workFiles: [] },
    bids: [],
  },
  {
    id: "CUS-001", type: "CUSTOM", productName: "자체브랜드 시그니처 트렌치코트",
    quantity: 150, totalBudget: 12000000, deliveryDate: "2026-07-20",
    detail: "3페이지 컬러 샘플은 카멜 우선 진행 부탁드립니다. 안감 퀄리티 특히 신경써주세요.",
    mainCategory: "아우터", subCategory: "코트", needSample: "Y", workFileCount: 3,
    status: "견적수신", createdAt: "2026-06-02",
    prefillData: { type: "CUSTOM", productName: "자체브랜드 시그니처 트렌치코트", quantity: "150", totalBudget: "12000000", deliveryDate: "2026-07-20", detail: "3페이지 컬러 샘플은 카멜 우선 진행 부탁드립니다.", mainCategory: "아우터", subCategory: "코트", needSample: "Y", workFiles: [] },
    bids: [
      { bidId: "BID-005", supplierName: "르블랑", totalBudget: 11000000, samplePrice: 80000, availableDate: "2026-07-18", comment: "동일 소재 납품 경력 5년입니다.", quoteFileUrl: "quote_BID-005.pdf", status: "검토중", submittedAt: "2026-06-05" },
      { bidId: "BID-006", supplierName: "코트팩토리", totalBudget: 11500000, samplePrice: 60000, availableDate: "2026-07-15", comment: "샘플 1주일 내 가능합니다.", quoteFileUrl: "quote_BID-006.pdf", status: "검토중", submittedAt: "2026-06-06" },
    ],
  },
  {
    id: "CUS-002", type: "CUSTOM", productName: "OEM 요가복 세트",
    quantity: 500, totalBudget: 8500000, deliveryDate: "2026-07-10",
    detail: "소재 샘플 먼저 받아보고 싶습니다.",
    mainCategory: "스포츠/애슬레저", subCategory: "요가복", needSample: "Y", workFileCount: 2,
    status: "협의중", createdAt: "2026-05-28",
    prefillData: { type: "CUSTOM", productName: "OEM 요가복 세트", quantity: "500", totalBudget: "8500000", deliveryDate: "2026-07-10", detail: "소재 샘플 먼저 받아보고 싶습니다.", mainCategory: "스포츠/애슬레저", subCategory: "요가복", needSample: "Y", workFiles: [] },
    bids: [
      { bidId: "BID-007", supplierName: "핏스튜디오", totalBudget: 8200000, samplePrice: 50000, availableDate: "2026-07-08", comment: "", quoteFileUrl: "quote_BID-007.pdf", status: "협의중", submittedAt: "2026-05-30" },
    ],
  },
  {
    id: "CUS-003", type: "CUSTOM", productName: "ODM 니트 가디건 시즌 라인",
    quantity: 200, totalBudget: 6000000, deliveryDate: "2026-08-01",
    detail: "작업지시서 외 추가 요청사항 없습니다.",
    mainCategory: "상의", subCategory: "니트", needSample: "N", workFileCount: 4,
    status: "대기중", createdAt: "2026-06-06",
    prefillData: { type: "CUSTOM", productName: "ODM 니트 가디건 시즌 라인", quantity: "200", totalBudget: "6000000", deliveryDate: "2026-08-01", detail: "", mainCategory: "상의", subCategory: "니트", needSample: "N", workFiles: [] },
    bids: [],
  },
];

// ── 상태 배지 ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<RequestStatus, string> = {
  "대기중":   "bg-secondary text-muted-foreground border-border",
  "견적수신": "bg-blue-50 text-blue-600 border-blue-200",
  "승인":     "bg-green-50 text-green-600 border-green-200",
  "거절":     "bg-red-50 text-red-500 border-red-200",
  "재요청됨": "bg-amber-50 text-amber-600 border-amber-200",
  "협의중":   "bg-purple-50 text-purple-600 border-purple-200",
};

const BID_STATUS_STYLE: Record<BidStatus, string> = {
  "검토중": "bg-secondary text-muted-foreground border-border",
  "승인":   "bg-green-50 text-green-600 border-green-200",
  "거절":   "bg-red-50 text-red-500 border-red-200",
  "협의중": "bg-purple-50 text-purple-600 border-purple-200",
};

// ── 견적 상세 모달 ────────────────────────────────────────────────────
function BidDetailModal({
  request, bid, onClose, onAction,
}: {
  request: SourcingRequest;
  bid: Bid;
  onClose: () => void;
  onAction: (bidId: string, action: "승인" | "거절" | "협의중", memo?: string) => void;
}) {
  const [memo, setMemo] = useState("");
  const [showMemo, setShowMemo] = useState(false);
  const [confirmed, setConfirmed] = useState<"승인" | "거절" | "협의중" | null>(null);

  const handleAction = (action: "승인" | "거절" | "협의중") => {
    if (action === "협의중" && !showMemo) {
      setShowMemo(true);
      return;
    }
    onAction(bid.bidId, action, memo || undefined);
    setConfirmed(action);
  };

  const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";

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
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
          </div>
        </div>

        {confirmed ? (
          <div className="px-6 py-10 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmed === "승인" ? "bg-green-100" : confirmed === "협의중" ? "bg-purple-100" : "bg-red-100"}`}>
              {confirmed === "승인" ? <CheckCircle size={22} className="text-green-500" /> : confirmed === "협의중" ? <MessageSquare size={22} className="text-purple-500" /> : <XCircle size={22} className="text-red-500" />}
            </div>
            <div className="font-bold text-foreground mb-1">
              {confirmed === "승인" ? "견적이 승인되었습니다!" : confirmed === "협의중" ? "협의 요청이 전달되었습니다." : "견적이 거절되었습니다."}
            </div>
            <div className="text-sm text-muted-foreground mb-6">관리자를 통해 공급사에게 전달됩니다.</div>
            <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* 견적 핵심 정보 */}
            <div className="grid grid-cols-2 gap-2">
              {request.type === "READY" ? (
                <div className="bg-secondary rounded-lg p-3 text-center col-span-1">
                  <div className="text-xs text-muted-foreground mb-0.5">제시 단가</div>
                  <div className="font-bold text-foreground">{bid.unitPrice?.toLocaleString()}원</div>
                  {request.unitPrice && (
                    <div className={`text-[10px] mt-0.5 font-medium ${bid.unitPrice! <= request.unitPrice ? "text-green-600" : "text-red-500"}`}>
                      희망가 대비 {bid.unitPrice! <= request.unitPrice ? `▼ ${(request.unitPrice - bid.unitPrice!).toLocaleString()}원` : `▲ ${(bid.unitPrice! - request.unitPrice).toLocaleString()}원`}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-3 text-center col-span-1">
                  <div className="text-xs text-muted-foreground mb-0.5">제시 총예산</div>
                  <div className="font-bold text-foreground">{((bid.totalBudget ?? 0) / 10000).toLocaleString()}만원</div>
                  {request.totalBudget && (
                    <div className={`text-[10px] mt-0.5 font-medium ${bid.totalBudget! <= request.totalBudget ? "text-green-600" : "text-red-500"}`}>
                      희망예산 대비 {bid.totalBudget! <= request.totalBudget ? `▼ ${((request.totalBudget - bid.totalBudget!) / 10000).toLocaleString()}만원` : `▲ ${((bid.totalBudget! - request.totalBudget) / 10000).toLocaleString()}만원`}
                    </div>
                  )}
                </div>
              )}
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-0.5">납품 가능일</div>
                <div className="font-bold text-foreground">{bid.availableDate}</div>
              </div>
              {bid.samplePrice != null && (
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">샘플비</div>
                  <div className="font-bold text-foreground">{bid.samplePrice.toLocaleString()}원</div>
                </div>
              )}
            </div>

            {/* 메모 */}
            {bid.comment && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">공급사 메모</div>
                <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">{bid.comment}</div>
              </div>
            )}

            {/* 견적서 PDF */}
            {bid.quoteFileUrl && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">견적서</div>
                <div className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors cursor-pointer group/file">
                  <FileText size={14} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1">{bid.quoteFileUrl}</span>
                  <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">다운로드</span>
                </div>
              </div>
            )}

            {/* 협의 메모 입력 */}
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

            {/* 액션 버튼 */}
            {bid.status === "검토중" && (
              <div className={`grid gap-2 ${request.type === "CUSTOM" ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  onClick={() => handleAction("거절")}
                  className="py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} /> 거절
                </button>
                {request.type === "CUSTOM" && (
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
                )}
                <button
                  onClick={() => handleAction("승인")}
                  className="py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} /> 승인
                </button>
              </div>
            )}

            {bid.status !== "검토중" && (
              <div className={`text-center py-3 rounded-lg text-sm font-medium border ${BID_STATUS_STYLE[bid.status]}`}>
                이 견적은 <strong>{bid.status}</strong> 상태입니다
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 견적 목록 모달 ────────────────────────────────────────────────────
function BidListModal({
  request, onClose, onSelectBid, onRerequest,
}: {
  request: SourcingRequest;
  onClose: () => void;
  onSelectBid: (bid: Bid) => void;
  onRerequest: (request: SourcingRequest) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[520px] overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">{request.id} · {request.type === "READY" ? "기성품" : "주문제작"}</div>
            <h3 className="font-bold text-foreground">{request.productName}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 요청 요약 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">희망 수량</div>
              <div className="font-semibold text-sm text-foreground">{request.quantity.toLocaleString()}벌</div>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">{request.type === "READY" ? "희망 단가" : "희망 예산"}</div>
              <div className="font-semibold text-sm text-foreground">
                {request.type === "READY"
                  ? `${request.unitPrice?.toLocaleString()}원`
                  : `${((request.totalBudget ?? 0) / 10000).toLocaleString()}만원`}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">납기일</div>
              <div className="font-semibold text-sm text-foreground">{request.deliveryDate.slice(5)}</div>
            </div>
          </div>

          {/* 견적 목록 */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              접수된 견적 <span className="text-foreground font-bold">{request.bids.length}건</span>
            </div>
            {request.bids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                아직 접수된 견적이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {request.bids.map((bid) => (
                  <button
                    key={bid.bidId}
                    onClick={() => onSelectBid(bid)}
                    className="w-full flex items-center gap-4 border border-border rounded-lg px-4 py-3 hover:border-primary hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{bid.supplierName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{bid.submittedAt} 제출</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm text-foreground">
                        {request.type === "READY"
                          ? `${bid.unitPrice?.toLocaleString()}원`
                          : `${((bid.totalBudget ?? 0) / 10000).toLocaleString()}만원`}
                      </div>
                      <div className="text-xs text-muted-foreground">{bid.availableDate} 납품</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 재요청 버튼 */}
          {["견적수신", "대기중"].includes(request.status) && (
            <button
              onClick={() => onRerequest(request)}
              className="w-full py-2.5 border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={14} /> 재요청 (내용 수정 후 재등록)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 요청 리스트 행 ────────────────────────────────────────────────────
function RequestRow({
  request, onClick,
}: {
  request: SourcingRequest;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-lg px-5 py-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">{request.id}</span>
            <span className="text-[10px] bg-secondary text-primary px-2 py-0.5 rounded">
              {request.mainCategory}{request.subCategory ? ` > ${request.subCategory}` : ""}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[request.status]}`}>
              {request.status}
            </span>
          </div>
          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {request.productName}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{request.createdAt} 등록</div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
          <div>
            <div className="font-mono font-bold text-sm text-foreground">{request.quantity.toLocaleString()}벌</div>
            <div className="text-[10px] text-muted-foreground">희망수량</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-foreground">
              {request.type === "READY"
                ? `${request.unitPrice?.toLocaleString()}원`
                : `${((request.totalBudget ?? 0) / 10000).toLocaleString()}만원`}
            </div>
            <div className="text-[10px] text-muted-foreground">{request.type === "READY" ? "희망단가" : "희망예산"}</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-foreground">{request.deliveryDate.slice(5)}</div>
            <div className="text-[10px] text-muted-foreground">희망납기</div>
          </div>
          <div>
            <div className={`font-mono font-bold text-sm ${request.bids.length > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
              {request.bids.length}건
            </div>
            <div className="text-[10px] text-muted-foreground">접수견적</div>
          </div>
        </div>

        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function BuyerSourcingList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SourcingType>("READY");
  const [requests, setRequests] = useState<SourcingRequest[]>(DUMMY_REQUESTS);

  const [selectedRequest, setSelectedRequest] = useState<SourcingRequest | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  const handleTabChange = (tab: SourcingType) => {
    setActiveTab(tab);
    setSelectedRequest(null);
    setSelectedBid(null);
  };

  const handleBidAction = (bidId: string, action: "승인" | "거절" | "협의중", memo?: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== selectedRequest?.id) return req;
        const newBids = req.bids.map((b) => b.bidId === bidId ? { ...b, status: action } : b);
        const newStatus: RequestStatus = action === "승인" ? "승인" : action === "협의중" ? "협의중" : req.status;
        return { ...req, bids: newBids, status: newStatus };
      })
    );
    // selectedRequest도 동기화
    setSelectedRequest((prev) => {
      if (!prev) return prev;
      const newBids = prev.bids.map((b) => b.bidId === bidId ? { ...b, status: action } : b);
      return { ...prev, bids: newBids, status: action === "승인" ? "승인" : action === "협의중" ? "협의중" : prev.status };
    });
  };

  const handleRerequest = (request: SourcingRequest) => {
    navigate("/sourcing-request", {
      state: {
        prefillItem: request.prefillData,
        isRerequest: true,
        originalRequestId: request.id,
      },
    });
  };

  const filtered = requests.filter((r) => r.type === activeTab);
  const readyCount = requests.filter((r) => r.type === "READY").length;
  const customCount = requests.filter((r) => r.type === "CUSTOM").length;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <Package size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">소싱 요청 관리</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">접수된 견적을 확인하고 승인 또는 협의 진행하세요.</p>

      {/* 탭 */}
      <div className="flex gap-1 bg-secondary border border-border rounded-lg p-1 mb-6 w-fit">
        {(["READY", "CUSTOM"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-5 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-white text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "READY" ? "🏷️ 기성품 사입" : "✂️ 주문제작"}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono ${activeTab === tab ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
              {tab === "READY" ? readyCount : customCount}
            </span>
          </button>
        ))}
      </div>

      {/* 요청 목록 */}
      <div className="space-y-3">
        {filtered.map((req) => (
          <RequestRow key={req.id} request={req} onClick={() => setSelectedRequest(req)} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium">등록된 소싱 요청이 없습니다</div>
          </div>
        )}
      </div>

      {/* 견적 목록 모달 */}
      {selectedRequest && !selectedBid && (
        <BidListModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSelectBid={(bid) => setSelectedBid(bid)}
          onRerequest={handleRerequest}
        />
      )}

      {/* 견적 상세 모달 */}
      {selectedRequest && selectedBid && (
        <BidDetailModal
          request={selectedRequest}
          bid={selectedBid}
          onClose={() => setSelectedBid(null)}
          onAction={handleBidAction}
        />
      )}
    </div>
  );
}
