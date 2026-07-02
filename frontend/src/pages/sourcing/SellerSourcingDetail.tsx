import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
    ArrowLeft, Package, FileText, FlaskConical, Clock,
    CheckCircle, XCircle, CreditCard,
    Send, Loader2, AlertTriangle, X, Ban,
} from "lucide-react";
import api from "@/api/axios";
import { SourcingStatusStepper } from "./SourcingStatusStepper";

// ── 타입 (백엔드 SourcingRequestSellerDetailResponse, snake_case 기준) ──
// 이 페이지는 "거절 또는 견적 제출"만 결정하는 곳이라 견적 상세(quote_id 등)는 다루지 않음.
// 제출 이후 견적 확인/협의는 전부 견적 관리(SellerQuoteList) 쪽에서 처리.
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN" | "EXPIRED";
type BidStatus = "SUGGESTED" | "RECOMMENDED" | "QUOTED" | "DECLINED" | "EXPIRED";

interface ItemDto {
    sourcing_request_item_id: number;
    option_summary: string;
    quantity: number;
    sample_quantity?: number;
}

interface FileDto {
    sourcing_request_file_id: number;
    file_type: "REF_IMAGE" | "WORK_FILE";
    file_name: string;
    file_url: string;
}

interface MyBidDto {
    sourcing_supplier_id: number;
    status: BidStatus;
    responded_at: string | null;
}

interface SourcingRequestSellerDetail {
    sourcing_request_id: number;
    sourcing_no: string;
    type: "READY" | "CUSTOM";
    status: RequestStatus;
    product_name: string;
    brand_name?: string;
    sub_category_id?: number;
    need_sample: "Y" | "N";
    main_material?: string;
    unit_price?: number;
    ref_url?: string;
    total_budget?: number;
    detail?: string;
    delivery_date?: string;
    expiry_date?: string;
    created_at: string;
    items: ItemDto[];
    files: FileDto[];
    my_bid: MyBidDto;
}

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

// ── API (인증은 @LoginUser로 백엔드에서 세션/쿠키 기반 처리, companyId 별도 전달 불필요) ──
const BASE_URL = "/sourcing/seller";

async function fetchSellerSourcingDetail(requestId: string): Promise<SourcingRequestSellerDetail> {
    return api.get<SourcingRequestSellerDetail>(`${BASE_URL}/requests/${requestId}`);
}

async function declineBid(sourcingSupplierId: number, feedback: string): Promise<void> {
    await api.patch(`${BASE_URL}/suppliers/${sourcingSupplierId}/decline`, { feedback });
}

