import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Package, FileText, FlaskConical, Clock,
  CheckCircle, XCircle, MessageSquare, CreditCard,
  ChevronRight, X, Truck, BadgeCheck,
  CircleDot, AlertTriangle, Loader2, Ban,
} from "lucide-react";

// ── 타입 (백엔드 SourcingRequestDto 기준) ────────────────────────────────────
// SourcingStatus enum → 한글 매핑
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN";
// SourcingSupplierStatus enum → 한글 매핑
type BidStatus = "SUGGESTED" | "RECOMMENDED" | "QUOTED" | "DECLINED" | "EXPIRED";

export interface SourcingOptionDetail {
  sourcingRequestItemId: number;
  optionSummary: string;
  quantity: number;
  sampleQuantity?: number;
}

export interface SourcingFileDetail {
  sourcingRequestFileId: number;
  fileType: "REF_IMAGE" | "WORK_FILE";
  fileName: string;
  fileUrl: string;
}

export interface BidDetail {
  sourcingSupplierId: number;
  sellerCompanyId: number;
  companyName?: string;
  status: BidStatus;
  submittedAt?: string;
  quoteId?: number;
  totalAmount?: number; // SupplierCard 요약용
}

export interface SourcingRequestDetail {
  sourcingRequestId: number;
  sourcingNo: string;
  type: "READY" | "CUSTOM";
  status: RequestStatus;
  productName: string;
  brandName?: string;
  subCategoryId?: number;
  needSample: "Y" | "N";
  mainMaterial?: string;
  unitPrice?: number;
  refUrl?: string;
  totalBudget?: number;
  detail?: string;
  deliveryDate?: string;
  expiryDate?: string;
  createdAt: string;
  items: SourcingOptionDetail[];
  files: SourcingFileDetail[];
  bids: BidDetail[];
}

// ── 상태 한글 변환 ────────────────────────────────────────────────────────────
const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING:     "대기중",
  QUOTED:      "견적수신",
  TRADING:     "거래중",
  NEGOTIATING: "협의중",
  CANCELLED:   "취소됨",
  COMPLETED:   "완료",
  WITHDRAWN:   "취소됨",
};

const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING:     "bg-secondary text-muted-foreground border-border",
  QUOTED:      "bg-blue-50 text-blue-600 border-blue-200",
  TRADING:     "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATING: "bg-purple-50 text-purple-600 border-purple-200",
  CANCELLED:   "bg-red-50 text-red-500 border-red-200",
  COMPLETED:   "bg-green-50 text-green-600 border-green-200",
  WITHDRAWN:   "bg-secondary text-muted-foreground border-border",
};

const BID_STATUS_LABEL: Record<BidStatus, string> = {
  SUGGESTED:   "검토중",
  RECOMMENDED: "검토중",
  QUOTED:      "견적제출",
  DECLINED:    "거절",
  EXPIRED:     "만료",
};

const BID_STATUS_STYLE: Record<BidStatus, string> = {
  SUGGESTED:   "bg-secondary text-muted-foreground border-border",
  RECOMMENDED: "bg-blue-50 text-blue-600 border-blue-200",
  QUOTED:      "bg-green-50 text-green-600 border-green-200",
  DECLINED:    "bg-red-50 text-red-500 border-red-200",
  EXPIRED:     "bg-secondary text-muted-foreground border-border",
};

const BID_STATUS_ICON: Partial<Record<BidStatus, React.ReactNode>> = {
  SUGGESTED:   <CircleDot size={11} />,
  RECOMMENDED: <CircleDot size={11} />,
  QUOTED:      <BadgeCheck size={11} />,
  DECLINED:    <XCircle size={11} />,
  EXPIRED:     <Clock size={11} />,
};

// ── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = "/api/sourcing";

