import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import api from "@/api/axios";
import {
  ArrowLeft, Package, FileText, FlaskConical, Clock,
  CheckCircle, XCircle, MessageSquare, CreditCard,
  ChevronRight, ChevronDown, X, BadgeCheck,
  CircleDot, AlertTriangle, Loader2, Ban,
} from "lucide-react";
import { SourcingStatusStepper } from "./SourcingStatusStepper";

const SOURCING_LIST_PATH = "/buyer/my-sourcing";

// ── 타입 ────────────────────────────────────────────────────────────────────
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN" | "EXPIRED";
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

type QuoteStatus =
    | "SUBMITTED"
    | "NEGOTIATING"
    | "SAMPLE_REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "NOT_SELECTED"
    | "EXPIRED";

const ACTIONABLE_QUOTE_STATUSES: QuoteStatus[] = ["SUBMITTED", "NEGOTIATING", "SAMPLE_REQUESTED"];

function isActionable(bid: BidDetail): boolean {
  return bid.canManage === true
      && bid.quoteStatus != null
      && ACTIONABLE_QUOTE_STATUSES.includes(bid.quoteStatus);
}

const QUOTE_STATUS_DONE_LABEL: Partial<Record<QuoteStatus, string>> = {
  APPROVED:     "승인 완료",
  REJECTED:     "거절됨",
  NOT_SELECTED: "미채택",
  EXPIRED:      "기간 만료",
};

export interface BidDetail {
  sourcingSupplierId: number;
  sellerCompanyId: number;
  companyName?: string;
  status: BidStatus;
  submittedAt?: string;
  quoteId?: number;
  quoteStatus?: QuoteStatus;
  totalAmount?: number;
  canManage?: boolean;
}

export interface SourcingRequestDetail {
  sourcingRequestId: number;
  sourcingNo: string;
  type: "READY" | "CUSTOM";
  status: RequestStatus;
  productName: string;
  brandName?: string;
  categoryId?: number;
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
  canWithdraw: boolean;
}

// ── 상태 스타일 ──────────────────────────────────────────────────────────────
const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING:     "대기중",
  QUOTED:      "견적수신",
  TRADING:     "거래중",
  NEGOTIATING: "협의중",
  CANCELLED:   "반려됨",
  COMPLETED:   "완료",
  WITHDRAWN:   "취소함",
  EXPIRED:     "기한만료",
};

const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING:     "bg-secondary text-muted-foreground border-border",
  QUOTED:      "bg-blue-50 text-blue-600 border-blue-200",
  TRADING:     "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATING: "bg-purple-50 text-purple-600 border-purple-200",
  CANCELLED:   "bg-red-50 text-red-500 border-red-200",
  COMPLETED:   "bg-green-50 text-green-600 border-green-200",
  WITHDRAWN:   "bg-secondary text-muted-foreground border-border",
  EXPIRED:     "bg-secondary text-muted-foreground border-border",
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

// 취소는 PENDING/QUOTED 단계에서만 가능 - 협의(NEGOTIATING) 시작 이후엔
// 셀러 쪽도 이미 대응을 진행 중일 수 있어 일방적인 취소를 막음.
// canWithdraw가 false인데 아직 종료 상태가 아닌 경우에만 사유를 안내.
function getWithdrawUnavailableReason(status: RequestStatus): string | null {
  if (status === "NEGOTIATING") {
    return "협의가 시작된 이후에는 요청을 취소할 수 없습니다.";
  }
  if (status === "TRADING") {
    return "거래가 진행중인 요청은 취소할 수 없습니다.";
  }
  return null;
}

// ── API ──────────────────────────────────────────────────────────────────────
async function fetchSourcingDetail(requestId: string): Promise<SourcingRequestDetail> {
  return api.get<SourcingRequestDetail>(`/sourcing/requests/${requestId}`);
}

async function withdrawSourcingRequest(sourcingRequestId: number): Promise<void> {
  await api.patch(`/sourcing/buyer/requests/${sourcingRequestId}/withdraw`);
}

type QuoteActionStatus = "APPROVED" | "REJECTED" | "NEGOTIATING" | "SAMPLE_REQUESTED";

