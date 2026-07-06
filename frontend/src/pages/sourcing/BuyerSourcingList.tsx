import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "@/api/axios";
import {
  Package, ChevronRight, Loader2, Clock3, Handshake,
  CheckCircle2, Ban, LayoutGrid,
} from "lucide-react";

// ── 타입 (백엔드 BuyerSourcingBoardResponse 기준) ──────────────────────────
type SourcingType = "READY" | "CUSTOM";
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN" | "EXPIRED";

interface BuyerSourcingResponse {
  sourcingRequestId: number;
  sourcingNo: string;
  type: SourcingType;
  status: RequestStatus;
  productName: string;
  brandName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  needSample: "Y" | "N";
  unitPrice: number | null;
  totalBudget: number | null;
  deliveryDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  bidCount: number;
}

// 백엔드 BuyerSourcingCountResponse
interface BuyerSourcingCounts {
  all: number;
  active: number;
  trading: number;
  completed: number;
  closed: number;
}

// 백엔드 BuyerSourcingBoardResponse
interface BuyerSourcingBoard {
  requests: BuyerSourcingResponse[];
  counts: BuyerSourcingCounts;
}

// ── 상태 스타일 (개별 요청 상태 - 관리자 화면과 동일한 라벨 사용) ────────────
const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING:     "대기중",
  QUOTED:      "견적수신",
  NEGOTIATING: "협의중",
  TRADING:     "거래중",
  COMPLETED:   "완료",
  CANCELLED:   "반려됨", // 공급사 전원 거절로 인한 자동 반려
  WITHDRAWN:   "취소함", // 바이어가 직접 취소
  EXPIRED:     "기한만료",
};

const STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING:     "bg-secondary text-muted-foreground border-border",
  QUOTED:      "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATING: "bg-purple-50 text-purple-600 border-purple-200",
  TRADING:     "bg-blue-50 text-blue-600 border-blue-200",
  COMPLETED:   "bg-green-50 text-green-600 border-green-200",
  CANCELLED:   "bg-red-50 text-red-500 border-red-200",
  WITHDRAWN:   "bg-secondary text-muted-foreground border-border",
  EXPIRED:     "bg-secondary text-muted-foreground border-border",
};

// 종료(반려/취소/기한만료)된 요청은 접수견적 수치를 굳이 보여줄 필요가 없음
const TERMINATED_STATUSES: RequestStatus[] = ["CANCELLED", "WITHDRAWN", "EXPIRED"];

// ── 진행 상태 필터 (백엔드 status 그룹 파라미터와 1:1 대응) ──────────────────
// 그룹 라벨 기준 (관리자 화면과 동일하게 통일):
//  - ACTIVE:    아직 채택 전 (PENDING/QUOTED/NEGOTIATING)
//  - TRADING:   견적 승인 후 거래 진행중
//  - COMPLETED: 거래가 성사되어 완료됨 → "거래완료"
//  - CLOSED:    거래가 성사되지 않고 중단됨 (반려/취소/기한만료) → "거래중단"
type StatusFilter = "ALL" | "ACTIVE" | "TRADING" | "COMPLETED" | "CLOSED";

const FILTERS: Array<{ value: StatusFilter; label: string; icon: React.ReactNode; countKey: keyof BuyerSourcingCounts }> = [
  { value: "ALL",       label: "전체",     icon: <LayoutGrid size={15} />,   countKey: "all" },
  { value: "ACTIVE",    label: "진행중",   icon: <Clock3 size={15} />,       countKey: "active" },
  { value: "TRADING",   label: "거래중",   icon: <Handshake size={15} />,    countKey: "trading" },
  { value: "COMPLETED", label: "거래완료", icon: <CheckCircle2 size={15} />, countKey: "completed" },
  { value: "CLOSED",    label: "거래중단", icon: <Ban size={15} />,          countKey: "closed" },
];

// ── API ───────────────────────────────────────────────────────────────────
async function fetchBuyerSourcingBoard(type: SourcingType, statusFilter: StatusFilter): Promise<BuyerSourcingBoard> {
  const params: Record<string, string> = { type };
  if (statusFilter !== "ALL") params.status = statusFilter;

  // interceptor가 response.data.data 언래핑 처리 (withCredentials 포함 axios 인스턴스)
  return api.get<BuyerSourcingBoard>("/sourcing/buyer/requests", { params });
}