// ── 거절 사유 입력 모달 ──────────────────────────────────────────────────
function DeclineModal({ onClose, onConfirm, isLoading }: {
    onClose: () => void;
    onConfirm: (feedback: string) => void;
    isLoading: boolean;
}) {
    const [feedback, setFeedback] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[380px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Ban size={16} className="text-red-500" />
                        <h3 className="font-bold text-foreground">소싱 요청 거절</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        거절 사유 <span className="text-muted-foreground font-normal text-xs">(선택)</span>
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        placeholder="예: 현재 생산 일정상 대응이 어렵습니다."
                        className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
                    />
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
                        >
                            닫기
                        </button>
                        <button
                            onClick={() => onConfirm(feedback)}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Ban size={14} /> {isLoading ? "처리 중..." : "거절하기"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────
export function SellerSourcingDetail() {
    const navigate = useNavigate();
    const { requestId } = useParams<{ requestId: string }>();

    const [request, setRequest] = useState<SourcingRequestSellerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDecline, setShowDecline] = useState(false);
    const [declining, setDeclining] = useState(false);

    useEffect(() => {
        if (!requestId) return;
        setLoading(true);
        fetchSellerSourcingDetail(requestId)
            .then(setRequest)
            .catch((e) => setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다."))
            .finally(() => setLoading(false));
    }, [requestId]);

    const myBid = request?.my_bid ?? null;

    const handleDecline = async (feedback: string) => {
        if (!myBid) return;
        setDeclining(true);
        try {
            await declineBid(myBid.sourcing_supplier_id, feedback);
            setRequest((prev) =>
                prev ? { ...prev, my_bid: { ...prev.my_bid, status: "DECLINED" } } : prev
            );
            setShowDecline(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "거절 처리 중 오류가 발생했습니다.");
        } finally {
            setDeclining(false);
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

    return (
        <div className="max-w-[860px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
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
                                <span className="text-xs text-muted-foreground font-mono">{request.sourcing_no}</span>
                                <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded font-medium">
                  {request.type === "CUSTOM" ? "✂️ 주문제작" : "🏷️ 기성품"}
                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${REQUEST_STATUS_STYLE[request.status]}`}>
                  {REQUEST_STATUS_LABEL[request.status]}
                </span>
                                {myBid && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BID_STATUS_STYLE[myBid.status]}`}>
                      {BID_STATUS_LABEL[myBid.status]}
                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold text-foreground mb-1">{request.product_name}</h1>
                            <div className="text-xs text-muted-foreground">{request.created_at.slice(0, 10)} 등록</div>
                        </div>
                    </div>
                </div>

                {/* 진행 단계: 이미 거절/만료로 손을 뗀 셀러에게는 의미가 없으므로 숨김.
                    (다른 공급사는 계속 진행 중이라 request.status는 계속 움직이지만,
                    이 셀러 입장에서는 아래 '내 배정 상태' 배너가 최종 결과임) */}
                {(!myBid || (myBid.status !== "DECLINED" && myBid.status !== "EXPIRED")) && (
                    <div className="px-6 py-5 border-b border-border">
                        <SourcingStatusStepper status={request.status} needSample={request.need_sample} />
                    </div>
                )}

                {/* 핵심 수치 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
                    {[
                        { label: "희망 수량", value: `${totalQty.toLocaleString()}벌`, icon: <Package size={13} /> },
                        {
                            label: request.type === "CUSTOM" ? "전체 예산" : "희망 단가",
                            value: request.type === "CUSTOM"
                                ? request.total_budget ? `${(request.total_budget / 10000).toLocaleString()}만원` : "—"
                                : request.unit_price ? `${request.unit_price.toLocaleString()}원` : "—",
                            icon: <CreditCard size={13} />,
                        },
                        { label: "희망 납기", value: request.delivery_date ?? "—", icon: null },
                        {
                            label: "샘플",
                            value: request.need_sample === "Y" ? "필요" : "불필요",
                            icon: <FlaskConical size={13} />,
                            highlight: request.need_sample === "Y",
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

                {(request.items ?? []).length > 0 && (
                    <div className="px-6 py-4 border-b border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">옵션별 수량</div>
                        <div className="space-y-1.5">
                            {request.items.map((opt) => (
                                <div key={opt.sourcing_request_item_id} className="flex items-center justify-between text-sm bg-secondary rounded px-3 py-2">
                                    <span className="text-foreground">{opt.option_summary || "—"}</span>
                                    <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                        <span><strong className="text-foreground">{opt.quantity.toLocaleString()}</strong>개</span>
                                        {opt.sample_quantity != null && (
                                            <span className="text-primary">샘플 <strong>{opt.sample_quantity.toLocaleString()}</strong>개</span>
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
                    {request.ref_url && (
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">레퍼런스 URL</div>
                            <a
                                href={request.ref_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary underline underline-offset-2 break-all"
                            >
                                {request.ref_url}
                            </a>
                        </div>
                    )}
                    {(request.files ?? []).length > 0 && (
                        <div className={request.detail || request.ref_url ? "" : "sm:col-span-2"}>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                첨부 파일 ({request.files.length}건)
                            </div>
                            <div className="space-y-1.5">
                                {request.files.map((f) => (
                                    <a
                                        key={f.sourcing_request_file_id}
                                        href={f.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors group/file"
                                    >
                                        <FileText size={13} className="text-primary flex-shrink-0" />
                                        <span className="text-xs text-foreground flex-1 truncate">{f.file_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {f.file_type === "WORK_FILE" ? "작업지시서" : "참고이미지"}
                                        </span>
                                        <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">다운로드</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 내 배정 상태 및 액션 ──
                이 페이지의 역할은 "거절 또는 견적 제출" 결정까지만.
                일단 견적을 제출한 뒤부터는 견적 상세/협의는 견적 관리 페이지에서 다룸. */}
            <div className="bg-white border border-border rounded-xl overflow-hidden px-6 py-5">
                <h2 className="font-bold text-foreground mb-4">내 배정 상태</h2>

                {!myBid ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <div className="text-3xl mb-3">📭</div>
                        <div className="font-medium">이 소싱 요청에 배정되어 있지 않습니다</div>
                    </div>
                ) : myBid.status === "DECLINED" ? (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <XCircle size={16} />
                        거절 처리한 요청입니다
                        {myBid.responded_at && ` (${myBid.responded_at.slice(0, 10)})`}
                    </div>
                ) : myBid.status === "EXPIRED" ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary border border-border rounded-lg px-4 py-3">
                        <Clock size={16} /> 응답 기한이 만료되었습니다.
                    </div>
                ) : myBid.status === "QUOTED" ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <CheckCircle size={16} />
                        견적을 제출했습니다{myBid.responded_at && ` (${myBid.responded_at.slice(0, 10)})`}. 이후 진행 상황은 견적 관리에서 확인할 수 있습니다.
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowDecline(true)}
                            className="flex-1 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                            <XCircle size={14} /> 거절
                        </button>
                        <button
                            // TODO: 실제 견적 작성 페이지 경로 확인 필요
                            onClick={() => navigate(`/seller/quotes/new/${request.sourcing_request_id}`)}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Send size={14} /> 견적 제출
                        </button>
                    </div>
                )}

                {myBid && (myBid.status === "SUGGESTED" || myBid.status === "RECOMMENDED") && (
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                        <AlertTriangle size={11} /> 응답 기한 내에 견적 제출 또는 거절이 필요합니다
                    </div>
                )}
            </div>

            {showDecline && (
                <DeclineModal
                    onClose={() => setShowDecline(false)}
                    onConfirm={handleDecline}
                    isLoading={declining}
                />
            )}
        </div>
    );
}
