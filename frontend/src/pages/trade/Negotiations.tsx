import { useState, useEffect } from "react";
import api from "@/api/axios";

import {
  MessageSquare,
  Search,
  Package,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Store,
  Paperclip,
  X,
  Plus,
  ShieldCheck,
  Download,
} from "lucide-react";

type TargetType = "ORDER" | "QUOTE";
type NegotiationStatus = "PENDING" | "APPROVED" | "REVISION" | "DONE";
type WriterType = "BUYER" | "SELLER" | "ADMIN";

type NegotiationItem = {
  id: string;
  writer: WriterType;
  writerName: string;
  status: NegotiationStatus;
  title: string;
  content: string;
  createdAt: string;
  approvedAt?: string;
  adminMemo?: string;
  files: string[];
};

type Negotiation = {
  id: string;
  targetType: TargetType;
  targetId: string;
  title: string;
  buyerName: string;
  sellerName: string;
  status: NegotiationStatus;
  lastUpdatedAt: string;
};

const statusConfig: Record<
  NegotiationStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "관리자 검토중",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock size={13} />,
  },
  APPROVED: {
    label: "전달 완료",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <ShieldCheck size={13} />,
  },
  REVISION: {
    label: "수정 요청",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <AlertCircle size={13} />,
  },
  DONE: {
    label: "협의 완료",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: <CheckCircle size={13} />,
  },
};

const sampleNegotiations: Negotiation[] = [
  {
    id: "NEG-2024-001",
    targetType: "QUOTE",
    targetId: "QT-2024-0142",
    title: "여성 린넨 오버핏 블라우스 견적 단가 협의",
    buyerName: "스타일마켓㈜",
    sellerName: "르블랑 어패럴",
    status: "APPROVED",
    lastUpdatedAt: "2024.05.20 14:30",
    items: [
      {
        id: "ITEM-001",
        writer: "BUYER",
        writerName: "스타일마켓㈜",
        status: "APPROVED",
        title: "수량 증가 시 단가 조정 요청",
        content:
          "200장 기준 단가가 14,000원으로 확인됩니다. 300장 주문 시 추가 할인 가능 여부를 확인 부탁드립니다.",
        createdAt: "2024.05.20 10:12",
        approvedAt: "2024.05.20 10:40",
        adminMemo: "외부 연락처 없음. 가격 협의 내용 정상 확인 후 전달.",
        files: ["작업지시서_v1.xlsx", "블라우스_참고이미지.zip"],
      },
      {
        id: "ITEM-002",
        writer: "SELLER",
        writerName: "르블랑 어패럴",
        status: "APPROVED",
        title: "300장 기준 수정 견적 전달",
        content:
          "300장 이상 주문 시 장당 13,500원까지 조정 가능합니다. 단, 샘플 확인 후 본 생산 진행 조건입니다.",
        createdAt: "2024.05.20 13:10",
        approvedAt: "2024.05.20 14:30",
        adminMemo: "수정 견적서 첨부 확인 완료.",
        files: ["수정견적서_QT-2024-0142.pdf"],
      },
    ],
  },
  {
    id: "NEG-2024-002",
    targetType: "ORDER",
    targetId: "ORD-2024-0841",
    title: "출고 일정 및 포장 방식 협의",
    buyerName: "스타일마켓㈜",
    sellerName: "르블랑 어패럴",
    status: "PENDING",
    lastUpdatedAt: "2024.05.21 09:40",
    items: [
      {
        id: "ITEM-003",
        writer: "SELLER",
        writerName: "르블랑 어패럴",
        status: "APPROVED",
        title: "원단 입고 지연 안내",
        content:
          "원단 입고가 하루 지연되어 출고일이 1일 늦어질 수 있습니다. 납기 변경 가능 여부 확인 부탁드립니다.",
        createdAt: "2024.05.21 09:10",
        approvedAt: "2024.05.21 09:25",
        files: ["입고지연_공급사확인서.pdf"],
      },
      {
        id: "ITEM-004",
        writer: "BUYER",
        writerName: "스타일마켓㈜",
        status: "PENDING",
        title: "포장 방식 추가 요청",
        content:
          "출고 지연은 괜찮습니다. 대신 컬러별로 별도 포장 후 박스 라벨에 컬러명을 표기해 주세요.",
        createdAt: "2024.05.21 09:40",
        files: ["포장라벨_예시.png"],
      },
    ],
  },
  {
    id: "NEG-2024-003",
    targetType: "ORDER",
    targetId: "ORD-2024-0791",
    title: "주문 취소 전 수량 조정 협의",
    buyerName: "온라인샵 패션픽",
    sellerName: "어반드레스",
    status: "DONE",
    lastUpdatedAt: "2024.05.18 16:20",
    items: [
      {
        id: "ITEM-005",
        writer: "BUYER",
        writerName: "온라인샵 패션픽",
        status: "APPROVED",
        title: "수량 조정 요청",
        content: "45장에서 30장으로 수량 조정이 가능한지 문의드립니다.",
        createdAt: "2024.05.18 15:30",
        approvedAt: "2024.05.18 15:45",
        files: [],
      },
      {
        id: "ITEM-006",
        writer: "SELLER",
        writerName: "어반드레스",
        status: "APPROVED",
        title: "최소 생산 수량 미달 안내",
        content: "최소 생산 수량 미달로 30장 진행은 어렵습니다.",
        createdAt: "2024.05.18 16:20",
        approvedAt: "2024.05.18 16:40",
        files: [],
      },
    ],
  },
];