// ── 요청 행 ───────────────────────────────────────────────────────────────
function RequestRow({ request, onClick }: { request: BuyerSourcingResponse; onClick: () => void }) {
  const isTerminated = TERMINATED_STATUSES.includes(request.status);

  return (
      <div
          onClick={onClick}
          className="bg-white border border-border rounded-lg px-5 py-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{request.sourcingNo}</span>
              {request.categoryName && (
                  <span className="text-[10px] bg-secondary text-primary px-2 py-0.5 rounded">
                {request.categoryName}
              </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[request.status]}`}>
              {STATUS_LABEL[request.status]}
            </span>
            </div>
            <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {request.productName}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {request.createdAt.slice(0, 10)} 등록
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
            <div>
              <div className="font-mono font-bold text-sm text-foreground">
                {request.type === "READY"
                    ? request.unitPrice != null ? `${request.unitPrice.toLocaleString()}원` : "—"
                    : request.totalBudget != null ? `${(request.totalBudget / 10000).toLocaleString()}만원` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {request.type === "READY" ? "희망단가" : "희망예산"}
              </div>
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-foreground">
                {request.deliveryDate?.slice(5) ?? "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">희망납기</div>
            </div>
            {!isTerminated && (
                <div>
                  <div className={`font-mono font-bold text-sm ${request.bidCount > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                    {request.bidCount}건
                  </div>
                  <div className="text-[10px] text-muted-foreground">접수견적</div>
                </div>
            )}
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────
export function BuyerSourcingList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SourcingType>("READY");
  const [requests, setRequests] = useState<BuyerSourcingResponse[]>([]);
  const [counts, setCounts] = useState<BuyerSourcingCounts>({ all: 0, active: 0, trading: 0, completed: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get("status") as StatusFilter | null;
  const activeFilter: StatusFilter = FILTERS.some((f) => f.value === requestedFilter)
      ? requestedFilter!
      : "ALL";

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchBuyerSourcingBoard(activeTab, activeFilter)
        .then((board) => {
          setRequests(board.requests);
          setCounts(board.counts);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "소싱 요청 목록 조회 실패"))
        .finally(() => setIsLoading(false));
  }, [activeTab, activeFilter]);

  const handleTabChange = (tab: SourcingType) => {
    setActiveTab(tab);
  };

  const handleFilter = (filter: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    if (filter === "ALL") next.delete("status");
    else next.set("status", filter);
    setSearchParams(next);
  };

  return (
      <div className="max-w-[1000px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        <div className="flex items-center gap-2 mb-1">
          <Package size={22} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">소싱 요청 관리</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">요청을 선택해 견적을 확인하고 진행하세요.</p>

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
                {tab === "READY" ? "🏷️ 기성품" : "✂️ 주문제작"}
                {activeTab === tab && !isLoading && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono bg-primary text-white">
                {counts.all}
              </span>
                )}
              </button>
          ))}
        </div>

        {/* 진행 상태 필터 카운트 카드 (서버에서 계산된 counts 사용) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          {FILTERS.map((f) => (
              <button
                  key={f.value}
                  onClick={() => handleFilter(f.value)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      activeFilter === f.value
                          ? "border-primary bg-white shadow-sm ring-1 ring-primary/15"
                          : "border-border bg-white hover:border-primary/40"
                  }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  {f.icon} {f.label}
                </span>
                <span className={`text-sm font-bold ${activeFilter === f.value ? "text-primary" : "text-foreground"}`}>
                  {counts[f.countKey]}
                </span>
              </button>
          ))}
        </div>

        {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">불러오는 중...</span>
            </div>
        )}

        {error && (
            <div className="text-center py-20 text-muted-foreground">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-medium text-foreground mb-1">목록을 불러올 수 없습니다</div>
              <div className="text-sm">{error}</div>
            </div>
        )}

        {!isLoading && !error && (
            <div className="space-y-3">
              {requests.map((req) => (
                  <RequestRow
                      key={req.sourcingRequestId}
                      request={req}
                      onClick={() => navigate(`/buyer/sourcing-detail/${req.sourcingRequestId}`)}
                  />
              ))}
              {requests.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="font-medium">
                      {activeFilter === "ALL" ? "등록된 소싱 요청이 없습니다" : "조건에 맞는 소싱 요청이 없습니다"}
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}
