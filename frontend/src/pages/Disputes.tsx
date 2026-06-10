import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Image,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  Store,
  User,
  XCircle,
} from "lucide-react";

type DisputeStatus =
  | "RECEIVED"
  | "REVIEWING"
  | "WAITING_SELLER"
  | "PROCESSING"
  | "RESOLVED"
  | "REJECTED";

type DisputeType = "수량 부족" | "오염 / 하자" | "오배송" | "파손" | "기타";

type Dispute = {
  id: string;
  orderId: string;
  negotiationId?: string;
  title: string;
  type: DisputeType;
  status: DisputeStatus;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  files: string[];
  requestedAction: string;
  adminMemo?: string;
  result?: {
    type: string;
    amount?: number;
    completedAt: string;
  };
  steps: {
    label: string;
    time: string;
    done: boolean;
  }[];
};

const statusConfig: Record<
  DisputeStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  RECEIVED: {
    label: "접수 완료",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <FileText size={13} />,
  },
  REVIEWING: {
    label: "관리자 검토중",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock size={13} />,
  },
  WAITING_SELLER: {
    label: "공급사 답변 대기",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Store size={13} />,
  },
  PROCESSING: {
    label: "처리중",
    color: "text-primary",
    bg: "bg-secondary border-primary/20",
    icon: <ShieldCheck size={13} />,
  },
  RESOLVED: {
    label: "처리 완료",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: <CheckCircle size={13} />,
  },
  REJECTED: {
    label: "반려",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle size={13} />,
  },
};

const sampleDisputes: Dispute[] = [
  {
    id: "DSP-2024-001",
    orderId: "ORD-2024-0841",
    negotiationId: "NEG-2024-002",
    title: "블라우스 일부 상품 오염 접수",
    type: "오염 / 하자",
    status: "REVIEWING",
    buyerName: "스타일마켓㈜",
    sellerName: "르블랑 어패럴",
    createdAt: "2024.05.22 09:10",
    updatedAt: "2024.05.22 10:20",
    content:
      "입고 검수 과정에서 화이트 M 사이즈 3장에 오염이 확인되었습니다. 사진 첨부드립니다. 교환 또는 부분 환불 요청드립니다.",
    files: ["오염사진_1.jpg", "오염사진_2.jpg", "검수내역서.pdf"],
    requestedAction: "불량 수량 3장 교환 또는 부분 환불",
    adminMemo:
      "증빙 사진 확인 완료. 공급사에 불량 여부 확인 요청 예정입니다.",
    steps: [
      { label: "이의제기 접수", time: "2024.05.22 09:10", done: true },
      { label: "관리자 검토중", time: "2024.05.22 10:20", done: true },
      { label: "공급사 답변 요청", time: "—", done: false },
      { label: "처리 결과 안내", time: "—", done: false },
    ],
  },
  {
    id: "DSP-2024-002",
    orderId: "ORD-2024-0799",
    title: "플리츠 스커트 수량 부족",
    type: "수량 부족",
    status: "RESOLVED",
    buyerName: "온라인샵 패션픽",
    sellerName: "어반드레스",
    createdAt: "2024.05.15 14:30",
    updatedAt: "2024.05.17 11:00",
    content:
      "주문 수량은 총 45장이었으나 실제 입고 수량은 42장입니다. 부족 수량 3장에 대한 환불 요청드립니다.",
    files: ["입고수량확인서.pdf", "박스개봉사진.jpg"],
    requestedAction: "부족 수량 3장 환불",
    adminMemo:
      "공급사 확인 결과 포장 누락 인정. 부분 환불 처리 완료.",
    result: {
      type: "부분 환불 승인",
      amount: 45000,
      completedAt: "2024.05.17 11:00",
    },
    steps: [
      { label: "이의제기 접수", time: "2024.05.15 14:30", done: true },
      { label: "관리자 검토", time: "2024.05.15 15:10", done: true },
      { label: "공급사 답변 완료", time: "2024.05.16 10:40", done: true },
      { label: "부분 환불 완료", time: "2024.05.17 11:00", done: true },
    ],
  },
  {
    id: "DSP-2024-003",
    orderId: "ORD-2024-0802",
    negotiationId: "NEG-2024-001",
    title: "색상 오배송 접수",
    type: "오배송",
    status: "WAITING_SELLER",
    buyerName: "스타일마켓㈜",
    sellerName: "모아뜨",
    createdAt: "2024.05.18 16:20",
    updatedAt: "2024.05.19 09:00",
    content:
      "핑크 색상으로 주문한 원피스 일부가 블루 색상으로 배송되었습니다. 교환 가능 여부 확인 부탁드립니다.",
    files: ["주문서.pdf", "오배송사진.jpg"],
    requestedAction: "오배송 상품 교환",
    adminMemo:
      "주문서와 수령 사진 비교 완료. 공급사 답변 대기 중입니다.",
    steps: [
      { label: "이의제기 접수", time: "2024.05.18 16:20", done: true },
      { label: "관리자 검토 완료", time: "2024.05.19 09:00", done: true },
      { label: "공급사 답변 대기", time: "—", done: false },
      { label: "처리 결과 안내", time: "—", done: false },
    ],
  },
];

