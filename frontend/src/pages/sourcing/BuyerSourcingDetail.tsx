import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import api from "@/api/axios";
import {
  ArrowLeft, Package, FileText, FlaskConical,
  CreditCard, ChevronRight, Loader2, Ban, XCircle,
} from "lucide-react";
import { SourcingStatusStepper } from "./SourcingStatusStepper";

const SOURCING_LIST_PATH = "/buyer/my-sourcing";
const QUOTE_MANAGEMENT_PATH = "/buyer/quotes";

// ── 타입 ────────────────────────────────────────────────────────────────────
// 견적 승인/거절/협의/샘플결제 등 견적 관련 조회·액션은 전부 견적관리(/buyer/quotes)에서 처리하므로
// 이 페이지는 소싱 요청 자체의 정보(품목, 옵션, 첨부파일, 취소)만 다룬다.
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN" | "EXPIRED";

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

// 취소는 PENDING 단계에서만 가능 - 견적(QUOTED)이 하나라도 접수된 이후에는
// 셀러가 이미 시간을 들여 제출한 견적을 보호하기 위해 취소를 막음.
// canWithdraw가 false인데 아직 종료 상태가 아닌 경우에만 사유를 안내.
function getWithdrawUnavailableReason(status: RequestStatus): string | null {
  if (status === "QUOTED") {
    return "이미 견적을 제출한 공급사가 있어 취소할 수 없습니다.";
  }
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
              <XCircle size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-foreground">
              소싱 요청을 취소하면 배정된 공급사에게 더 이상 요청이 노출되지 않습니다.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              취소는 견적을 받은 후에는 불가능합니다. 지금 취소하지 않으면 이후 견적이 접수될 경우 더 이상 취소할 수 없습니다.
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

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export function BuyerSourcingDetail() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();

  const [request, setRequest] = useState<SourcingRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

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

  const goToQuoteManagement = () => {
    navigate(`${QUOTE_MANAGEMENT_PATH}?sourcingRequestId=${request.sourcingRequestId}`);
  };

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
              <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                      onClick={goToQuoteManagement}
                      className="flex items-center gap-1 px-3 py-2 border border-border text-muted-foreground hover:border-primary hover:text-primary rounded-lg text-xs font-medium transition-colors"
                  >
                    견적 보기 <ChevronRight size={12} />
                  </button>
                  {request.canWithdraw && (
                      <button
                          onClick={() => setShowWithdraw(true)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Ban size={12} /> 취소
                      </button>
                  )}
                </div>
                {request.canWithdraw ? (
                    <span className="text-[11px] text-muted-foreground text-right max-w-[220px] leading-snug">
                      취소는 견적을 받은 후에는 불가능합니다.
                    </span>
                ) : (
                    getWithdrawUnavailableReason(request.status) && (
                        <span className="text-[11px] text-muted-foreground text-right max-w-[220px] leading-snug">
                          {getWithdrawUnavailableReason(request.status)}
                        </span>
                    )
                )}
              </div>
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