export function Negotiations() {

  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedId, setSelectedId] = useState<String | null>(null);
  const [filter, setFilter] = useState<"ALL" | TargetType>("ALL");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    fileName: "",
  });

useEffect(() => {
  const fetchNegotiations = async () => {
    const data = await api.get<Negotiation[]>("/negotiations");

    setNegotiations(data);

    if (data.length > 0) {
      setSelectedId(data[0].id);
    }
  };

  fetchNegotiations();
}, []);

  const filtered = negotiations.filter((item) => {
    const matchFilter = filter === "ALL" || item.targetType === filter;
    const matchSearch =
      item.title.includes(search) ||
      item.targetId.includes(search) ||
      item.buyerName.includes(search) ||
      item.sellerName.includes(search);

    return matchFilter && matchSearch;
  });

  const selected = negotiations.find((item) => item.id === selectedId);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    alert("협의 요청이 등록되었습니다. 관리자 검토 후 상대방에게 전달됩니다.");
    setShowCreateModal(false);
    setForm({ title: "", content: "", fileName: "" });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={24} className="text-primary" />
          협의내역
        </h1>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Plus size={15} />
          협의 요청 작성
        </button>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center border border-border rounded px-3 py-2 gap-2 mb-3">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="주문번호, 견적번호, 업체명 검색"
                className="text-sm outline-none flex-1"
              />
            </div>

            <div className="flex gap-2">
              {[
                { value: "ALL", label: "전체" },
                { value: "ORDER", label: "주문" },
                { value: "QUOTE", label: "견적" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value as "ALL" | TargetType)}
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
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        item.targetType === "ORDER"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-purple-50 border-purple-200 text-purple-700"
                      }`}
                    >
                      {item.targetType === "ORDER" ? (
                        <Package size={11} />
                      ) : (
                        <FileText size={11} />
                      )}
                      {item.targetType === "ORDER" ? "주문" : "견적"}
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
                    {item.targetId}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    {item.buyerName} ↔ {item.sellerName}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-2">
                    최근 수정 {item.lastUpdatedAt}
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
                      {selected.targetType === "ORDER" ? "주문 협의" : "견적 협의"}
                    </span>
                    <span className="text-xs font-mono text-white/70">
                      {selected.targetId}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold">{selected.title}</h2>

                  <p className="text-sm text-white/70 mt-2">
                    바이어와 셀러가 작성한 협의 요청은 관리자 검토 후 상대방에게 전달됩니다.
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
                  셀러
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {selected.sellerName}
                </div>
              </div>
            </div>

            <div className="p-5 bg-muted/20 min-h-[480px]">
              <div className="space-y-4">
                {selected.items.map((item, index) => {
                  const status = statusConfig[item.status];

                  return (
                    <div key={item.id} className="relative">
                      {index !== selected.items.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-[-18px] w-px bg-border" />
                      )}

                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border bg-white z-10 ${
                            item.writer === "BUYER"
                              ? "text-blue-700 border-blue-200"
                              : item.writer === "SELLER"
                              ? "text-green-700 border-green-200"
                              : "text-primary border-primary/30"
                          }`}
                        >
                          {item.writer === "BUYER" ? (
                            <User size={16} />
                          ) : item.writer === "SELLER" ? (
                            <Store size={16} />
                          ) : (
                            <ShieldCheck size={16} />
                          )}
                        </div>

                        <div className="flex-1 bg-white border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground">
                                  {item.writerName}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${status.bg} ${status.color}`}
                                >
                                  {status.icon}
                                  {status.label}
                                </span>
                              </div>

                              <h3 className="font-bold text-sm text-foreground">
                                {item.title}
                              </h3>
                            </div>

                            <div className="text-[11px] text-muted-foreground font-mono">
                              {item.createdAt}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {item.content}
                          </p>

                          {item.files.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Paperclip size={12} />
                                첨부파일
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {item.files.map((file) => (
                                  <button
                                    key={file}
                                    className="border border-border bg-secondary/40 hover:border-primary hover:text-primary text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                                  >
                                    <Download size={12} />
                                    {file}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.adminMemo && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                              <div className="font-semibold mb-1 flex items-center gap-1">
                                <ShieldCheck size={12} />
                                관리자 검토 메모
                              </div>
                              {item.adminMemo}
                            </div>
                          )}

                          {item.approvedAt && (
                            <div className="mt-2 text-[11px] text-muted-foreground">
                              관리자 승인일시 {item.approvedAt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border p-4 bg-white flex items-center justify-between gap-3">
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                협의 요청은 바로 상대방에게 전달되지 않고, 관리자 검토 후 전달됩니다.
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                협의 추가
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={26} className="text-primary" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">
              협의 요청 작성
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              작성한 협의 내용과 첨부파일은 관리자 검토 후 상대방에게 전달됩니다.
            </p>

            <div className="bg-secondary/60 border border-border rounded p-3 text-xs text-muted-foreground mb-5">
              <div className="font-semibold text-foreground mb-1">
                {selected.targetType === "ORDER" ? "주문번호" : "견적번호"}{" "}
                {selected.targetId}
              </div>
              <div>
                {selected.buyerName} ↔ {selected.sellerName}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  제목
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="예: 수량 조정 요청, 납기 변경 문의"
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  협의 내용
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  rows={5}
                  placeholder="협의할 내용을 작성해 주세요."
                  className="w-full border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  첨부파일
                </label>
                <input
                  value={form.fileName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileName: e.target.value }))
                  }
                  placeholder="예: 작업지시서.xlsx, 샘플사진.zip"
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <div className="text-[11px] text-muted-foreground mt-1">
                  실제 구현 시 S3 업로드 후 파일 URL을 저장하면 됩니다.
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700 mt-5">
              외부 연락처, 계좌번호, 직거래 유도 문구는 관리자 검토 과정에서 반려될 수 있습니다.
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-border text-foreground hover:border-primary hover:text-primary py-2.5 rounded text-sm font-medium transition-colors"
              >
                취소
              </button>

              <button
                onClick={handleSubmit}
                disabled={!form.title.trim() || !form.content.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Send size={14} />
                관리자 검토 요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}