import { useEffect, useState } from "react";
import {
  FileText, ChevronDown, ChevronUp, Calendar, User, Package, DollarSign,
  Send, Loader2, CheckCircle2, XCircle, UserPlus, Search,
} from "lucide-react";
import {
  getAllSourcingRequests,
  getSourcingStats,
  getSuggestedSuppliers,
  approveSupplier,
  rejectSupplier,
  getAssignableCompanies,
  manualAssignSupplier,
  type AdminSourcingRequestResponse,
  type AdminSourcingStatsResponse,
  type SourcingGroupFilter,
  type SourcingStatus,
  type SourcingSupplierResponse,
  type AssignableCompanyResponse,
} from "@/api/sourcing/sourcingAdmin.service";

// ── 개별 요청의 실제 상태 라벨/스타일 ──────────────────────────────────────
const STATUS_LABEL: Record<SourcingStatus, string> = {
  PENDING:     "신규",
  QUOTED:      "견적진행",
  NEGOTIATING: "협의중",
  TRADING:     "거래중",
  COMPLETED:   "완료",
  CANCELLED:   "반려됨",
  WITHDRAWN:   "취소됨",
  EXPIRED:     "기한만료",
};

const STATUS_STYLE: Record<SourcingStatus, string> = {
  PENDING:     "bg-blue-50 border-blue-200 text-blue-700",
  QUOTED:      "bg-cyan-50 border-cyan-200 text-cyan-700",
  NEGOTIATING: "bg-purple-50 border-purple-200 text-purple-700",
  TRADING:     "bg-green-50 border-green-200 text-green-700",
  COMPLETED:   "bg-muted border-border text-muted-foreground",
  CANCELLED:   "bg-red-50 border-red-200 text-red-600",
  WITHDRAWN:   "bg-muted border-border text-muted-foreground",
  EXPIRED:     "bg-muted border-border text-muted-foreground",
};

// ── 상단 통계 카드 (원본 디자인 - 가운데 정렬 큰 숫자) ───────────────────────
// 그룹 라벨 기준:
//  - ACTIVE:    아직 채택 전 (PENDING/QUOTED/NEGOTIATING)
//  - TRADING:   견적 승인 후 거래 진행중
//  - COMPLETED: 거래가 성사되어 완료됨
//  - CLOSED:    거래가 성사되지 않고 중단됨 (반려/취소/기한만료 — 사유는 개별 STATUS_LABEL로 구분)
const STAT_CARDS: Array<{ value: SourcingGroupFilter; label: string; color: string; countKey: keyof AdminSourcingStatsResponse }> = [
  { value: "ALL",       label: "전체",     color: "bg-muted",                              countKey: "all" },
  { value: "ACTIVE",    label: "진행중",   color: "bg-blue-50 border border-blue-200",     countKey: "active" },
  { value: "TRADING",   label: "거래중",   color: "bg-green-50 border border-green-200",   countKey: "trading" },
  { value: "COMPLETED", label: "거래완료", color: "bg-purple-50 border border-purple-200", countKey: "completed" },
  { value: "CLOSED",    label: "거래중단", color: "bg-muted border border-border",         countKey: "closed" },
];

// 후보 업체 검토가 더 이상 의미 없는 상태 (거래가 성사되어 진행중이거나, 완료됐거나, 성사되지 않고 끝난 경우)
const REQUEST_DONE_STATUSES: SourcingStatus[] = ["TRADING", "COMPLETED", "CANCELLED", "WITHDRAWN", "EXPIRED"];
function isRequestDone(status: SourcingStatus): boolean {
  return REQUEST_DONE_STATUSES.includes(status);
}

// ── 유틸 ──────────────────────────────────────────────────────────────────
function formatBudget(req: AdminSourcingRequestResponse): string {
  if (req.type === "READY") {
    return req.unitPrice != null ? `${req.unitPrice.toLocaleString()}원` : "—";
  }
  return req.totalBudget != null ? `${req.totalBudget.toLocaleString()}원` : "—";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── 반려 사유 입력 폼 (개별 반려용) ────────────────────────────────────────
function RejectForm({ onCancel, onConfirm, submitting }: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="반려 사유를 입력해 주세요."
            rows={2}
            className="w-full text-xs border border-border rounded px-2.5 py-2 outline-none focus:border-red-400 bg-white resize-none"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
              onClick={onCancel}
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
              onClick={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || submitting}
              className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            반려 확정
          </button>
        </div>
      </div>
  );
}