async function fetchSourcingDetail(requestId: string): Promise<SourcingRequestDetail> {
  const res = await fetch(`${BASE_URL}/requests/${requestId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`소싱 요청 조회 실패: ${res.status}`);
  return res.json();
}

interface QuoteDetail {
  quote_id: number;
  quote_no: string;
  company_name: string;
  seller_name: string;
  lead_time_days: number;
  valid_until: string;
  sample_available: string;
  seller_memo: string;
  subtotal_amount: number;
  total_amount: number;
  shipping_fee: number;
  status: string;
  submitted_at: string;
  quote_items: {
    quote_item_id: number;
    option_summary: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    is_sample: boolean;
  }[];
}

async function fetchQuoteDetail(quoteId: number): Promise<QuoteDetail> {
  const res = await fetch(`/api/quotes/${quoteId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`견적 조회 실패: ${res.status}`);
  return res.json();
}

async function withdrawSourcingRequest(sourcingRequestId: number): Promise<void> {
  const res = await fetch(`/api/sourcing/buyer/requests/${sourcingRequestId}/withdraw`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`취소 처리 실패: ${res.status}`);
}

// ── 취소 확인 모달 ────────────────────────────────────────────────────────────
function WithdrawConfirmModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[380px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Ban size={16} className="text-red-500" />
              <h3 className="font-bold text-foreground">소싱 요청 취소</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-foreground">
              소싱 요청을 취소하면 배정된 공급사들의 견적이 모두 거절 처리됩니다.
            </p>
            <p className="text-xs text-muted-foreground">취소 후에는 되돌릴 수 없습니다.</p>
            <div className="flex gap-2 pt-1">
              <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
              >
                닫기
              </button>
              <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Ban size={14} /> {isLoading ? "처리 중..." : "취소하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

// ── 견적 상세 모달 ────────────────────────────────────────────────────────────
function BidDetailModal({
                          request,
                          bid,
                          onClose,
                          onNavigateNegotiation,
                        }: {
  request: SourcingRequestDetail;
  bid: BidDetail;
  onClose: () => void;
  onNavigateNegotiation: () => void;
}) {
  const hasQuote = bid.quoteId != null;
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (!bid.quoteId) return;
    setQuoteLoading(true);
    fetchQuoteDetail(bid.quoteId)
        .then(setQuoteDetail)
        .catch(console.error)
        .finally(() => setQuoteLoading(false));
  }, [bid.quoteId]);

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">{bid.companyName ?? `공급사 #${bid.sellerCompanyId}`}</div>
              <h3 className="font-bold text-foreground">견적 상세</h3>
            </div>
            <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${BID_STATUS_STYLE[bid.status]}`}>
              {BID_STATUS_ICON[bid.status]} {BID_STATUS_LABEL[bid.status]}
            </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {!hasQuote ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="text-3xl mb-3">📋</div>
                  <div className="font-medium mb-1">아직 견적이 제출되지 않았습니다</div>
                  <div className="text-sm">공급사가 견적을 제출하면 내용을 확인할 수 있습니다.</div>
                </div>
            ) : (
                <>
                  {/* 핵심 수치 */}
                  <div className="grid grid-cols-2 gap-2">
                    {quoteDetail?.total_amount != null && (
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-0.5">제시 총금액</div>
                          <div className="font-bold text-foreground">
                            {(quoteDetail.total_amount / 10000).toLocaleString()}만원
                          </div>
                          {request.totalBudget && (
                              <div className={`text-[10px] mt-0.5 font-medium ${quoteDetail.total_amount <= request.totalBudget ? "text-green-600" : "text-red-500"}`}>
                                희망 대비 {quoteDetail.total_amount <= request.totalBudget
                                  ? `▼ ${((request.totalBudget - quoteDetail.total_amount) / 10000).toLocaleString()}만원`
                                  : `▲ ${((quoteDetail.total_amount - request.totalBudget) / 10000).toLocaleString()}만원`}
                              </div>
                          )}
                        </div>
                    )}
                    {quoteDetail?.lead_time_days != null && (
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-0.5">리드타임</div>
                          <div className="font-bold text-foreground">{quoteDetail.lead_time_days}일</div>
                        </div>
                    )}
                    {quoteDetail?.sample_available && (
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-0.5">샘플</div>
                          <div className="font-bold text-foreground text-sm">
                            {quoteDetail.sample_available === "AVAILABLE" ? "가능" : "불가"}
                          </div>
                        </div>
                    )}
                    {quoteDetail?.shipping_fee != null && (
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-0.5">배송비</div>
                          <div className="font-bold text-foreground">{quoteDetail.shipping_fee.toLocaleString()}원</div>
                        </div>
                    )}
                  </div>

                  {/* 옵션별 단가 테이블 */}
                  {quoteLoading && (
                      <div className="text-center py-4 text-sm text-muted-foreground">불러오는 중...</div>
                  )}
                  {!quoteLoading && quoteDetail?.quote_items?.length ? (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">옵션별 견적</div>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-secondary">
                            <tr>
                              <th className="text-left px-3 py-2 text-muted-foreground font-medium">옵션</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">수량</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">단가</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">합계</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            {quoteDetail.quote_items.map((item) => (
                                <tr key={item.quote_item_id} className={item.is_sample ? "bg-amber-50" : ""}>
                                  <td className="px-3 py-2 text-foreground">
                                    {item.option_summary || "—"}
                                    {item.is_sample && <span className="ml-1 text-amber-600 font-medium">(샘플)</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right text-foreground">{item.quantity.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-right text-foreground">{item.unit_price.toLocaleString()}원</td>
                                  <td className="px-3 py-2 text-right font-semibold text-foreground">{item.total_price.toLocaleString()}원</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : null}

                  {/* 셀러 메모 */}
                  {quoteDetail?.seller_memo && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">공급사 메모</div>
                        <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">
                          {quoteDetail.seller_memo}
                        </div>
                      </div>
                  )}

                  {/* 유효기간 */}
                  {quoteDetail?.valid_until && (
                      <div className="text-xs text-muted-foreground bg-secondary rounded px-3 py-2">
                        견적 유효기간: <strong className="text-foreground">{quoteDetail.valid_until.slice(0, 10)}</strong>
                      </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    {/* TODO: 거절 API 연동 (팀원 도메인) */}
                    <button
                        onClick={() => alert("TODO: 거절 API")}
                        className="flex-1 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} /> 거절
                    </button>

                    {/* TODO: 승인/샘플요청 API 연동 (팀원 도메인) */}
                    {request.needSample === "Y" ? (
                        <button
                            onClick={() => alert("TODO: 샘플 요청 API")}
                            className="flex-1 py-2.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FlaskConical size={14} /> 샘플 요청
                        </button>
                    ) : (
                        <button
                            onClick={() => alert("TODO: 승인 API")}
                            className="flex-1 py-2.5 border border-green-200 text-green-600 hover:bg-green-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} /> 승인
                        </button>
                    )}
                  </div>

                  {/* 협의하기 */}
                  <button
                      onClick={onNavigateNegotiation}
                      className="w-full py-2.5 border border-purple-200 text-purple-600 hover:bg-purple-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} /> 협의하기
                  </button>
                </>
            )}
          </div>
        </div>
      </div>
  );
}

// ── 공급사 카드 ───────────────────────────────────────────────────────────────
function SupplierCard({
                        bid,
                        request,
                        onSelectBid,
                        onNavigateNegotiation,
                      }: {
  bid: BidDetail;
  request: SourcingRequestDetail;
  onSelectBid: (bid: BidDetail) => void;
  onNavigateNegotiation: () => void;
}) {
  const hasQuote = bid.quoteId != null;
  const budgetDiff = request.totalBudget && bid.totalAmount != null
      ? request.totalBudget - bid.totalAmount
      : null;

  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-foreground">
              {bid.companyName ?? `공급사 #${bid.sellerCompanyId}`}
            </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${BID_STATUS_STYLE[bid.status]}`}>
              {BID_STATUS_ICON[bid.status]} {BID_STATUS_LABEL[bid.status]}
            </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {hasQuote ? (
                  <>
                    {bid.totalAmount != null && `${(bid.totalAmount / 10000).toLocaleString()}만원`}
                    {budgetDiff !== null && (
                        <span className={`ml-1.5 font-semibold ${budgetDiff >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ({budgetDiff >= 0
                            ? `▼ ${(budgetDiff / 10000).toLocaleString()}만`
                            : `▲ ${(Math.abs(budgetDiff) / 10000).toLocaleString()}만`})
                  </span>
                    )}
                  </>
              ) : (
                  <span className="text-muted-foreground">견적 대기 중</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {hasQuote && (
                <>
                  {/* TODO: 거절 API 연동 (팀원 도메인) */}
                  <button
                      onClick={() => alert("TODO: 거절 API")}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <XCircle size={12} /> 거절
                  </button>

                  {/* TODO: 승인/샘플요청 API 연동 (팀원 도메인) */}
                  {request.needSample === "Y" ? (
                      <button
                          onClick={() => alert("TODO: 샘플 요청 API")}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <FlaskConical size={12} /> 샘플 요청
                      </button>
                  ) : (
                      <button
                          onClick={() => alert("TODO: 승인 API")}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <CheckCircle size={12} /> 승인
                      </button>
                  )}
                </>
            )}
            <button
                onClick={onNavigateNegotiation}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <MessageSquare size={12} /> 협의하기
            </button>
            <button
                onClick={() => onSelectBid(bid)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:border-primary hover:text-primary rounded-lg text-xs font-semibold transition-colors"
            >
              상세보기 <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export function BuyerSourcingDetail() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();

  const [request, setRequest] = useState<SourcingRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<BidDetail | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    fetchSourcingDetail(requestId)
        .then(setRequest)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [requestId]);

  const handleWithdraw = async () => {
    if (!request) return;
    setWithdrawing(true);
    try {
      await withdrawSourcingRequest(request.sourcingRequestId);
      setRequest((prev) => prev ? { ...prev, status: "WITHDRAWN" } : prev);
      setShowWithdraw(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "취소 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
        <div className="max-w-[860px] mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm">불러오는 중...</span>
        </div>
    );
  }

  if (error || !request) {
    return (
        <div className="max-w-[860px] mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="font-bold text-foreground mb-1">소싱 요청을 불러올 수 없습니다</div>
          <div className="text-sm text-muted-foreground mb-6">{error ?? "알 수 없는 오류"}</div>
          <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            뒤로가기
          </button>
        </div>
    );
  }

  const totalQty = (request.items ?? []).reduce((sum, o) => sum + o.quantity, 0);
  const quotedBids = (request.bids ?? []).filter((b) => b.quoteId != null);

  return (
      <div className="max-w-[860px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        {/* 뒤로가기 */}
        <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> 소싱 요청 목록
        </button>

        {/* ── 요청 정보 카드 ── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">{request.sourcingNo}</span>
                  <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded font-medium">
                  {request.type === "CUSTOM" ? "✂️ 주문제작" : "🏷️ 기성품"}
                </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${REQUEST_STATUS_STYLE[request.status]}`}>
                  {REQUEST_STATUS_LABEL[request.status]}
                </span>
                </div>
                <h1 className="text-xl font-bold text-foreground mb-1">{request.productName}</h1>
                <div className="text-xs text-muted-foreground">{request.createdAt.slice(0, 10)} 등록</div>
              </div>
              {["PENDING", "QUOTED"].includes(request.status) && (
                  <button
                      onClick={() => setShowWithdraw(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Ban size={12} /> 취소
                  </button>
              )}
            </div>
          </div>

          {/* 핵심 수치 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
            {[
              {
                label: "희망 수량",
                value: `${totalQty.toLocaleString()}벌`,
                icon: <Package size={13} />,
              },
              {
                label: request.type === "CUSTOM" ? "전체 예산" : "희망 단가",
                value: request.type === "CUSTOM"
                    ? request.totalBudget ? `${(request.totalBudget / 10000).toLocaleString()}만원` : "—"
                    : request.unitPrice ? `${request.unitPrice.toLocaleString()}원` : "—",
                icon: <CreditCard size={13} />,
              },
              {
                label: "희망 납기",
                value: request.deliveryDate ?? "—",
                icon: null,
              },
              {
                label: "샘플",
                value: request.needSample === "Y" ? "필요" : "불필요",
                icon: <FlaskConical size={13} />,
                highlight: request.needSample === "Y",
              },
            ].map(({ label, value, icon, highlight }) => (
                <div key={label} className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                    {icon} {label}
                  </div>
                  <div className={`font-bold text-sm ${highlight ? "text-amber-600" : "text-foreground"}`}>
                    {value}
                  </div>
                </div>
            ))}
          </div>

          {/* 옵션별 수량 */}
          {(request.items ?? []).length > 0 && (
              <div className="px-6 py-4 border-b border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">옵션별 수량</div>
                <div className="space-y-1.5">
                  {request.items.map((opt) => (
                      <div key={opt.sourcingRequestItemId} className="flex items-center justify-between text-sm bg-secondary rounded px-3 py-2">
                        <span className="text-foreground">{opt.optionSummary || "—"}</span>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span><strong className="text-foreground">{opt.quantity.toLocaleString()}</strong>개</span>
                          {opt.sampleQuantity != null && (
                              <span className="text-primary">샘플 <strong>{opt.sampleQuantity.toLocaleString()}</strong>개</span>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* 세부 내용 + 파일 */}
          <div className="px-6 py-5 grid sm:grid-cols-2 gap-5">
            {request.detail && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">요청 상세</div>
                  <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {request.detail}
                  </div>
                </div>
            )}
            {request.refUrl && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">레퍼런스 URL</div>
                  <a
                      href={request.refUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-2 break-all"
                  >
                    {request.refUrl}
                  </a>
                </div>
            )}
            {(request.files ?? []).length > 0 && (
                <div className={request.detail || request.refUrl ? "" : "sm:col-span-2"}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    첨부 파일 ({request.files.length}건)
                  </div>
                  <div className="space-y-1.5">
                    {request.files.map((f) => (
                        <a
                            key={f.sourcingRequestFileId}
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors group/file"
                        >
                          <FileText size={13} className="text-primary flex-shrink-0" />
                          <span className="text-xs text-foreground flex-1 truncate">{f.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                      {f.fileType === "WORK_FILE" ? "작업지시서" : "참고이미지"}
                    </span>
                          <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">다운로드</span>
                        </a>
                    ))}
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* ── 견적 목록 ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground">접수된 견적</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${(request.bids ?? []).length > 0 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
              {(request.bids ?? []).length}개사 · {quotedBids.length}건 제출
            </span>
            </div>
          </div>

          {(request.bids ?? []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-white border border-border rounded-xl">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-medium mb-1">아직 접수된 견적이 없습니다</div>
                <div className="text-sm">공급사들이 견적을 제출하면 이곳에 표시됩니다.</div>
                {request.status === "PENDING" && (
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                      <AlertTriangle size={11} /> 견적 수신까지 시간이 걸릴 수 있습니다
                    </div>
                )}
              </div>
          ) : (
              <div className="space-y-3">
                {request.bids.map((bid) => (
                    <SupplierCard
                        key={bid.sourcingSupplierId}
                        bid={bid}
                        request={request}
                        onSelectBid={setSelectedBid}
                        onNavigateNegotiation={() => navigate("/negotiations", {
                          state: { supplierId: bid.sellerCompanyId, requestId: request.sourcingRequestId },
                        })}
                    />
                ))}
              </div>
          )}
        </div>

        {/* 견적 상세 모달 */}
        {selectedBid && (
            <BidDetailModal
                request={request}
                bid={selectedBid}
                onClose={() => setSelectedBid(null)}
                onNavigateNegotiation={() => {
                  setSelectedBid(null);
                  navigate("/negotiations", {
                    state: { supplierId: selectedBid.sellerCompanyId, requestId: request.sourcingRequestId },
                  });
                }}
            />
        )}

        {/* 취소 확인 모달 */}
        {showWithdraw && (
            <WithdrawConfirmModal
                onClose={() => setShowWithdraw(false)}
                onConfirm={handleWithdraw}
                isLoading={withdrawing}
            />
        )}
      </div>
  );
}
