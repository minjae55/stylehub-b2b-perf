import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import api from "@/api/axios";
import {
  X, Zap, AlertTriangle, Calendar,
  Search, Filter, FlaskConical,
  History, CheckCircle, ChevronRight,
  XCircle, Settings,
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
  CategoryId: number | null;
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

// ── API ───────────────────────────────────────────────────────────────
const BASE_URL = "/sourcing/seller";

async function fetchSellerRequests(type: SourcingType, status: SupplierStatus): Promise<SellerSourcingResponse[]> {
  return api.get<SellerSourcingResponse[]>(`${BASE_URL}/requests`, {
    params: { type, status },
  });
}

async function fetchSellerPastRequests(type: SourcingType): Promise<SellerSourcingResponse[]> {
  return api.get<SellerSourcingResponse[]>(`${BASE_URL}/requests/past`, {
    params: { type },
  });
}

async function fetchSellerCompletedRequests(type: SourcingType): Promise<SellerSourcingResponse[]> {
  return api.get<SellerSourcingResponse[]>(`${BASE_URL}/requests/completed`, {
    params: { type },
  });
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
  await api.patch(`${BASE_URL}/suppliers/${sourcingSupplierId}/decline`, { feedback });
}

// ── 소싱 수신 설정 (SupplierProfile) ────────────────────────────────────
type SupplierSourcingTypeValue = "NONE" | "READY" | "CUSTOM" | "BOTH";

interface SupplierProfileData {
  sourcingType: SupplierSourcingTypeValue;
  autoAssignEnabled: boolean;
}

async function fetchSupplierProfile(): Promise<SupplierProfileData> {
  return api.get<SupplierProfileData>(`${BASE_URL}/profile`);
}

async function updateSupplierProfile(data: SupplierProfileData): Promise<SupplierProfileData> {
  return api.patch<SupplierProfileData>(`${BASE_URL}/profile`, data);
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
// ── 소싱 수신 설정 모달 ───────────────────────────────────────────────
const SOURCING_TYPE_OPTIONS: { value: SupplierSourcingTypeValue; label: string; desc: string }[] = [
  { value: "NONE",   label: "받지 않음",       desc: "소싱 요청을 배정받지 않습니다." },
  { value: "READY",  label: "기성품만",        desc: "READY 유형 요청만 배정받습니다." },
  { value: "CUSTOM", label: "주문제작만",      desc: "CUSTOM 유형 요청만 배정받습니다." },
  { value: "BOTH",   label: "기성품 + 주문제작", desc: "두 유형 모두 배정받습니다." },
];

function SourcingSettingsModal({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<SupplierProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplierProfile()
        .then(setProfile)
        .catch((e) => setError(e instanceof Error ? e.message : "설정을 불러오지 못했습니다."))
        .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await updateSupplierProfile(profile);
      setProfile(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-primary" />
              <h3 className="font-bold text-foreground">소싱 요청 수신 설정</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          </div>

          {loading ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : !profile ? (
              <div className="px-6 py-16 text-center text-sm text-red-500">{error ?? "설정을 불러올 수 없습니다."}</div>
          ) : (
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">받을 소싱 유형</label>
                  <div className="space-y-2">
                    {SOURCING_TYPE_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className={`flex items-start gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                                profile.sourcingType === opt.value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40"
                            }`}
                        >
                          <input
                              type="radio"
                              name="sourcingType"
                              checked={profile.sourcingType === opt.value}
                              onChange={() => setProfile({ ...profile, sourcingType: opt.value })}
                              className="mt-0.5 accent-primary"
                          />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                          </div>
                        </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">자동 배정</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      켜두면 조건에 맞는 소싱 요청이 자동으로 배정됩니다.
                    </div>
                  </div>
                  <div
                      onClick={() => setProfile({ ...profile, autoAssignEnabled: !profile.autoAssignEnabled })}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                          profile.autoAssignEnabled ? "bg-primary" : "bg-[#ddd]"
                      }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        profile.autoAssignEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </div>
                </div>

                {profile.sourcingType === "NONE" && profile.autoAssignEnabled && (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      "받지 않음"으로 설정하면 자동 배정을 켜도 배정되는 요청이 없습니다.
                    </div>
                )}

                {error && (
                    <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded font-bold text-sm transition-colors"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

// ── 거절 사유 입력 모달 ──────────────────────────────────────────────────
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

// ── 요청 행 ──────────────────────────────────────────────────────────
function RequestRow({ req, myBids, onDecline, onDetail }: {
  req: SellerSourcingResponse; myBids: MyBid[];
  onDecline: (r: SellerSourcingResponse) => void;
  onDetail: (r: SellerSourcingResponse) => void;
}) {
  const navigate = useNavigate();
  const isCustom = req.type === "CUSTOM";
  const dday = getDday(req.deliveryDate);
  const latestBid = myBids[0];
  const hasSamplePaid = myBids.some((b) => b.status === "샘플결제됨");

  return (
      <div className="bg-white border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{req.sourcingNo}</span>
              <span className={`flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 font-semibold ${ddayColorCls[dday.level]}`}>
                {dday.level === "urgent" ? <Zap size={10} /> : dday.level === "soon" ? <AlertTriangle size={10} /> : <Calendar size={10} />} {dday.label}
              </span>
              {latestBid && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${BID_STATUS_STYLE[latestBid.status]}`}>견적 {latestBid.status}</span>}
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
          </div>
        </div>
      </div>
  );
}

// ── 이전 요청 행 ──────────────────────────────────────────────────────
function PastRow({ req, onDetail }: { req: SellerSourcingResponse; onDetail: (r: SellerSourcingResponse) => void }) {
  return (
      <div
          onClick={() => onDetail(req)}
          className="bg-white border border-border rounded-lg px-5 py-4 opacity-80 cursor-pointer hover:border-primary/50 hover:opacity-100 transition-colors"
      >
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
          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
        </div>
      </div>
  );
}

// ── 완료된 요청 행 ────────────────────────────────────────────────────
function CompletedRow({ req, onDetail }: { req: SellerSourcingResponse; onDetail: (r: SellerSourcingResponse) => void }) {
  return (
      <div
          onClick={() => onDetail(req)}
          className="bg-white border border-border rounded-lg px-5 py-4 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground font-mono">{req.sourcingNo}</span>
              <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle size={9} /> 완료
              </span>
            </div>
            <div className="font-semibold text-sm text-foreground truncate">{req.productName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">납기 {req.deliveryDate}</div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
        </div>
      </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export function SellerRequestList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SourcingType>("READY");
  const [subTab, setSubTab] = useState<"current" | "my" | "completed" | "past">("current");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [requests, setRequests] = useState<SellerSourcingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [myBids, setMyBids] = useState<Record<number, MyBid[]>>({});
  const [declineReq, setDeclineReq] = useState<SellerSourcingResponse | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    setRequests([]);
    try {
      let data: SellerSourcingResponse[];
      if (subTab === "current") {
        data = await fetchSellerRequests(activeTab, "RECOMMENDED");
      } else if (subTab === "my") {
        // ss.status는 승인 이후에도 QUOTED로 유지되어 이 엔드포인트에 계속 잡힘.
        // 완료(승인)된 건은 전용 completed 탭에서 보여주므로 여기선 중복 방지로 제외.
        const all = await fetchSellerRequests(activeTab, "QUOTED");
        data = all.filter((r) => r.myQuote?.status !== "APPROVED");
      } else if (subTab === "completed") {
        data = await fetchSellerCompletedRequests(activeTab);
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
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="inline-block bg-primary text-xs font-mono px-2 py-1 rounded tracking-wider uppercase">소싱 요청 게시판</div>
              <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                <Settings size={13} /> 소싱 수신 설정
              </button>
            </div>
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
            {(["current", "my", "completed", "past"] as const).map((tab) => {
              const labels = { current: "전체 요청", my: "내 제안", completed: "완료", past: "이전 요청" };
              const icons = { current: <Filter size={13} />, my: <Zap size={13} />, completed: <CheckCircle size={13} />, past: <History size={13} /> };
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

          {(subTab === "current" || subTab === "my") && (
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

          {subTab === "completed" && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-3 mb-6">
                <CheckCircle size={14} /> 바이어가 승인해 거래가 완료된 요청입니다.
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
                {(subTab === "current" || subTab === "my") && (
                    <div className="space-y-3">
                      {filtered.map((req) => (
                          <RequestRow
                              key={req.sourcingRequestId} req={req}
                              myBids={myBids[req.sourcingRequestId] ?? []}
                              onDecline={setDeclineReq}
                              onDetail={(r) => navigate(`/seller/sourcing-detail/${r.sourcingRequestId}`)}
                          />
                      ))}
                      {filtered.length === 0 && <div className="text-center py-20 text-muted-foreground"><div className="text-4xl mb-3">📭</div><div className="font-medium">배정된 요청이 없습니다</div></div>}
                    </div>
                )}

                {subTab === "completed" && (
                    <div className="space-y-3">
                      {requests.map((req) => (
                          <CompletedRow
                              key={req.sourcingRequestId}
                              req={req}
                              onDetail={(r) => navigate(`/seller/sourcing-detail/${r.sourcingRequestId}`)}
                          />
                      ))}
                      {requests.length === 0 && <div className="text-center py-20 text-muted-foreground"><div className="text-4xl mb-3">📭</div><div className="font-medium">완료된 거래가 없습니다</div></div>}
                    </div>
                )}

                {subTab === "past" && (
                    <div className="space-y-3">
                      {requests.map((req) => (
                          <PastRow
                              key={req.sourcingRequestId}
                              req={req}
                              onDetail={(r) => navigate(`/seller/sourcing-detail/${r.sourcingRequestId}`)}
                          />
                      ))}
                      {requests.length === 0 && <div className="text-center py-20 text-muted-foreground"><div className="text-4xl mb-3">📭</div><div className="font-medium">이전 요청 내역이 없습니다</div></div>}
                    </div>
                )}
              </>
          )}
        </div>

        {declineReq && <DeclineModal req={declineReq} onClose={() => setDeclineReq(null)} onConfirm={handleDeclineConfirm} />}
        {showSettings && <SourcingSettingsModal onClose={() => setShowSettings(false)} />}
      </div>
  );
}