const filters = [
  { value: "ALL", label: "전체" },
  { value: "REVIEWING", label: "검토중" },
  { value: "WAITING_SELLER", label: "공급사 답변" },
  { value: "RESOLVED", label: "처리 완료" },
  { value: "REJECTED", label: "반려" },
];

export function Disputes() {
  const [selectedId, setSelectedId] = useState(sampleDisputes[0].id);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = sampleDisputes.filter((item) => {
    const matchFilter = filter === "ALL" || item.status === filter;
    const matchSearch =
      item.id.includes(search) ||
      item.orderId.includes(search) ||
      item.title.includes(search) ||
      item.buyerName.includes(search) ||
      item.sellerName.includes(search);

    return matchFilter && matchSearch;
  });

  const selected = sampleDisputes.find((item) => item.id === selectedId);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle size={24} className="text-primary" />
          이의제기
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          상품 수령 후 발생한 수량 부족, 하자, 오배송 등의 문제를 접수하고 처리 상태를 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center border border-border rounded px-3 py-2 gap-2 mb-3">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이의번호, 주문번호, 업체명 검색"
                className="text-sm outline-none flex-1"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    filter === item.value
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((item) => {
              const status = statusConfig[item.status];
              const active = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left bg-white border rounded-lg p-4 transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-700">
                      <AlertCircle size={11} />
                      {item.type}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${status.bg} ${status.color}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-foreground line-clamp-1">
                    {item.title}
                  </div>

                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {item.id} · {item.orderId}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    {item.buyerName} ↔ {item.sellerName}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-2">
                    최근 수정 {item.updatedAt}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a2e1a] to-[#2d4a35] text-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-white/15 border border-white/20 px-2 py-1 rounded">
                      이의제기
                    </span>
                    <span className="text-xs font-mono text-white/70">
                      {selected.id}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold">{selected.title}</h2>

                  <p className="text-sm text-white/70 mt-2">
                    관련 주문 {selected.orderId}
                    {selected.negotiationId && ` · 관련 협의 ${selected.negotiationId}`}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <div className="text-white/60 mb-1">현재 상태</div>
                  <div className="font-semibold">
                    {statusConfig[selected.status].label}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-border">
              <div className="p-4 border-r border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User size={13} />
                  바이어
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {selected.buyerName}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Store size={13} />
                  공급사
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {selected.sellerName}
                </div>
              </div>
            </div>

            <div className="p-5 bg-muted/20 space-y-5">
              <section className="bg-white border border-border rounded-lg p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <FileText size={15} className="text-primary" />
                  접수 내용
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      이의 유형
                    </div>
                    <div className="font-semibold text-foreground">
                      {selected.type}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      요청 처리
                    </div>
                    <div className="font-semibold text-foreground">
                      {selected.requestedAction}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      접수일시
                    </div>
                    <div className="font-mono text-foreground">
                      {selected.createdAt}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      최근 수정
                    </div>
                    <div className="font-mono text-foreground">
                      {selected.updatedAt}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    상세 내용
                  </div>
                  <div className="bg-secondary/50 rounded px-3 py-3 text-sm text-foreground leading-relaxed">
                    {selected.content}
                  </div>
                </div>
              </section>

              <section className="bg-white border border-border rounded-lg p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Image size={15} className="text-primary" />
                  증빙자료
                </h3>

                <div className="flex flex-wrap gap-2">
                  {selected.files.map((file) => (
                    <button
                      key={file}
                      className="border border-border bg-secondary/40 hover:border-primary hover:text-primary text-xs px-3 py-2 rounded transition-colors flex items-center gap-1.5"
                    >
                      <FileText size={12} />
                      {file}
                    </button>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-border rounded-lg p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Clock size={15} className="text-primary" />
                  처리 진행 상태
                </h3>

                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-muted" />
                  <div className="space-y-4">
                    {selected.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            step.done ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          {step.done ? (
                            <CheckCircle size={14} className="text-white" />
                          ) : (
                            <Clock size={14} className="text-[#bbb]" />
                          )}
                        </div>

                        <div className="pt-1">
                          <div
                            className={`text-sm font-semibold ${
                              step.done
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {step.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {selected.adminMemo && (
                <section className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-bold text-sm text-blue-800 mb-2 flex items-center gap-2">
                    <ShieldCheck size={15} />
                    관리자 검토 메모
                  </h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {selected.adminMemo}
                  </p>
                </section>
              )}

              {selected.result && (
                <section className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <h3 className="font-bold text-sm text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={15} />
                    처리 결과
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">처리 유형</span>
                      <span className="font-semibold text-green-900">
                        {selected.result.type}
                      </span>
                    </div>

                    {selected.result.amount && (
                      <div className="flex justify-between">
                        <span className="text-green-700">환불 금액</span>
                        <span className="font-semibold text-green-900">
                          ₩{selected.result.amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-green-700">처리 완료일</span>
                      <span className="font-mono text-green-900">
                        {selected.result.completedAt}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  이의제기 내역은 관리자 검토 및 분쟁 처리 이력으로 보관됩니다.
                </div>

                {selected.negotiationId && (
                  <Link
                    to="/negotiations"
                    className="border border-border text-foreground hover:border-primary hover:text-primary px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    관련 협의내역 보기
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}