async function updateQuoteStatus(quoteId: number, status: QuoteActionStatus): Promise<void> {
  await api.patch(`/quotes/${quoteId}/status`, { status });
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
              <button onClick={onClose}
                      className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">
                닫기
              </button>
              <button onClick={onConfirm} disabled={isLoading}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5">
                <Ban size={14} /> {isLoading ? "처리 중..." : "취소하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

// ── 견적 액션(승인/거절/샘플결제) 확인 모달 ─────────────────────────────────
interface PendingQuoteAction {
  quoteId: number;
  status: QuoteActionStatus;
  companyName: string;
}

const QUOTE_ACTION_META: Record<
    QuoteActionStatus,
    { title: string; icon: React.ReactNode; tone: string; confirmLabel: string; description: (companyName: string) => string }
> = {
  APPROVED: {
    title: "견적 승인",
    icon: <CheckCircle size={16} className="text-green-600" />,
    tone: "bg-green-500 hover:bg-green-600",
    confirmLabel: "승인하기",
    description: (companyName) =>
        `${companyName}의 견적을 승인하면 같은 소싱 요청에 접수된 다른 견적은 모두 자동으로 거절 처리됩니다. 이 작업은 되돌릴 수 없습니다.`,
  },
  REJECTED: {
    title: "견적 거절",
    icon: <XCircle size={16} className="text-red-500" />,
    tone: "bg-red-500 hover:bg-red-600",
    confirmLabel: "거절하기",
    description: (companyName) =>
        `${companyName}의 견적을 거절합니다. 거절 후에는 되돌릴 수 없습니다.`,
  },
  SAMPLE_REQUESTED: {
    title: "샘플 결제",
    icon: <FlaskConical size={16} className="text-amber-600" />,
    tone: "bg-amber-500 hover:bg-amber-600",
    confirmLabel: "결제 페이지로 이동",
    description: (companyName) =>
        `${companyName}의 견적으로 샘플 결제를 진행합니다. 결제 페이지로 이동합니다.`,
  },
  NEGOTIATING: {
    title: "협의 요청",
    icon: <MessageSquare size={16} className="text-purple-600" />,
    tone: "bg-purple-500 hover:bg-purple-600",
    confirmLabel: "계속하기",
    description: (companyName) => `${companyName}와 협의를 진행합니다.`,
  },
};

function QuoteActionConfirmModal({ action, onClose, onConfirm, isLoading }: {
  action: PendingQuoteAction;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const meta = QUOTE_ACTION_META[action.status];

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              {meta.icon}
              <h3 className="font-bold text-foreground">{meta.title}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              {meta.description(action.companyName)}
            </p>
            <p className="text-xs text-muted-foreground">정말 진행하시겠습니까?</p>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                      className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">
                취소
              </button>
              <button onClick={onConfirm} disabled={isLoading}
                      className={`flex-1 py-2.5 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5 ${meta.tone}`}>
                {isLoading ? "처리 중..." : meta.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

// ── 공급사 카드 ───────────────────────────────────────────────────────────────
function SupplierCard({
                        bid,
                        anonymousLabel,
                        request,
                        onNavigateNegotiation,
                        onRequestAction,
                        actionLoading,
                        onViewDetail,
                      }: {
  bid: BidDetail;
  anonymousLabel: string;
  request: SourcingRequestDetail;
  onNavigateNegotiation: () => void;
  onRequestAction: (quoteId: number, status: QuoteActionStatus, companyName: string) => void;
  actionLoading: boolean;
  onViewDetail: () => void;
}) {
  const budgetDiff = request.totalBudget && bid.totalAmount != null
      ? request.totalBudget - bid.totalAmount
      : null;
  const displayName = bid.companyName ?? anonymousLabel;

  // 아직 견적서가 없는 배정 공급사
  if (bid.quoteId == null) {
    const noQuoteInfo: Record<BidStatus, { label: string; icon: React.ReactNode; tone: string; desc: string }> = {
      SUGGESTED:   { label: "견적 준비중", icon: <Clock size={11} />,   tone: "bg-secondary text-muted-foreground border-border", desc: "아직 견적서가 도착하지 않았습니다" },
      RECOMMENDED: { label: "견적 준비중", icon: <Clock size={11} />,   tone: "bg-secondary text-muted-foreground border-border", desc: "아직 견적서가 도착하지 않았습니다" },
      QUOTED:      { label: "견적 준비중", icon: <Clock size={11} />,   tone: "bg-secondary text-muted-foreground border-border", desc: "아직 견적서가 도착하지 않았습니다" },
      DECLINED:    { label: "거절함",     icon: <XCircle size={11} />, tone: "bg-red-50 text-red-500 border-red-200",             desc: "공급사가 요청을 거절했습니다" },
      EXPIRED:     { label: "기간 만료",  icon: <Clock size={11} />,   tone: "bg-secondary text-muted-foreground border-border", desc: "응답 기간이 만료되었습니다" },
    };
    const info = noQuoteInfo[bid.status];

    return (
        <div className="bg-secondary/40 border border-dashed border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-muted-foreground">{displayName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${info.tone}`}>
                  {info.icon} {info.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{info.desc}</div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-foreground">{displayName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${BID_STATUS_STYLE[bid.status]}`}>
                {BID_STATUS_ICON[bid.status]} {BID_STATUS_LABEL[bid.status]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {bid.totalAmount != null && `${(bid.totalAmount / 10000).toLocaleString()}만원`}
              {budgetDiff !== null && (
                  <span className={`ml-1.5 font-semibold ${budgetDiff >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ({budgetDiff >= 0
                      ? `▼ ${(budgetDiff / 10000).toLocaleString()}만`
                      : `▲ ${(Math.abs(budgetDiff) / 10000).toLocaleString()}만`})
                  </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {isActionable(bid) ? (
                <>
                  <button
                      onClick={() => bid.quoteId && onRequestAction(bid.quoteId, "REJECTED", displayName)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={12} /> 거절
                  </button>
                  {request.needSample === "Y" ? (
                      <button
                          onClick={() => bid.quoteId && onRequestAction(bid.quoteId, "SAMPLE_REQUESTED", displayName)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FlaskConical size={12} /> 샘플 결제하기
                      </button>
                  ) : (
                      <button
                          onClick={() => bid.quoteId && onRequestAction(bid.quoteId, "APPROVED", displayName)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle size={12} /> 승인
                      </button>
                  )}
                  <button
                      onClick={onNavigateNegotiation}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <MessageSquare size={12} /> 협의하기
                  </button>
                </>
            ) : (
                <span className="text-xs font-semibold text-slate-400 px-1">
                  {bid.quoteStatus ? (QUOTE_STATUS_DONE_LABEL[bid.quoteStatus] ?? bid.quoteStatus) : "-"}
                </span>
            )}
            {/* 상세보기 → QuoteDetail 페이지로 이동 */}
            <button
                onClick={onViewDetail}
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
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingQuoteAction | null>(null);
  const [actionQuoteId, setActionQuoteId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showWithdrawnBids, setShowWithdrawnBids] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    fetchSourcingDetail(requestId)
        .then(setRequest)
        .catch((e) => setError(e instanceof Error ? e.message : "소싱 요청 조회에 실패했습니다."))
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

  // 실제 승인/거절/샘플결제 API 실행 (확인 모달에서 최종 확정 시 호출)
  const executeQuoteAction = async (quoteId: number, status: QuoteActionStatus) => {
    if (!requestId) return;
    setActionQuoteId(quoteId);
    setActionError(null);
    try {
      await updateQuoteStatus(quoteId, status);
      setPendingAction(null);
      if (status === "SAMPLE_REQUESTED") {
        navigate(`/checkout?type=sample&quoteId=${quoteId}`);
        return;
      }
      if (status === "APPROVED") {
        // 승인 완료 → 승인된 견적 목록 페이지로 이동
        navigate("/buyer/quotes?status=APPROVED");
        return;
      }
      const refreshed = await fetchSourcingDetail(requestId);
      setRequest(refreshed);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setActionQuoteId(null);
    }
  };

  // 버튼 클릭 시 바로 실행하지 않고 확인 모달을 먼저 띄움 (오클릭 방지)
  const requestQuoteAction = (quoteId: number, status: QuoteActionStatus, companyName: string) => {
    setPendingAction({ quoteId, status, companyName });
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
              onClick={() => navigate(SOURCING_LIST_PATH)}
              className="px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            소싱 요청 목록으로
          </button>
        </div>
    );
  }

  const totalQty = (request.items ?? []).reduce((sum, o) => sum + o.quantity, 0);
  const allBids = request.bids ?? [];
  const quotedBids = allBids.filter((b) => b.quoteId != null);
  const pendingBidsCount = allBids.length - quotedBids.length;

  const renderSupplierCard = (bid: BidDetail, index: number) => (
      <SupplierCard
          key={bid.sourcingSupplierId}
          bid={bid}
          anonymousLabel={`공급사 ${index + 1}`}
          request={request}
          onNavigateNegotiation={() => navigate("/negotiations", {
            state: { supplierId: bid.sellerCompanyId, requestId: request.sourcingRequestId },
          })}
          onRequestAction={requestQuoteAction}
          actionLoading={actionQuoteId === bid.quoteId}
          // 상세보기 클릭 → QuoteDetail 페이지로 이동 (perspective는 백엔드가 authUser.companyId 기준으로 판단)
          onViewDetail={() => bid.quoteId && navigate(`/buyer/quotes/${bid.quoteId}`)}
      />
  );

  return (
      <div className="max-w-[860px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        <button
            onClick={() => navigate(SOURCING_LIST_PATH)}
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
              {request.canWithdraw ? (
                  <button
                      onClick={() => setShowWithdraw(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Ban size={12} /> 취소
                  </button>
              ) : (
                  getWithdrawUnavailableReason(request.status) && (
                      <span className="flex-shrink-0 text-[11px] text-muted-foreground text-right max-w-[160px] leading-snug">
                        {getWithdrawUnavailableReason(request.status)}
                      </span>
                  )
              )}
            </div>
          </div>

          <div className="px-6 py-5 border-b border-border">
            <SourcingStatusStepper status={request.status} needSample={request.needSample} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
            {[
              { label: "희망 수량", value: `${totalQty.toLocaleString()}벌`, icon: <Package size={13} /> },
              {
                label: request.type === "CUSTOM" ? "전체 예산" : "희망 단가",
                value: request.type === "CUSTOM"
                    ? request.totalBudget ? `${(request.totalBudget / 10000).toLocaleString()}만원` : "—"
                    : request.unitPrice ? `${request.unitPrice.toLocaleString()}원` : "—",
                icon: <CreditCard size={13} />,
              },
              { label: "희망 납기", value: request.deliveryDate ?? "—", icon: null },
              { label: "샘플", value: request.needSample === "Y" ? "필요" : "불필요", icon: <FlaskConical size={13} />, highlight: request.needSample === "Y" },
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
                  <a href={request.refUrl} target="_blank" rel="noopener noreferrer"
                     className="text-sm text-primary underline underline-offset-2 break-all">
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
                        <a key={f.sourcingRequestFileId} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors group/file">
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${quotedBids.length > 0 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                {quotedBids.length}건
              </span>
              {pendingBidsCount > 0 && request.status !== "WITHDRAWN" && (
                  <span className="text-xs text-muted-foreground">
                    배정 {allBids.length}개사 중 {pendingBidsCount}개사 준비중
                  </span>
              )}
            </div>
          </div>

          {actionError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {actionError}
              </div>
          )}

          {request.status === "TRADING" && (
              <div className="flex items-center justify-between gap-3 mb-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <BadgeCheck size={16} className="flex-shrink-0" />
                  <span>거래가 진행중입니다. 자세한 내용은 견적관리에서 확인해 주세요.</span>
                </div>
                <button
                    onClick={() => navigate("/buyer/quotes?status=APPROVED")}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  견적관리로 이동 <ChevronRight size={12} />
                </button>
              </div>
          )}

          {request.status === "WITHDRAWN" && quotedBids.length > 0 ? (
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowWithdrawnBids((prev) => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Ban size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">
                      취소 시점에 접수된 견적 <strong>{quotedBids.length}건</strong> (모두 미채택 처리됨)
                    </span>
                  </div>
                  <ChevronDown
                      size={16}
                      className={`text-muted-foreground flex-shrink-0 transition-transform ${showWithdrawnBids ? "rotate-180" : ""}`}
                  />
                </button>
                {showWithdrawnBids && (
                    <div className="border-t border-border px-5 py-4 space-y-3 bg-secondary/30">
                      {quotedBids.map((bid, index) => renderSupplierCard(bid, index))}
                    </div>
                )}
              </div>
          ) : allBids.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-white border border-border rounded-xl">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-medium mb-1">아직 배정된 공급사가 없습니다</div>
                <div className="text-sm">공급사가 배정되면 이곳에 표시됩니다.</div>
                {request.status === "PENDING" && (
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                      <AlertTriangle size={11} /> 공급사 배정까지 시간이 걸릴 수 있습니다
                    </div>
                )}
              </div>
          ) : (
              <div className="space-y-3">
                {allBids.map((bid, index) => renderSupplierCard(bid, index))}
              </div>
          )}
        </div>

        {showWithdraw && (
            <WithdrawConfirmModal
                onClose={() => setShowWithdraw(false)}
                onConfirm={handleWithdraw}
                isLoading={withdrawing}
            />
        )}

        {pendingAction && (
            <QuoteActionConfirmModal
                action={pendingAction}
                onClose={() => setPendingAction(null)}
                onConfirm={() => executeQuoteAction(pendingAction.quoteId, pendingAction.status)}
                isLoading={actionQuoteId === pendingAction.quoteId}
            />
        )}
      </div>
  );
}
