import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Package, ChevronRight, Loader2 } from "lucide-react";

// ── 타입 (백엔드 BuyerSourcingResponse 기준) ───────────────────────────────
type SourcingType = "READY" | "CUSTOM";
type RequestStatus = "PENDING" | "QUOTED" | "TRADING" | "NEGOTIATING" | "CANCELLED" | "COMPLETED" | "WITHDRAWN";

interface BuyerSourcingResponse {
  sourcingRequestId: number;
  sourcingNo: string;
  type: SourcingType;
  status: RequestStatus;
  productName: string;
  brandName: string | null;
  subCategoryId: number | null;
  categoryName: string | null;
  needSample: "Y" | "N";
  unitPrice: number | null;
  totalBudget: number | null;
  deliveryDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  bidCount: number;
}

// ── 상태 스타일 ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING:     "대기중",
  QUOTED:      "견적수신",
  NEGOTIATING: "협의중",
  TRADING:     "거래중",
  COMPLETED:   "완료",
  CANCELLED:   "취소됨",
  WITHDRAWN:   "취소됨",
};

const STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING:     "bg-secondary text-muted-foreground border-border",
  QUOTED:      "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATING: "bg-purple-50 text-purple-600 border-purple-200",
  TRADING:     "bg-blue-50 text-blue-600 border-blue-200",
  COMPLETED:   "bg-green-50 text-green-600 border-green-200",
  CANCELLED:   "bg-red-50 text-red-500 border-red-200",
  WITHDRAWN:   "bg-secondary text-muted-foreground border-border",
};

// ── API ───────────────────────────────────────────────────────────────────
const BASE_URL = "/api/sourcing/buyer";

async function fetchBuyerRequests(type: SourcingType): Promise<BuyerSourcingResponse[]> {
  const res = await fetch(`${BASE_URL}/requests?type=${type}`);
  if (!res.ok) throw new Error("소싱 요청 목록 조회 실패");
  return res.json();
}

// ── 요청 행 ───────────────────────────────────────────────────────────────
function RequestRow({ request, onClick }: { request: BuyerSourcingResponse; onClick: () => void }) {
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
            <div>
              <div className={`font-mono font-bold text-sm ${request.bidCount > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                {request.bidCount}건
              </div>
              <div className="text-[10px] text-muted-foreground">접수견적</div>
            </div>
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchBuyerRequests(activeTab)
        .then(setRequests)
        .catch((e) => setError(e.message))
        .finally(() => setIsLoading(false));
  }, [activeTab]);

  const readyCount = activeTab === "READY" ? requests.length : null;
  const customCount = activeTab === "CUSTOM" ? requests.length : null;

  return (
      <div className="max-w-[900px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        <div className="flex items-center gap-2 mb-1">
          <Package size={22} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">소싱 요청 관리</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">요청을 선택해 견적을 확인하고 진행하세요.</p>

        <div className="flex gap-1 bg-secondary border border-border rounded-lg p-1 mb-6 w-fit">
          {(["READY", "CUSTOM"] as const).map((tab) => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded text-sm font-semibold transition-colors ${
                      activeTab === tab
                          ? "bg-white text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "READY" ? "🏷️ 기성품 사입" : "✂️ 주문제작"}
                {activeTab === tab && !isLoading && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono bg-primary text-white">
                {requests.length}
              </span>
                )}
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
                    <div className="font-medium">등록된 소싱 요청이 없습니다</div>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}