// ── 업체 한 줄 (체크박스로 승인 대상 선택 + 개별 반려 버튼) ────────────────
function SupplierItem({
                        supplier, isChecked, onToggle, onReject,
                      }: {
  supplier: SourcingSupplierResponse;
  isChecked: boolean;
  onToggle: () => void;
  onReject: (reason: string) => Promise<void>;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleReject = async (reason: string) => {
    setProcessing(true);
    try {
      await onReject(reason);
    } finally {
      setProcessing(false);
      setShowRejectForm(false);
    }
  };

  return (
      <div className={`border rounded-lg p-3 transition-all ${
          isChecked ? "border-primary bg-primary/5" : "border-border bg-white"
      }`}>
        <div className="flex items-center gap-3">
          <div
              onClick={onToggle}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                  isChecked ? "border-primary bg-primary" : "border-border"
              }`}
          >
            {isChecked && <div className="w-2 h-2 bg-white rounded-sm" />}
          </div>
          <div
              onClick={onToggle}
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          >
            <User size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {supplier.sellerCompanyName ?? `업체 #${supplier.sellerCompanyId}`}
            </span>
          </div>
          {!showRejectForm && (
              <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
              >
                <XCircle size={12} />
                반려
              </button>
          )}
        </div>

        {showRejectForm && (
            <RejectForm
                submitting={processing}
                onCancel={() => setShowRejectForm(false)}
                onConfirm={handleReject}
            />
        )}
      </div>
  );
}

// ── 후보 업체 검토 패널 ─────────────────────────────────────────────────────
function SupplierReviewPanel({
                               request, suppliers, isLoading, onBulkApprove, onReject,
                             }: {
  request: AdminSourcingRequestResponse;
  suppliers: SourcingSupplierResponse[] | undefined;
  isLoading: boolean;
  onBulkApprove: (ids: number[]) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  const hasPending = request.pendingSupplierCount > 0;

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    setProcessing(true);
    try {
      await onBulkApprove(selected);
      setSelected([]);
    } finally {
      setProcessing(false);
    }
  };

  if (!hasPending) {
    return (
        <div className="text-center py-4 text-xs text-muted-foreground">
          승인 대기 중인 후보 업체가 없습니다.
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span className="text-xs">불러오는 중...</span>
        </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
        <div className="text-center py-4 text-xs text-muted-foreground">
          남은 검토 대기 후보가 없습니다.
        </div>
    );
  }

  return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{selected.length}개 업체 선택됨</p>
          <button
              onClick={handleBulkApprove}
              disabled={selected.length === 0 || processing}
              className="bg-primary hover:bg-primary/90 text-white text-xs px-4 py-2 rounded font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {processing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {selected.length > 0 ? `${selected.length}개 일괄 승인` : "일괄 승인"}
          </button>
        </div>

        <div className="space-y-2">
          {suppliers.map((s) => (
              <SupplierItem
                  key={s.sourcingSupplierId}
                  supplier={s}
                  isChecked={selected.includes(s.sourcingSupplierId)}
                  onToggle={() => toggle(s.sourcingSupplierId)}
                  onReject={(reason) => onReject(s.sourcingSupplierId, reason)}
              />
          ))}
        </div>
      </div>
  );
}

// ── 성공 토스트 ───────────────────────────────────────────────────────────
function SuccessToast({ message, detail }: { message: string; detail: string }) {
  return (
      <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom z-50">
        <CheckCircle2 size={24} />
        <div>
          <div className="font-semibold">{message}</div>
          <div className="text-sm text-green-100">{detail}</div>
        </div>
      </div>
  );
}

