import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Package, X, Zap, AlertTriangle, Calendar,
  Search, Filter, FileText, FlaskConical, Truck,
  CheckCircle, History, ChevronRight, ChevronDown, Plus,
  CreditCard, BadgeCheck, XCircle,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
type SourcingType = "READY" | "CUSTOM";
type SupplierStatus = "RECOMMENDED" | "QUOTED" | "DECLINED" | "EXPIRED";
type SourcingStatus = "PENDING" | "NEGOTIATING" | "TRADING" | "COMPLETED";

interface SellerSourcingResponse {
  sourcingSupplierId: number;
  sourcingRequestId: number;
  sourcingNo: string;
  type: SourcingType;
  productName: string;
  brandName: string | null;
  subCategoryId: number | null;
  needSample: "Y" | "N";
  mainMaterial: string | null;
  unitPrice: number | null;
  totalBudget: number | null;
  deliveryDate: string;
  expiryDate: string | null;
  detail: string | null;
  supplierStatus: SupplierStatus;
  sourcingStatus: SourcingStatus;
  myQuote: QuoteSummary | null;
}

type BidSubmitStatus = "제출됨" | "샘플결제됨" | "샘플출고완료" | "승인" | "거절";

interface MyBid {
  bidId: string; quoteId: number; requestId: number; type: SourcingType;
  unitPrice?: string; totalBudget?: string; samplePrice?: string;
  availableDate?: string; expiryDate?: string;
  quoteFile?: File | null; comment?: string;
  status: BidSubmitStatus; submittedAt: string; trackingNumber?: string;
}

// 셀러용 소싱 요청 상세 (백엔드 SourcingRequestSellerDetailResponse, snake_case)
interface SellerSourcingDetailItem {
  sourcing_request_item_id: number;
  option_summary: string;
  quantity: number;
  sample_quantity?: number;
}

interface SellerSourcingDetailFile {
  sourcing_request_file_id: number;
  file_type: "REF_IMAGE" | "WORK_FILE";
  file_name: string;
  file_url: string;
}

interface SellerSourcingRequestDetail {
  sourcing_request_id: number;
  sourcing_no: string;
  type: SourcingType;
  status: string;
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
  items: SellerSourcingDetailItem[];
  files: SellerSourcingDetailFile[];
}

// ── API ───────────────────────────────────────────────────────────────
const BASE_URL = "/api/sourcing/seller";

async function fetchSellerRequests(type: SourcingType, status: SupplierStatus): Promise<SellerSourcingResponse[]> {
  const res = await fetch(`${BASE_URL}/requests?type=${type}&status=${status}`);
  if (!res.ok) throw new Error("목록 조회 실패");
  return res.json();
}

async function fetchSellerPastRequests(type: SourcingType): Promise<SellerSourcingResponse[]> {
  const res = await fetch(`${BASE_URL}/requests/past?type=${type}`);
  if (!res.ok) throw new Error("이전 요청 조회 실패");
  return res.json();
}

async function fetchSellerSourcingDetail(sourcingRequestId: number): Promise<SellerSourcingRequestDetail> {
  const res = await fetch(`${BASE_URL}/requests/${sourcingRequestId}`, { credentials: "include" });
  if (!res.ok) throw new Error("상세 조회 실패");
  return res.json();
}

// 셀러 본인이 제출한 견적 요약 (SellerSourcingResponse.myQuote로 함께 내려옴)
interface QuoteSummary {
  quoteId: number;
  quoteNo: string;
  unitPrice: number | null;
  totalAmount: number;
  leadTimeDays: number;
  validUntil: string | null;
  status: string;
  submittedAt: string | null;
}

const QUOTE_STATUS_TO_BID_STATUS: Record<string, BidSubmitStatus> = {
  SUBMITTED: "제출됨",
  SAMPLE_REQUESTED: "샘플결제됨",
  APPROVED: "승인",
  REJECTED: "거절",
  NEGOTIATING: "제출됨",
  EXPIRED: "거절",
};

