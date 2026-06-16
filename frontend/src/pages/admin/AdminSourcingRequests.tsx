import { useState } from "react";
import { FileText, Shield, ChevronDown, ChevronUp, Calendar, User, Package, DollarSign, MapPin, Send, X, CheckCircle2 } from "lucide-react";

type SourcingRequest = {
  id: string;
  date: string;
  buyer: string;
  email: string;
  product: string;
  quantity: string;
  budget: string;
  country: string;
  detail: string;
  status: "신규" | "검토중" | "견적발송" | "완료" | "취소";
};

type Supplier = {
  id: string;
  name: string;
  category: string;
  rating: number;
  responseRate: string;
};

const requests: SourcingRequest[] = [
  {
    id: "SRC-2024-0124",
    date: "2024.03.21 14:32",
    buyer: "글로벌뷰티㈜",
    email: "buyer@globalbeauty.com",
    product: "비타민C 세럼 30mL OEM",
    quantity: "2,000개",
    budget: "$15,000 ~ $20,000",
    country: "한국",
    detail: "FDA 인증 필요, 비건 성분 사용, 유리병 패키징 희망. 샘플 10개 먼저 발송 가능 여부 문의",
    status: "신규",
  },
  {
    id: "SRC-2024-0118",
    date: "2024.03.18 10:15",
    buyer: "KBeauty USA Inc",
    email: "procurement@kbeautyusa.com",
    product: "시트 마스크 (콜라겐/히알루론산)",
    quantity: "10,000개",
    budget: "$25,000",
    country: "한국",
    detail: "FDA 등록된 제조사만 가능. 개별 포장 필수. 납기: 4월 말까지",
    status: "견적발송",
  },
  {
    id: "SRC-2024-0112",
    date: "2024.03.15 16:48",
    buyer: "뷰티월드",
    email: "info@beautyworld.jp",
    product: "쿠션 파운데이션 5종 (색상별)",
    quantity: "500개/색상 (총 2,500개)",
    budget: "$30,000 ~ $40,000",
    country: "한국",
    detail: "일본 화장품법 준수, MSDS 자료 필요, 아시안 스킨톤 맞춤 색상",
    status: "검토중",
  },
  {
    id: "SRC-2024-0105",
    date: "2024.03.10 09:22",
    buyer: "코스메틱홀딩스",
    email: "orders@cosmeticholdings.com.au",
    product: "클렌징폼 민감성 피부용 150mL",
    quantity: "3,000개",
    budget: "$12,000",
    country: "무관",
    detail: "저자극 성분, 향료 무첨가, TGA 등록 가능 여부 확인 필요",
    status: "완료",
  },
  {
    id: "SRC-2024-0098",
    date: "2024.03.05 11:54",
    buyer: "아시아뷰티",
    email: "contact@asiabeauty.sg",
    product: "헤어 에센스 오일 50mL",
    quantity: "1,500개",
    budget: "$10,000 ~ $15,000",
    country: "한국",
    detail: "아르간 오일 기반, 펌프형 용기, HSA 등록 가능 업체",
    status: "취소",
  },
];

const suppliers: Supplier[] = [
  { id: "SUP-001", name: "코스메틱랩", category: "스킨케어 OEM", rating: 4.8, responseRate: "95%" },
  { id: "SUP-002", name: "뷰티팩토리", category: "시트마스크 전문", rating: 4.9, responseRate: "98%" },
  { id: "SUP-003", name: "메이크업프로", category: "색조화장품", rating: 4.7, responseRate: "92%" },
  { id: "SUP-004", name: "그린케어", category: "천연/비건 화장품", rating: 4.9, responseRate: "97%" },
  { id: "SUP-005", name: "헤어뷰티", category: "헤어케어 전문", rating: 4.6, responseRate: "90%" },
  { id: "SUP-006", name: "글로벌코스", category: "OEM/ODM 종합", rating: 4.8, responseRate: "94%" },
];

const statusConfig = {
  신규: { bg: "bg-blue-50 border-blue-200", color: "text-blue-700" },
  검토중: { bg: "bg-purple-50 border-purple-200", color: "text-purple-700" },
  견적발송: { bg: "bg-green-50 border-green-200", color: "text-green-700" },
  완료: { bg: "bg-muted border-border", color: "text-muted-foreground" },
  취소: { bg: "bg-red-50 border-red-200", color: "text-red-700" },
};