// ── 수동배정 모달 - 후보 업체가 없거나(자동배정 OFF 등) 관리자가 직접 특정 회사를 배정하고 싶을 때 사용 ──
function ManualAssignModal({
                             sourcingRequestId, onClose, onAssigned,
                           }: {
  sourcingRequestId: number;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [includeAllCategories, setIncludeAllCategories] = useState(false);
  const [companies, setCompanies] = useState<AssignableCompanyResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage(null);
      try {
        const result = await getAssignableCompanies(sourcingRequestId, keyword.trim(), includeAllCategories);
        setCompanies(result);
      } catch (e) {
        setErrorMessage("회사 목록을 불러오지 못했습니다.");
      } finally {
        setIsSearching(false);
      }
    }, 300); // 디바운스

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, includeAllCategories, sourcingRequestId]);

  const handleAssign = async (companyId: number) => {
    setAssigningId(companyId);
    setErrorMessage(null);
    try {
      await manualAssignSupplier(sourcingRequestId, companyId);
      onAssigned();
      onClose();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "배정 중 오류가 발생했습니다.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
      >
        <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-1.5">
              <UserPlus size={16} className="text-primary" />
              수동 배정
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
              닫기
            </button>
          </div>

          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="회사명으로 검색"
                autoFocus
                className="w-full text-sm border border-border rounded pl-8 pr-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <label className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground cursor-pointer select-none">
            <input
                type="checkbox"
                checked={includeAllCategories}
                onChange={(e) => setIncludeAllCategories(e.target.checked)}
                className="accent-primary"
            />
            카테고리 무관 전체보기
            <span className="text-muted-foreground/70">
              (셀러가 취급 카테고리를 등록 안 했거나 잘못 등록한 경우 체크)
            </span>
          </label>

          {errorMessage && (
              <p className="text-xs text-red-500 mb-2">{errorMessage}</p>
          )}

          <div className="max-h-72 overflow-y-auto border border-border rounded">
            {isSearching ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span className="text-xs">검색 중...</span>
                </div>
            ) : companies.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  배정 가능한 회사가 없습니다.
                </div>
            ) : (
                <ul className="divide-y divide-border">
                  {companies.map((c) => (
                      <li key={c.companyId} className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-foreground">{c.name}</span>
                        <button
                            onClick={() => handleAssign(c.companyId)}
                            disabled={assigningId === c.companyId}
                            className="text-xs px-3 py-1.5 rounded bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1.5"
                        >
                          {assigningId === c.companyId && <Loader2 size={11} className="animate-spin" />}
                          배정
                        </button>
                      </li>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────
export function AdminSourcingRequests() {
  const [requests, setRequests] = useState<AdminSourcingRequestResponse[]>([]);
  const [stats, setStats] = useState<AdminSourcingStatsResponse>({ all: 0, active: 0, trading: 0, completed: 0, closed: 0 });
  const [filterStatus, setFilterStatus] = useState<SourcingGroupFilter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [suppliersByRequest, setSuppliersByRequest] = useState<Record<number, SourcingSupplierResponse[]>>({});
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  const [toast, setToast] = useState<{ message: string; detail: string } | null>(null);

  // 수동배정 모달을 띄운 소싱 요청 id (닫혀있으면 null)
  const [manualAssignRequestId, setManualAssignRequestId] = useState<number | null>(null);

  useEffect(() => {
    getSourcingStats()
        .then(setStats)
        .catch((e) => console.error("소싱 통계 조회 실패:", e));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getAllSourcingRequests(filterStatus)
        .then(setRequests)
        .catch((e) => setError(e instanceof Error ? e.message : "소싱 요청 목록 조회 실패"))
        .finally(() => setIsLoading(false));
  }, [filterStatus]);

  const showToast = (message: string, detail: string) => {
    setToast({ message, detail });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExpand = async (request: AdminSourcingRequestResponse) => {
    const opening = expandedId !== request.sourcingRequestId;
    setExpandedId(opening ? request.sourcingRequestId : null);

    if (
        opening &&
        !isRequestDone(request.status) &&
        request.pendingSupplierCount > 0 &&
        !suppliersByRequest[request.sourcingRequestId]
    ) {
      setIsLoadingSuppliers(true);
      try {
        const suppliers = await getSuggestedSuppliers(request.sourcingRequestId);
        setSuppliersByRequest((prev) => ({ ...prev, [request.sourcingRequestId]: suppliers }));
      } catch (e) {
        console.error("후보 업체 조회 실패:", e);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }
  };

  const removeSuppliersFromState = (requestId: number, ids: number[]) => {
    setSuppliersByRequest((prev) => ({
      ...prev,
      [requestId]: (prev[requestId] ?? []).filter((s) => !ids.includes(s.sourcingSupplierId)),
    }));
    setRequests((prev) =>
        prev.map((r) =>
            r.sourcingRequestId === requestId
                ? { ...r, pendingSupplierCount: Math.max(0, r.pendingSupplierCount - ids.length) }
                : r
        )
    );
  };

  // 승인 - 체크박스로 선택된 여러 업체를 한 번에 처리
  const handleBulkApprove = async (requestId: number, ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => approveSupplier(id)));
      removeSuppliersFromState(requestId, ids);
      showToast("승인 완료", `${ids.length}개 업체가 셀러에게 노출됩니다`);
    } catch (e) {
      // 이미 처리된 배정(다른 탭/관리자가 먼저 처리한 경우 등)에 재시도한 경우 등
      showToast("승인 실패", "이미 처리되었거나 상태가 변경된 항목이 있습니다. 목록을 새로고침해 주세요.");
      throw e; // 호출부(SupplierReviewPanel)의 processing 상태 해제를 위해 재throw
    }
  };

  // 반려 - 업체마다 사유가 다를 수 있어 한 번에 하나씩 처리
  const handleReject = async (requestId: number, id: number, reason: string) => {
    try {
      await rejectSupplier(id, reason);
      removeSuppliersFromState(requestId, [id]);
      showToast("반려 완료", "해당 업체가 반려되었습니다");
    } catch (e) {
      showToast("반려 실패", "이미 처리되었거나 상태가 변경된 항목입니다. 목록을 새로고침해 주세요.");
      throw e;
    }
  };

  // 수동배정 - 배정 직후엔 SUGGESTED 상태이므로 후보 목록/대기 카운트를 새로 불러와 반영
  const handleManualAssigned = async (requestId: number) => {
    try {
      const suppliers = await getSuggestedSuppliers(requestId);
      setSuppliersByRequest((prev) => ({ ...prev, [requestId]: suppliers }));
      setRequests((prev) =>
          prev.map((r) =>
              r.sourcingRequestId === requestId
                  ? { ...r, pendingSupplierCount: suppliers.length }
                  : r
          )
      );
      showToast("배정 완료", "관리자 승인 대기 목록에 추가되었습니다");
    } catch (e) {
      console.error("수동배정 후 후보 목록 갱신 실패:", e);
    }
  };

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={22} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">소싱 요청 관리</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          전체 소싱 요청 현황을 확인하고, 승인 대기 중인 후보 업체를 검토하세요.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {STAT_CARDS.map((stat) => (
              <button
                  key={stat.value}
                  onClick={() => setFilterStatus(stat.value)}
                  className={`${stat.color} rounded-lg p-4 text-center hover:shadow-md transition-all ${filterStatus === stat.value ? "ring-2 ring-primary" : ""}`}
              >
                <div className="text-2xl font-bold font-mono text-foreground">{stats[stat.countKey]}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{stat.label}</div>
              </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              소싱 요청서 목록
            </h2>
          </div>

          {isLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-sm">불러오는 중...</span>
              </div>
          )}

          {error && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">⚠️</div>
                <div className="font-medium text-foreground mb-1">목록을 불러올 수 없습니다</div>
                <div className="text-sm">{error}</div>
              </div>
          )}

          {!isLoading && !error && (
              <div className="divide-y divide-border">
                {requests.map((req) => {
                  const isExpanded = expandedId === req.sourcingRequestId;
                  const done = isRequestDone(req.status);

                  return (
                      <div key={req.sourcingRequestId}>
                        {/* Request Header */}
                        <div
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleExpand(req)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono font-bold text-sm text-foreground">{req.sourcingNo}</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLE[req.status]}`}>
                                {STATUS_LABEL[req.status]}
                              </span>
                              {!done && req.pendingSupplierCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">
                                    후보 {req.pendingSupplierCount}건 대기
                                  </span>
                              )}
                            </div>
                            <div className="text-sm text-foreground font-medium mb-1">{req.productName}</div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><User size={11} />{req.buyerCompanyName ?? `회사 #${req.buyerCompanyId}`}</span>
                              <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(req.createdAt)}</span>
                              <span className="flex items-center gap-1"><Package size={11} />{req.type === "READY" ? "기성품" : "주문제작"}</span>
                              <span className="flex items-center gap-1"><DollarSign size={11} />{formatBudget(req)}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-border bg-muted/20 px-5 py-4">
                              <div className="grid grid-cols-2 gap-6 mb-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">바이어 정보</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">회사명</span>
                                      <span className="font-medium text-foreground">{req.buyerCompanyName ?? `회사 #${req.buyerCompanyId}`}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">요청일시</span>
                                      <span className="font-mono text-xs text-foreground">{formatDate(req.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">제품 정보</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">제품명</span>
                                      <span className="font-medium text-foreground">{req.productName}</span>
                                    </div>
                                    {req.brandName && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">브랜드</span>
                                          <span className="font-medium text-foreground">{req.brandName}</span>
                                        </div>
                                    )}
                                    {req.categoryName && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">카테고리</span>
                                          <span className="font-medium text-foreground">{req.categoryName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">구분</span>
                                      <span className="font-medium text-foreground">{req.type === "READY" ? "기성품" : "주문제작"}</span>
                                    </div>
                                    {req.mainMaterial && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">주요 소재</span>
                                          <span className="font-medium text-foreground">{req.mainMaterial}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">샘플 필요</span>
                                      <span className="font-medium text-foreground">{req.needSample === "Y" ? "필요" : "불필요"}</span>
                                    </div>
                                    {req.deliveryDate && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">희망 납기</span>
                                          <span className="font-mono text-xs text-foreground">{req.deliveryDate}</span>
                                        </div>
                                    )}
                                    {req.expiryDate && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">요청 만료일</span>
                                          <span className="font-mono text-xs text-foreground">{req.expiryDate}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">예산</span>
                                      <span className="font-medium text-primary">{formatBudget(req)}</span>
                                    </div>
                                    {req.refUrl && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">참고 URL</span>
                                          <a
                                              href={req.refUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-primary hover:underline text-xs truncate max-w-[160px]"
                                          >
                                            링크 열기
                                          </a>
                                        </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {req.detail && (
                                  <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">상세 요구사항</h4>
                                    <div className="bg-white border border-border rounded p-3 text-sm text-foreground leading-relaxed">
                                      {req.detail}
                                    </div>
                                  </div>
                              )}

                              {!done && (
                                  <div className="pt-3 border-t border-border">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                                        <Send size={12} />
                                        후보 업체 검토
                                      </h4>
                                      <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setManualAssignRequestId(req.sourcingRequestId);
                                          }}
                                          className="text-xs px-2.5 py-1 rounded border border-primary text-primary hover:bg-primary/5 font-medium flex items-center gap-1"
                                      >
                                        <UserPlus size={12} />
                                        수동배정
                                      </button>
                                    </div>
                                    <SupplierReviewPanel
                                        request={req}
                                        suppliers={suppliersByRequest[req.sourcingRequestId]}
                                        isLoading={isLoadingSuppliers && !suppliersByRequest[req.sourcingRequestId]}
                                        onBulkApprove={(ids) => handleBulkApprove(req.sourcingRequestId, ids)}
                                        onReject={(id, reason) => handleReject(req.sourcingRequestId, id, reason)}
                                    />
                                  </div>
                              )}
                            </div>
                        )}
                      </div>
                  );
                })}
              </div>
          )}
        </div>

        {!isLoading && !error && requests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <div>해당 상태의 소싱 요청서가 없습니다</div>
            </div>
        )}

        {toast && <SuccessToast message={toast.message} detail={toast.detail} />}

        {manualAssignRequestId !== null && (
            <ManualAssignModal
                sourcingRequestId={manualAssignRequestId}
                onClose={() => setManualAssignRequestId(null)}
                onAssigned={() => handleManualAssigned(manualAssignRequestId)}
            />
        )}
      </div>
  );
}