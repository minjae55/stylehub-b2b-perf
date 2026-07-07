import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  FileText,
  MessageSquare,
  Search,
  Send,
  User,
  ShieldAlert,
  X,
} from "lucide-react";
import { useLocation, useParams } from "react-router";
import api from "@/api/axios";

type DisputeStatus =
  | "RECEIVED"
  | "REVIEWING"
  | "WAITING_SELLER"
  | "WAITING_BUYER"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELED";

type ResponderRole = "BUYER" | "SELLER" | "ADMIN";

type DisputeListResponse = {
  disputeId: number;
  orderId: number;
  orderNo: string;
  title: string;
  disputeType: string;
  status: DisputeStatus;
  requestedAction: string;
  buyerClaim: string;
  receivedAt: string;
};

type DisputeResponseItem = {
  responseId: number;
  responderRole: ResponderRole;
  status: DisputeStatus;
  content: string;
  createdAt: string;
};

type DisputeDetailResponse = DisputeListResponse & {
  responses: DisputeResponseItem[];
};

const STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; className: string }
> = {
  RECEIVED: {
    label: "접수 완료",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  REVIEWING: {
    label: "관리자 검토 중",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  WAITING_SELLER: {
    label: "판매사 답변 대기",
    className: "border-purple-200 bg-purple-50 text-purple-700",
  },
  WAITING_BUYER: {
    label: "바이어 답변 대기",
    className: "border-pink-200 bg-pink-50 text-pink-700",
  },
  RESOLVED: {
    label: "처리 완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    label: "기각",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  CANCELED: {
    label: "취소",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: "배송 지연",
  MISSING_ITEM: "수량 부족",
  PAYMENT: "결제 문제",
  PRODUCT_DEFECT: "상품 하자",
  WRONG_ITEM: "오배송",
  ETC: "기타",
};

const ACTION_LABELS: Record<string, string> = {
  EXCHANGE: "교환",
  PARTIAL_REFUND: "부분 환불",
  REFUND: "환불",
  RE_DELIVERY: "재배송",
  ETC: "기타",
};

const ROLE_LABELS: Record<ResponderRole, string> = {
  BUYER: "바이어",
  SELLER: "판매사",
  ADMIN: "관리자",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function Disputes() {
  const location = useLocation();
  const { disputeId } = useParams();
  const isSeller = location.pathname.startsWith("/seller");
  const [disputes, setDisputes] = useState<DisputeListResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    disputeId ? Number(disputeId) : null,
  );
  const [detail, setDetail] = useState<DisputeDetailResponse | null>(null);
  const [filter, setFilter] = useState<DisputeStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  const apiPrefix = isSeller ? "/seller/orders" : "/buyer/orders";
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminReason, setAdminReason] = useState("");

  useEffect(() => {
    const loadDisputes = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await api.get<DisputeListResponse[]>(
          `${apiPrefix}/disputes`,
        );
        setDisputes(response);
        setSelectedId((current) => {
          if (current && response.some((item) => item.disputeId === current)) {
            return current;
          }
          return response[0]?.disputeId ?? null;
        });
      } catch (loadError) {
        console.error("이의제기 목록 조회 실패", loadError);
        setError("이의제기 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDisputes();
  }, [apiPrefix]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    const loadDetail = async () => {
      try {
        setIsDetailLoading(true);
        setDetailError("");
        const response = await api.get<DisputeDetailResponse>(
          `${apiPrefix}/disputes/${selectedId}`,
        );
        setDetail(response);
      } catch (loadError) {
        console.error("이의제기 상세 조회 실패", loadError);
        setDetail(null);
        setDetailError("이의제기 상세 내용을 불러오지 못했습니다.");
      } finally {
        setIsDetailLoading(false);
      }
    };

    void loadDetail();
  }, [apiPrefix, selectedId]);

  useEffect(() => {
    const syncDisputes = async () => {
      try {
        const list = await api.get<DisputeListResponse[]>(
          `${apiPrefix}/disputes`,
        );
        setDisputes(list);

        if (selectedId) {
          const selectedDetail = await api.get<DisputeDetailResponse>(
            `${apiPrefix}/disputes/${selectedId}`,
          );
          setDetail(selectedDetail);
        }
      } catch (syncError) {
        console.error("이의제기 상태 동기화 실패", syncError);
      }
    };

    const handleFocus = () => {
      void syncDisputes();
    };

    const intervalId = window.setInterval(() => {
      void syncDisputes();
    }, 10_000);

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [apiPrefix, selectedId]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return disputes.filter((item) => {
      const matchesFilter = filter === "ALL" || item.status === filter;
      const matchesSearch =
        !keyword ||
        item.orderNo.toLowerCase().includes(keyword) ||
        item.title.toLowerCase().includes(keyword) ||
        item.buyerClaim.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [disputes, filter, search]);

  const canReply =
    detail != null &&
    (isSeller
      ? detail.status === "RECEIVED" || detail.status === "WAITING_SELLER"
      : detail.status === "WAITING_BUYER");

  const counts = {
    all: disputes.length,
    received: disputes.filter((item) => item.status === "RECEIVED").length,
    waiting: disputes.filter(
      (item) =>
        item.status === "WAITING_SELLER" || item.status === "WAITING_BUYER",
    ).length,
    resolved: disputes.filter((item) => item.status === "RESOLVED").length,
  };

  const submitReply = async () => {
    if (!detail || !reply.trim() || !canReply) return;

    try {
      setIsSubmitting(true);
      setDetailError("");
      const response = await api.post<DisputeResponseItem>(
        `${apiPrefix}/disputes/${detail.disputeId}/responses`,
        { content: reply.trim() },
      );
      const nextStatus = response.status;
      setDetail((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
              responses: [...current.responses, response],
            }
          : current,
      );
      setDisputes((current) =>
        current.map((item) =>
          item.disputeId === detail.disputeId
            ? { ...item, status: nextStatus }
            : item,
        ),
      );
      setReply("");
    } catch (submitError) {
      console.error("이의제기 답변 등록 실패", submitError);
      setDetailError(
        submitError instanceof Error
          ? submitError.message
          : "답변을 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveDispute = async () => {
    if (!detail) return;

    try {
      await api.post(`${apiPrefix}/disputes/${detail.disputeId}/resolve`);

      setDetail((current) =>
        current ? { ...current, status: "RESOLVED" } : current,
      );

      setDisputes((current) =>
        current.map((item) =>
          item.disputeId === detail.disputeId
            ? { ...item, status: "RESOLVED" }
            : item,
        ),
      );
    } catch (error) {
      console.error("이의제기 처리 완료 실패", error);
      alert("처리 완료에 실패했습니다.");
    }
  };

  const requestAdminReview = async () => {
    if (!detail || !adminReason.trim()) return;

    try {
      await api.post(`${apiPrefix}/disputes/${detail.disputeId}/admin-review`, {
        content: adminReason.trim(),
      });

      setDetail((current) =>
        current ? { ...current, status: "REVIEWING" } : current,
      );

      setDisputes((current) =>
        current.map((item) =>
          item.disputeId === detail.disputeId
            ? { ...item, status: "REVIEWING" }
            : item,
        ),
      );

      setAdminReason("");
      setIsAdminModalOpen(false);
    } catch (error) {
      console.error("관리자 검토 요청 실패", error);
      alert("관리자 검토 요청에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6">
        {/* 상단 헤더 */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">
              Dispute Resolution
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              이의제기 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isSeller
                ? "판매 주문에 접수된 이의제기와 답변 상태를 확인합니다."
                : "접수한 이의제기와 판매사의 답변을 확인합니다."}
            </p>
          </div>
        </header>

        {/* 대시보드 카드 섹션 */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="전체 이의제기"
            value={counts.all}
            icon={<AlertCircle size={18} />}
            iconClassName="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="접수 완료"
            value={counts.received}
            icon={<FileText size={18} />}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="답변 대기"
            value={counts.waiting}
            icon={<MessageSquare size={18} />}
            iconClassName="bg-purple-50 text-purple-700"
          />
          <StatCard
            label="처리 완료"
            value={counts.resolved}
            icon={<Clock size={18} />}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
        </section>

        {/* 메인 대시보드 레이아웃 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">

          {/* 왼쪽: 이의제기 목록 영역 */}
          <div className="lg:col-span-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="주문번호 또는 제목 검색"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as DisputeStatus | "ALL")}
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">전체 상태</option>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <span className="shrink-0 text-xs font-bold text-slate-500">
                  총 {filtered.length}건
                </span>
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  이의제기 목록을 불러오는 중입니다.
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
                  <p className="mt-2 text-sm font-bold text-slate-900">목록 로드 실패</p>
                  <p className="mt-1 text-xs text-slate-500">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-900">표시할 내용 없음</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedId === item.disputeId;
                  return (
                    <div
                      key={item.disputeId}
                      onClick={() => setSelectedId(item.disputeId)}
                      className={`cursor-pointer p-4 transition-colors hover:bg-slate-50 ${
                        isSelected ? "bg-blue-50/70 hover:bg-blue-50" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-400">
                          {item.orderNo}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <h4 className="truncate text-sm font-bold text-slate-950">
                        {item.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{TYPE_LABELS[item.disputeType] ?? item.disputeType}</span>
                        <span>{formatDate(item.receivedAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 오른쪽: 상세 정보 및 히스토리 영역 */}
          <div className="lg:col-span-2">
            {selectedId && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {isDetailLoading ? (
                  <div className="p-12 text-center text-sm font-semibold text-slate-500">
                    상세 내용을 불러오는 중입니다.
                  </div>
                ) : detailError && !detail ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
                    <p className="mt-3 text-base font-bold text-slate-900">상세 로드 실패</p>
                    <p className="mt-1 text-sm text-slate-500">{detailError}</p>
                  </div>
                ) : detail ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-950">
                            {detail.title}
                          </h3>
                          <StatusBadge status={detail.status} />
                        </div>
                        <p className="font-mono text-xs text-slate-500">
                          주문번호: {detail.orderNo} | 이의제기 번호: #{detail.disputeId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-200 bg-white sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                      <div className="px-5 py-4">
                        <span className="mb-1 block text-xs text-slate-400">유형</span>
                        <span className="text-sm font-bold text-slate-900">
                          {TYPE_LABELS[detail.disputeType] ?? detail.disputeType}
                        </span>
                      </div>
                      <div className="px-5 py-4">
                        <span className="mb-1 block text-xs text-slate-400">요청 처리 사항</span>
                        <span className="text-sm font-bold text-slate-900">
                          {ACTION_LABELS[detail.requestedAction] ?? detail.requestedAction}
                        </span>
                      </div>
                      <div className="px-5 py-4">
                        <span className="mb-1 block text-xs text-slate-400">접수 일시</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatDate(detail.receivedAt)}
                        </span>
                      </div>
                    </div>

                    {/* 대화 히스토리 (isSeller 변수를 같이 넘겨서 나를 구분하게 함) */}
                    <div className="bg-slate-50/50 px-6 py-6">
                      <h4 className="mb-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        진행 및 답변 이력
                      </h4>

                      <div className="space-y-4">
                        <ResponseBubble
                          role="BUYER"
                          content={detail.buyerClaim}
                          createdAt={detail.receivedAt}
                          isSellerPage={isSeller}
                          initial
                        />

                        {detail.responses.map((response) => (
                          <ResponseBubble
                            key={response.responseId}
                            role={response.responderRole}
                            content={response.content}
                            createdAt={response.createdAt}
                            isSellerPage={isSeller}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-white px-6 py-5">
                      {canReply ? (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="reply-input" className="text-sm font-bold text-slate-800">
                              {isSeller ? "바이어에게 답변 작성" : "판매사에게 추가 답변 작성"}
                            </label>
                            <span className="text-xs text-slate-400">{reply.length}/3000자</span>
                          </div>
                          <textarea
                            id="reply-input"
                            rows={4}
                            value={reply}
                            onChange={(e) => setReply(e.target.value.slice(0, 3000))}
                            placeholder="명확하고 친절한 해결 방안이나 답변 내용을 작성해 주세요."
                            className="w-full resize-none rounded-md border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          {detailError && (
                            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                              {detailError}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
                            {!isSeller && detail.status === "WAITING_BUYER" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void resolveDispute()}
                                  className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-emerald-700 focus:outline-none"
                                >
                                  판매사 조치 수락
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAdminModalOpen(true)}
                                  className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 transition-colors hover:bg-amber-100 focus:outline-none"
                                >
                                  관리자 검토 요청
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => void submitReply()}
                              disabled={isSubmitting || reply.trim().length === 0}
                              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Send className="mr-1.5 h-4 w-4" />
                              {isSubmitting ? "등록 중..." : "답변 등록"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
                          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          <div className="font-medium">
                            {getWaitingMessage(detail.status, isSeller)}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 관리자 검토 요청 모달 */}
      {isAdminModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-review-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="flex items-center gap-1 text-xs font-black text-amber-700">
                  <ShieldAlert size={13} />
                  관리자 중재 요청
                </p>
                <h2
                  id="admin-review-modal-title"
                  className="mt-1 text-lg font-black text-slate-950"
                >
                  관리자 검토 요청 사유 작성
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  판매사의 답변이나 해결 조치로 문제가 해결되지 않은 구체적인 사유를 작성해주세요. 플랫폼 관리자가 중재 및 검토를 시작합니다.
                </p>
              </div>
              <button
                type="button"
                title="모달 닫기"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminReason("");
                }}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-5">
              <textarea
                rows={5}
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="예: 재배송 프로세스로 진행되었으나 온 상품에 여전히 동일 결함이 확인되어 중재 조치를 요청합니다."
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminReason("");
                }}
                className="h-10 flex-1 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void requestAdminReview()}
                disabled={adminReason.trim().length === 0}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-amber-600 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                검토 요청 제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span
          className={`inline-flex size-9 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DisputeStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/* ==========================================================================
   수정된 대화 버블 컴포넌트 (좌우 반전 및 나/상대방 색상 강조 로직 반영)
   ========================================================================== */
function ResponseBubble({
  role,
  content,
  createdAt,
  isSellerPage,
  initial = false,
}: {
  role: ResponderRole;
  content: string;
  createdAt: string;
  isSellerPage: boolean;
  initial?: boolean;
}) {
  const isAdmin = role === "ADMIN";

  // 현재 페이지 주인(=나) 인지 판별하는 플래그
  // 바이어페이지인데 바이어가 쓴 글이거나, 셀러페이지인데 셀러가 쓴 글이면 "나" 임
  const isMe = (!isSellerPage && role === "BUYER") || (isSellerPage && role === "SELLER");

  return (
    <div className={`flex w-full items-start gap-3 ${
      isAdmin ? "justify-start" : isMe ? "flex-row-reverse" : "flex-row"
    }`}>
      {/* 프로필 아바타 (관리자 글이거나 내가 아닐 때만 노출하여 더욱 메신저 느낌 구현) */}
      {!isMe && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm ${
          isAdmin ? "border-amber-200 bg-amber-100 text-amber-700" :
          role === "BUYER" ? "border-blue-200 bg-blue-100 text-blue-700" : "border-purple-200 bg-purple-100 text-purple-700"
        }`}>
          <User className="h-4 w-4" />
        </div>
      )}

      {/* 말풍선 바디 */}
      <div className={`max-w-[85%] rounded-lg border p-4 shadow-sm ${
        isAdmin ? "border-amber-200 bg-amber-50/70" :
        isMe ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700"
      }`}>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs font-bold ${isMe ? "text-blue-100" : "text-slate-900"}`}>
            {ROLE_LABELS[role]} {isMe && "(나)"}
            <span className={`ml-1 text-[11px] font-normal ${isMe ? "text-blue-200" : "text-slate-400"}`}>
              {initial ? "최초 접수 내용" : "답변 피드백"}
            </span>
          </span>
          <span className={`text-[11px] font-medium ${isMe ? "text-blue-200" : "text-slate-400"}`}>
            {formatDate(createdAt)}
          </span>
        </div>
        <p className={`whitespace-pre-wrap text-sm font-normal leading-6 ${isMe ? "text-white" : "text-slate-700"}`}>
          {content}
        </p>
      </div>
    </div>
  );
}

function getWaitingMessage(status: DisputeStatus, isSeller: boolean) {
  if (status === "RESOLVED") return "처리가 완료된 이의제기입니다.";
  if (status === "REJECTED") return "관리자 검토 후 기각된 이의제기입니다.";
  if (status === "CANCELED") return "취소된 이의제기입니다.";
  if (status === "REVIEWING") return "관리자가 내용을 중재 검토하고 있습니다. 조금만 기다려주세요.";
  if (status === "WAITING_BUYER") {
    return isSeller
      ? "바이어의 추가 조치 수락 또는 답변을 기다리고 있습니다."
      : "판매사의 답변이 접수되었습니다. 처리 방안을 확인하신 후 수락하거나 추가 의견을 등록해 주세요.";
  }
  if (status === "WAITING_SELLER" || status === "RECEIVED") {
    return isSeller
      ? "새로운 이의제기가 도달했습니다. 세부 내용을 검토하신 후 적절한 안내 및 피드백 답변을 작성해 주세요."
      : "판매사의 공식 답변을 기다리고 있습니다.";
  }
  return "현재 처리 프로세스를 확인해 주세요.";
}