function toMyBid(q: QuoteSummary, requestId: number, type: SourcingType): MyBid {
  return {
    bidId: q.quoteNo,
    quoteId: q.quoteId,
    requestId,
    type,
    unitPrice: q.unitPrice != null ? String(q.unitPrice) : undefined,
    totalBudget: q.totalAmount != null ? String(q.totalAmount) : undefined,
    availableDate: q.validUntil?.slice(0, 10),
    expiryDate: q.validUntil?.slice(0, 10),
    status: QUOTE_STATUS_TO_BID_STATUS[q.status] ?? "제출됨",
    submittedAt: q.submittedAt?.slice(0, 10) ?? "",
  };
}

async function declineRequest(sourcingSupplierId: number, feedback: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/suppliers/${sourcingSupplierId}/decline`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error("거절 처리 실패");
}

// ── 유틸 ──────────────────────────────────────────────────────────────
const BID_STATUS_STYLE: Record<BidSubmitStatus, string> = {
  "제출됨":       "bg-blue-50 text-blue-600 border-blue-200",
  "샘플결제됨":   "bg-amber-50 text-amber-600 border-amber-200",
  "샘플출고완료": "bg-teal-50 text-teal-600 border-teal-200",
  "승인":         "bg-green-50 text-green-600 border-green-200",
  "거절":         "bg-red-50 text-red-500 border-red-200",
};

const SOURCING_STATUS_LABEL: Record<SourcingStatus, string> = {
  PENDING:     "견적검토중",
  NEGOTIATING: "협의중",
  TRADING:     "거래중",
  COMPLETED:   "완료",
};

const SOURCING_STATUS_STYLE: Record<SourcingStatus, string> = {
  PENDING:     "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATING: "bg-purple-50 text-purple-600 border-purple-200",
  TRADING:     "bg-green-50 text-green-600 border-green-200",
  COMPLETED:   "bg-secondary text-muted-foreground border-border",
};

function getDday(dateStr: string): { label: string; level: "urgent" | "soon" | "normal" | "past" } {
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
  if (diff < 0) return { label: "마감", level: "past" };
  if (diff <= 0) return { label: "당일", level: "urgent" };
  if (diff === 1) return { label: "D-1", level: "urgent" };
  if (diff <= 3) return { label: `D-${diff}`, level: "soon" };
  return { label: `D-${diff}`, level: "normal" };
}
const ddayColorCls = {
  urgent: "bg-red-50 text-red-600 border-red-200",
  soon:   "bg-orange-50 text-orange-600 border-orange-200",
  normal: "bg-secondary text-muted-foreground border-border",
  past:   "bg-secondary text-muted-foreground border-border",
};

const READY_CATEGORIES = ["전체", "상의", "하의", "원피스/세트", "아우터", "액세서리"];
const CUSTOM_CATEGORIES = ["전체", "상의", "하의", "아우터", "스포츠/애슬레저", "OEM/자체제작"];

// ── 거절 모달 ─────────────────────────────────────────────────────────
function DeclineModal({ req, onClose, onConfirm }: {
  req: SellerSourcingResponse;
  onClose: () => void;
  onConfirm: (sourcingSupplierId: number, feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const canConfirm = feedback.trim().length > 0;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(req.sourcingSupplierId, feedback.trim());
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!done ? onClose : undefined} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <h3 className="font-bold text-foreground">소싱 요청 거절</h3>
            </div>
            {!done && <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>}
          </div>

          {done ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={22} className="text-red-500" />
                </div>
                <div className="font-bold text-foreground mb-1">거절 처리 완료</div>
                <div className="text-sm text-muted-foreground mb-6">관리자에게 거절 사유가 전달됩니다.</div>
                <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
              </div>
          ) : (
              <div className="px-6 py-5 space-y-4">
                <div className="bg-secondary rounded-lg px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-0.5 font-mono">{req.sourcingNo}</div>
                  <div className="font-semibold text-sm text-foreground">{req.productName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    거절 사유 <span className="text-primary">*</span>
                  </label>
                  <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      placeholder="예: 현재 생산 일정이 맞지 않아 거절합니다."
                      className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-red-400 transition-colors bg-white resize-none"
                      autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">거절 사유는 관리자에게 전달됩니다.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">취소</button>
                  <button
                      onClick={handleConfirm}
                      disabled={!canConfirm || isLoading}
                      className={`flex-1 py-2.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${canConfirm && !isLoading ? "bg-red-500 hover:bg-red-600 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                  >
                    <XCircle size={14} /> {isLoading ? "처리 중..." : "거절하기"}
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

// ── 소싱 요청 상세 모달 (셀러용) ─────────────────────────────────────
// 리스트 응답(req)에는 옵션/첨부파일 정보가 없어서, 모달이 열릴 때
// /api/sourcing/seller/requests/{id} 상세 API를 따로 호출해서 채운다.
function SellerSourcingDetailModal({ req, onClose }: { req: SellerSourcingResponse; onClose: () => void }) {
  const navigate = useNavigate();
  const isCustom = req.type === "CUSTOM";

  const [detail, setDetail] = useState<SellerSourcingRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    fetchSellerSourcingDetail(req.sourcingRequestId)
        .then((data) => { if (!cancelled) setDetail(data); })
        .catch((e) => { if (!cancelled) setDetailError(e.message); })
        .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [req.sourcingRequestId]);

  const totalQty = detail?.items?.length
      ? detail.items.reduce((sum, o) => sum + o.quantity, 0)
      : null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">{req.sourcingNo}</span>
                <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded font-medium">
                {isCustom ? "✂️ 주문제작" : "🏷️ 기성품"}
              </span>
              </div>
              <h3 className="font-bold text-foreground">{req.productName}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            <div className={`grid divide-x divide-border border border-border rounded-lg overflow-hidden ${isCustom ? "grid-cols-4" : "grid-cols-3"}`}>
              {[
                {
                  label: "희망 수량",
                  value: detailLoading ? "..." : totalQty != null ? `${totalQty.toLocaleString()}벌` : "미제공",
                  icon: <Package size={12} />,
                },
                {
                  label: isCustom ? "전체 예산" : "희망 단가",
                  value: isCustom
                      ? req.totalBudget ? `${(req.totalBudget / 10000).toLocaleString()}만원` : "-"
                      : req.unitPrice ? `${req.unitPrice.toLocaleString()}원` : "-",
                  icon: <CreditCard size={12} />,
                },
                { label: "희망 납기", value: req.deliveryDate, icon: <Calendar size={12} /> },
                ...(isCustom ? [{ label: "샘플", value: req.needSample === "Y" ? "필요" : "불필요", icon: <FlaskConical size={12} />, highlight: req.needSample === "Y" }] : []),
              ].map(({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) => (
                  <div key={label} className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">{icon} {label}</div>
                    <div className={`font-bold text-sm ${highlight ? "text-amber-600" : "text-foreground"}`}>{value}</div>
                  </div>
              ))}
            </div>

            {detailLoading && (
                <div className="text-center py-6 text-sm text-muted-foreground">상세 정보를 불러오는 중...</div>
            )}

            {detailError && (
                <div className="text-center py-6 text-sm text-red-500">상세 정보를 불러오지 못했습니다. ({detailError})</div>
            )}

            {!detailLoading && !detailError && detail?.items?.length ? (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">옵션별 수량</div>
                  <div className="space-y-1.5">
                    {detail.items.map((opt) => (
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
            ) : null}

            {(req.detail || detail?.detail) && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">바이어 요구사항</div>
                  <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {detail?.detail ?? req.detail}
                  </div>
                </div>
            )}

            {!detailLoading && !detailError && detail?.files?.length ? (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    첨부 파일 ({detail.files.length}건)
                  </div>
                  <div className="space-y-1.5">
                    {detail.files.map((f) => (
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
            ) : null}
          </div>

          <div className="px-6 py-4 border-t border-border flex gap-2 flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">닫기</button>
            <button
                onClick={() => { onClose(); navigate(`/seller/sourcing/${req.sourcingRequestId}/quote`, { state: { request: req } }); }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={14} /> 견적 제출하기
            </button>
          </div>
        </div>
      </div>
  );
}

// ── 출고 모달 ─────────────────────────────────────────────────────────
function ShipmentModal({ bid, requestName, onClose, onConfirm }: {
  bid: MyBid; requestName: string;
  onClose: () => void;
  onConfirm: (requestId: number, bidId: string, trackingNumber: string) => void;
}) {
  const [done, setDone] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const canConfirm = trackingNumber.trim().length > 0;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!done ? onClose : undefined} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2"><Truck size={16} className="text-teal-500" /><h3 className="font-bold text-foreground">샘플 출고 처리</h3></div>
            {!done && <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>}
          </div>
          {done ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={22} className="text-teal-500" /></div>
                <div className="font-bold text-foreground mb-1">출고 완료!</div>
                <div className="text-sm text-muted-foreground mb-6">운송장 번호: <span className="font-mono font-semibold text-foreground">{trackingNumber}</span></div>
                <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
              </div>
          ) : (
              <div className="px-6 py-5 space-y-4">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">상품명</span>
                    <span className="font-semibold text-foreground truncate ml-4">{requestName}</span>
                  </div>
                  {bid.samplePrice && (
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">샘플비</span>
                        <span className="font-semibold text-foreground">{Number(bid.samplePrice).toLocaleString()}원</span>
                      </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">운송장 번호 <span className="text-primary">*</span></label>
                  <input
                      type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="예: 1234567890123"
                      className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition-colors bg-white font-mono tracking-wider"
                      autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">취소</button>
                  <button
                      onClick={() => { onConfirm(bid.requestId, bid.bidId, trackingNumber.trim()); setDone(true); }}
                      disabled={!canConfirm}
                      className={`flex-1 py-2.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${canConfirm ? "bg-teal-500 hover:bg-teal-600 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                  >
                    <Truck size={14} /> 출고 완료
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

// ── 견적 상세 모달 ────────────────────────────────────────────────────
function BidDetailModal({ bid, requestName, onClose, onShip }: {
  bid: MyBid; requestName: string;
  onClose: () => void;
  onShip?: (bid: MyBid) => void;
}) {
  const inputCls = "w-full border border-border rounded px-3 py-2 text-sm bg-secondary text-foreground";
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">{bid.bidId}</div>
              <h3 className="font-bold text-foreground">{requestName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">제시 총금액</label>
                <div className={inputCls}>{(Number(bid.totalBudget) / 10000).toLocaleString()}만원</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">납품 가능일</label>
                <div className={inputCls}>{bid.availableDate}</div>
              </div>
              {bid.samplePrice && (
                  <div>
                    <label className="block text-xs font-medium text-amber-600 mb-1">샘플비</label>
                    <div className="w-full border border-amber-200 rounded px-3 py-2 text-sm bg-amber-50 text-amber-700">{Number(bid.samplePrice).toLocaleString()}원</div>
                  </div>
              )}
              {bid.expiryDate && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">견적 유효기간</label>
                    <div className={inputCls}>{bid.expiryDate}</div>
                  </div>
              )}
            </div>
            {bid.comment && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">메모</label>
                  <div className="bg-secondary rounded px-3 py-2.5 text-sm text-foreground leading-relaxed">{bid.comment}</div>
                </div>
            )}
            {bid.trackingNumber && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                  <div className="text-xs text-teal-600 font-medium mb-0.5">등록된 운송장 번호</div>
                  <div className="font-mono font-bold text-teal-700">{bid.trackingNumber}</div>
                </div>
            )}
            {bid.status === "샘플결제됨" && onShip && (
                <button onClick={() => { onClose(); onShip(bid); }} className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <Truck size={14} /> 샘플 출고 처리
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

// ── 요청 행 ──────────────────────────────────────────────────────────
function RequestRow({ req, myBids, onDecline, onViewBid, onShip, onDetail }: {
  req: SellerSourcingResponse; myBids: MyBid[];
  onDecline: (r: SellerSourcingResponse) => void;
  onViewBid: (bid: MyBid) => void;
  onShip?: (bid: MyBid) => void;
  onDetail: (r: SellerSourcingResponse) => void;
}) {
  const navigate = useNavigate();
  const isCustom = req.type === "CUSTOM";
  const dday = getDday(req.deliveryDate);
  const [expanded, setExpanded] = useState(myBids.length > 0);
  const latestBid = myBids[0];
  const hasSamplePaid = myBids.some((b) => b.status === "샘플결제됨");
  // 견적은 READY/CUSTOM 모두 totalAmount(총액) 기준으로 제출됨 — unitPrice는 사용하지 않음
  const bidSummary = (bid: MyBid) =>
      `${(Number(bid.totalBudget) / 10000).toLocaleString()}만원`;

  return (
      <div className="bg-white border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{req.sourcingNo}</span>
              <span className={`flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 font-semibold ${ddayColorCls[dday.level]}`}>
                {dday.level === "urgent" ? <Zap size={10} /> : dday.level === "soon" ? <AlertTriangle size={10} /> : <Calendar size={10} />} {dday.label}
              </span>
              {!isCustom && latestBid && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${BID_STATUS_STYLE[latestBid.status]}`}>{latestBid.status}</span>}
              {isCustom && hasSamplePaid && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><FlaskConical size={9} /> 샘플결제됨</span>}
              {isCustom && req.supplierStatus === "QUOTED" && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${SOURCING_STATUS_STYLE[req.sourcingStatus]}`}>{SOURCING_STATUS_LABEL[req.sourcingStatus]}</span>}
            </div>
            <div className="font-semibold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors" onClick={() => onDetail(req)}>{req.productName}</div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-center flex-shrink-0">
            <div>
              <div className="font-mono font-bold text-sm text-foreground">
                {isCustom ? (req.totalBudget ? `${(req.totalBudget / 10000).toLocaleString()}만원` : "-") : (req.unitPrice ? `${req.unitPrice.toLocaleString()}원` : "-")}
              </div>
              <div className="text-[10px] text-muted-foreground">{isCustom ? "전체예산" : "희망단가"}</div>
            </div>
            <div><div className="font-mono font-bold text-sm text-foreground">{req.deliveryDate.slice(5)}</div><div className="text-[10px] text-muted-foreground">희망납기</div></div>
            {isCustom && <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${req.needSample === "Y" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-secondary text-muted-foreground border-border"}`}>샘플 {req.needSample === "Y" ? "필요" : "불필요"}</div>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {myBids.length === 0 && (
                <>
                  <button
                      onClick={() => onDecline(req)}
                      className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded text-xs font-semibold transition-colors"
                  >
                    <XCircle size={12} /> 거절
                  </button>
                  <button
                      onClick={() => navigate(`/seller/sourcing/${req.sourcingRequestId}/quote`, { state: { request: req } })}
                      className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded text-xs font-semibold transition-colors"
                  >
                    <Zap size={12} /> 견적 제출
                  </button>
                </>
            )}
            <button
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center gap-1 px-3 py-2 border rounded text-xs font-semibold transition-colors ${myBids.length > 0 ? "border-primary text-primary hover:bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} 내 견적 {myBids.length > 0 ? `${myBids.length}건` : "없음"}
            </button>
          </div>
        </div>
        {expanded && myBids.length > 0 && (
            <div className="border-t border-border divide-y divide-border bg-secondary/20">
              {[...myBids].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((bid, idx) => (
                  <div key={bid.bidId} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{idx === 0 ? "최신" : `이전 ${myBids.length - idx}`}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{bid.submittedAt} 제출 · {bidSummary(bid)} · {bid.availableDate} 납품</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bid.status === "샘플결제됨" && onShip && (
                          <button onClick={() => onShip(bid)} className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded text-xs font-semibold transition-colors"><Truck size={11} /> 샘플 출고</button>
                      )}
                      <button onClick={() => onViewBid(bid)} className="flex items-center gap-1 px-3 py-1.5 border border-border hover:border-primary text-muted-foreground hover:text-primary rounded text-xs font-semibold transition-colors">상세보기 <ChevronRight size={11} /></button>
                    </div>
                  </div>
              ))}
            </div>
        )}
        {expanded && myBids.length === 0 && <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground bg-secondary/20">아직 제출한 견적이 없습니다.</div>}
      </div>
  );
}

// ── 이전 요청 행 ──────────────────────────────────────────────────────
function PastRow({ req }: { req: SellerSourcingResponse }) {
  return (
      <div className="bg-white border border-border rounded-lg px-5 py-4 opacity-80">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground font-mono">{req.sourcingNo}</span>
              <span className="text-[10px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full">
              {req.supplierStatus === "DECLINED" ? "거절" : "만료"}
            </span>
            </div>
            <div className="font-semibold text-sm text-foreground truncate">{req.productName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">납기 {req.deliveryDate}</div>
          </div>
        </div>
      </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export function SellerRequestList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SourcingType>("READY");
  const [subTab, setSubTab] = useState<"current" | "my" | "past">("current");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [requests, setRequests] = useState<SellerSourcingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [myBids, setMyBids] = useState<Record<number, MyBid[]>>({});
  const [declineReq, setDeclineReq] = useState<SellerSourcingResponse | null>(null);
  const [viewBid, setViewBid] = useState<{ bid: MyBid; requestName: string } | null>(null);
  const [shipBid, setShipBid] = useState<{ bid: MyBid; requestName: string } | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SellerSourcingResponse | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setRequests([]);
    try {
      let data: SellerSourcingResponse[];
      if (subTab === "current") {
        data = await fetchSellerRequests(activeTab, "RECOMMENDED");
      } else if (subTab === "my") {
        data = await fetchSellerRequests(activeTab, "QUOTED");
      } else {
        data = await fetchSellerPastRequests(activeTab);
      }
      setRequests(data);

      // 목록 응답에 포함된 myQuote로 바로 매핑 (별도 API 호출 없음)
      const entries = data
          .filter((req) => req.myQuote)
          .map((req) => [req.sourcingRequestId, [toMyBid(req.myQuote!, req.sourcingRequestId, activeTab)]] as [number, MyBid[]]);
      setMyBids(Object.fromEntries(entries));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // location.key가 바뀔 때마다 (navigate로 돌아올 때) 재조회
  useEffect(() => { loadRequests(); }, [activeTab, subTab, location.key]);

  const handleDeclineConfirm = async (sourcingSupplierId: number, feedback: string) => {
    await declineRequest(sourcingSupplierId, feedback);
    setRequests((prev) => prev.filter((r) => r.sourcingSupplierId !== sourcingSupplierId));
  };

  const handleShipConfirm = (requestId: number, bidId: string, trackingNumber: string) => {
    setMyBids((prev) => ({
      ...prev,
      [requestId]: (prev[requestId] ?? []).map((b) => b.bidId === bidId ? { ...b, status: "샘플출고완료", trackingNumber } : b),
    }));
    setShipBid(null);
  };

  const handleTabChange = (tab: SourcingType) => {
    setActiveTab(tab); setActiveCategory("전체"); setSearch(""); setUrgentOnly(false); setSubTab("current");
  };

  const categories = activeTab === "READY" ? READY_CATEGORIES : CUSTOM_CATEGORIES;

  const filtered = requests.filter((r) => {
    const matchSearch = r.productName.includes(search) || (r.detail ?? "").includes(search);
    const matchUrgent = !urgentOnly || getDday(r.deliveryDate).level === "urgent";
    return matchSearch && matchUrgent;
  });

  const urgentCount = requests.filter((r) => getDday(r.deliveryDate).level === "urgent").length;

  return (
      <div className="font-[Inter,sans-serif]">
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white py-12">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="inline-block bg-primary text-xs font-mono px-2 py-1 rounded mb-4 tracking-wider uppercase">소싱 요청 게시판</div>
            <h1 className="text-4xl font-bold mb-3">
              배정된 소싱 요청 <span className="text-accent">{requests.length}</span>건
            </h1>
            <p className="text-white/70 mb-6">
              {activeTab === "READY" ? "바이어가 올린 사입 요청서에 단가를 제시하고 거래를 성사시키세요." : "바이어의 주문제작 요청서를 확인하고 제작 견적을 제출하세요."}
            </p>
            {urgentCount > 0 && (
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
                  <Zap size={14} /> 오늘 마감 요청 {urgentCount}건
                </div>
            )}
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="flex gap-1 bg-secondary border border-border rounded-lg p-1 mb-5 w-fit">
            {(["READY", "CUSTOM"] as const).map((tab) => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                        className={`px-5 py-2 rounded text-sm font-semibold transition-colors ${activeTab === tab ? "bg-white text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab === "READY" ? "🏷️ 기성품 사입" : "✂️ 주문제작"}
                </button>
            ))}
          </div>

          <div className="flex gap-0 border-b border-border mb-6">
            {(["current", "my", "past"] as const).map((tab) => {
              const labels = { current: "전체 요청", my: "내 제안", past: "이전 요청" };
              const icons = { current: <Filter size={13} />, my: <Zap size={13} />, past: <History size={13} /> };
              const isActive = subTab === tab;
              return (
                  <button key={tab} onClick={() => setSubTab(tab)}
                          className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {icons[tab]} {labels[tab]}
                  </button>
              );
            })}
          </div>

          {subTab !== "past" && (
              <div className="bg-white border border-border rounded p-5 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center border border-border rounded px-3 py-2 gap-2 flex-1 min-w-[240px]">
                    <Search size={15} className="text-muted-foreground" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="상품명, 요구사항 검색..." className="text-sm outline-none flex-1" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                    <div onClick={() => setUrgentOnly(!urgentOnly)} className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${urgentOnly ? "bg-red-500" : "bg-[#ddd]"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${urgentOnly ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <Zap size={13} className={urgentOnly ? "text-red-500" : ""} /> 마감임박만
                  </label>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                    <Filter size={12} /> {filtered.length}건
                  </div>
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {categories.map((cat) => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                              className={`px-3 py-1.5 text-xs rounded border transition-colors ${activeCategory === cat ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                      >
                        {cat}
                      </button>
                  ))}
                </div>
              </div>
          )}

          {subTab === "past" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary border border-border rounded px-4 py-3 mb-6">
                <History size={14} /> 거절하거나 만료된 요청 이력입니다.
              </div>
          )}

          {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">불러오는 중...</div>
          ) : (
              <>
                {subTab !== "past" && (
                    <div className="space-y-3">
                      {filtered.map((req) => (
                          <RequestRow
                              key={req.sourcingRequestId} req={req}
                              myBids={myBids[req.sourcingRequestId] ?? []}
                              onDecline={setDeclineReq}
                              onViewBid={(bid) => navigate(`/seller/quotes/${bid.quoteId}`)}
                              onShip={(bid) => setShipBid({ bid, requestName: req.productName })}
                              onDetail={setSelectedDetail}
                          />
                      ))}
                      {filtered.length === 0 && <div className="text-center py-20 text-muted-foreground"><div className="text-4xl mb-3">📭</div><div className="font-medium">배정된 요청이 없습니다</div></div>}
                    </div>
                )}

                {subTab === "past" && (
                    <div className="space-y-3">
                      {requests.map((req) => <PastRow key={req.sourcingRequestId} req={req} />)}
                      {requests.length === 0 && <div className="text-center py-20 text-muted-foreground"><div className="text-4xl mb-3">📭</div><div className="font-medium">이전 요청 내역이 없습니다</div></div>}
                    </div>
                )}
              </>
          )}
        </div>

        {selectedDetail && <SellerSourcingDetailModal req={selectedDetail} onClose={() => setSelectedDetail(null)} />}
        {declineReq && <DeclineModal req={declineReq} onClose={() => setDeclineReq(null)} onConfirm={handleDeclineConfirm} />}
        {viewBid && <BidDetailModal bid={viewBid.bid} requestName={viewBid.requestName} onClose={() => setViewBid(null)} onShip={(bid) => { setViewBid(null); setShipBid({ bid, requestName: viewBid.requestName }); }} />}
        {shipBid && <ShipmentModal bid={shipBid.bid} requestName={shipBid.requestName} onClose={() => setShipBid(null)} onConfirm={handleShipConfirm} />}
      </div>
  );
}