export function AdminSourcingRequests() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SourcingRequest | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const filtered = requests.filter((r) => filterStatus === "전체" || r.status === filterStatus);

  const openSupplierModal = (request: SourcingRequest) => {
    setSelectedRequest(request);
    setSelectedSuppliers([]);
    setIsSupplierModalOpen(true);
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const sendToSuppliers = () => {
    if (selectedSuppliers.length === 0) return;

    setIsSupplierModalOpen(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    setSelectedSuppliers([]);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Admin Header */}
      

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "전체", count: requests.length, color: "bg-muted" },
          { label: "신규", count: requests.filter(r => r.status === "신규").length, color: "bg-blue-50 border border-blue-200" },
          { label: "검토중", count: requests.filter(r => r.status === "검토중").length, color: "bg-purple-50 border border-purple-200" },
          { label: "견적발송", count: requests.filter(r => r.status === "견적발송").length, color: "bg-green-50 border border-green-200" },
          { label: "완료/취소", count: requests.filter(r => r.status === "완료" || r.status === "취소").length, color: "bg-muted border border-border" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setFilterStatus(stat.label === "완료/취소" ? "전체" : stat.label)}
            className={`${stat.color} rounded-lg p-4 text-center hover:shadow-md transition-all ${filterStatus === stat.label ? "ring-2 ring-primary" : ""}`}
          >
            <div className="text-2xl font-bold font-mono text-foreground">{stat.count}</div>
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
        <div className="divide-y divide-border">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            const statusStyle = statusConfig[req.status];

            return (
              <div key={req.id}>
                {/* Request Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-sm text-foreground">{req.id}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.color}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-sm text-foreground font-medium mb-1">{req.product}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={11} />{req.buyer}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{req.date}</span>
                      <span className="flex items-center gap-1"><Package size={11} />{req.quantity}</span>
                      <span className="flex items-center gap-1"><DollarSign size={11} />{req.budget}</span>
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
                            <span className="font-medium text-foreground">{req.buyer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">이메일</span>
                            <span className="font-mono text-xs text-foreground">{req.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">요청일시</span>
                            <span className="font-mono text-xs text-foreground">{req.date}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">제품 정보</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">제품명</span>
                            <span className="font-medium text-foreground">{req.product}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">수량</span>
                            <span className="font-medium text-foreground">{req.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">예산</span>
                            <span className="font-medium text-primary">{req.budget}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><MapPin size={11} />선호 국가</span>
                            <span className="font-medium text-foreground">{req.country}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">상세 요구사항</h4>
                      <div className="bg-white border border-border rounded p-3 text-sm text-foreground leading-relaxed">
                        {req.detail}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      {req.status === "신규" && (
                        <button className="bg-primary hover:bg-primary/90 text-white text-xs px-4 py-2 rounded font-semibold transition-colors">
                          검토중으로 변경
                        </button>
                      )}
                      {(req.status === "신규" || req.status === "검토중") && (
                        <button
                          onClick={() => openSupplierModal(req)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded font-semibold transition-colors flex items-center gap-2"
                        >
                          <Send size={14} />
                          업체에게 요청서 전달
                        </button>
                      )}
                      <button className="border border-border text-muted-foreground hover:border-primary hover:text-primary text-xs px-4 py-2 rounded font-medium transition-colors">
                        바이어에게 이메일 발송
                      </button>
                      <button className="border border-red-300 text-red-600 hover:bg-red-50 text-xs px-4 py-2 rounded font-medium transition-colors ml-auto">
                        요청 취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <div>해당 상태의 소싱 요청서가 없습니다</div>
        </div>
      )}

      {/* Supplier Selection Modal */}
      {isSupplierModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10">
              <div>
                <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Send size={20} className="text-primary" />
                  업체에게 소싱 요청서 전달
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRequest.id} — {selectedRequest.product}
                </p>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Request Summary */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">바이어</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedRequest.buyer}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">수량</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedRequest.quantity}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">예산</span>
                  <div className="font-medium text-primary mt-0.5">{selectedRequest.budget}</div>
                </div>
              </div>
            </div>

            {/* Supplier List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-3">
                <h3 className="font-semibold text-sm text-foreground mb-1">전달할 업체 선택</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedSuppliers.length}개 업체 선택됨
                </p>
              </div>
              <div className="space-y-2">
                {suppliers.map((supplier) => {
                  const isSelected = selectedSuppliers.includes(supplier.id);
                  return (
                    <div
                      key={supplier.id}
                      onClick={() => toggleSupplier(supplier.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-foreground">{supplier.name}</h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {supplier.id}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={16} className="text-primary" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{supplier.category}</div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="font-semibold text-foreground">{supplier.rating}</span>
                            </span>
                            <span className="text-muted-foreground">
                              응답률 <span className="font-semibold text-green-600">{supplier.responseRate}</span>
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">선택된 업체:</span>{" "}
                <span className="font-bold text-primary">{selectedSuppliers.length}개</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="border border-border text-muted-foreground hover:border-primary hover:text-primary px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={sendToSuppliers}
                  disabled={selectedSuppliers.length === 0}
                  className={`px-6 py-2 rounded text-sm font-semibold transition-all flex items-center gap-2 ${
                    selectedSuppliers.length > 0
                      ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Send size={14} />
                  {selectedSuppliers.length}개 업체에게 전달
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom z-50">
          <CheckCircle2 size={24} />
          <div>
            <div className="font-semibold">소싱 요청서 전달 완료</div>
            <div className="text-sm text-green-100">선택한 업체에게 요청서가 전달되었습니다</div>
          </div>
        </div>
      )}
    </div>
  );
}
