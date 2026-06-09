import { useState } from "react";
import { Truck, Shield, ChevronDown, ChevronUp, Calendar, User, Package, MapPin, Plane, Ship } from "lucide-react";

type ShippingQuote = {
  id: string;
  date: string;
  buyer: string;
  email: string;
  method: "항공" | "해상" | "특송";
  weight?: string;
  cbm?: string;
  origin: string;
  destination: string;
  detail: string;
  status: "신규" | "견적작성중" | "견적발송" | "완료" | "취소";
};

const quotes: ShippingQuote[] = [
  {
    id: "SHP-2024-0089",
    date: "2024.03.22 11:18",
    buyer: "글로벌뷰티㈜",
    email: "buyer@globalbeauty.com",
    method: "항공",
    weight: "150kg",
    origin: "인천, 한국",
    destination: "뉴욕, 미국",
    detail: "화장품 샘플 긴급 배송. 3월 27일까지 도착 필요. 온도 조절 포장 필요 여부 문의",
    status: "신규",
  },
  {
    id: "SHP-2024-0082",
    date: "2024.03.19 14:35",
    buyer: "KBeauty USA Inc",
    email: "procurement@kbeautyusa.com",
    method: "해상",
    cbm: "4.5 CBM",
    origin: "부산, 한국",
    destination: "LA, 미국",
    detail: "시트 마스크 10,000개 정규 배송. FCL 견적 요청. 항구 통관 대행 포함 여부 확인",
    status: "견적발송",
  },
  {
    id: "SHP-2024-0076",
    date: "2024.03.17 09:52",
    buyer: "뷰티월드",
    email: "info@beautyworld.jp",
    method: "특송",
    weight: "25kg",
    origin: "서울, 한국",
    destination: "도쿄, 일본",
    detail: "샘플 긴급 배송. DHL Express 이용 희망. 내일까지 발송 가능 여부",
    status: "견적작성중",
  },
  {
    id: "SHP-2024-0071",
    date: "2024.03.14 16:20",
    buyer: "코스메틱홀딩스",
    email: "orders@cosmeticholdings.com.au",
    method: "항공",
    weight: "320kg",
    origin: "인천, 한국",
    destination: "시드니, 호주",
    detail: "정기 배송. 클렌징폼 3,000개. TGA 통관 서류 작성 대행 필요",
    status: "완료",
  },
  {
    id: "SHP-2024-0065",
    date: "2024.03.10 10:44",
    buyer: "아시아뷰티",
    email: "contact@asiabeauty.sg",
    method: "해상",
    cbm: "2.8 CBM",
    origin: "인천, 한국",
    destination: "싱가포르",
    detail: "헤어케어 제품 1,500개. LCL 배송. 납기 여유 있음 (4주 이내)",
    status: "취소",
  },
];

const statusConfig = {
  신규: { bg: "bg-blue-50 border-blue-200", color: "text-blue-700" },
  견적작성중: { bg: "bg-purple-50 border-purple-200", color: "text-purple-700" },
  견적발송: { bg: "bg-green-50 border-green-200", color: "text-green-700" },
  완료: { bg: "bg-muted border-border", color: "text-muted-foreground" },
  취소: { bg: "bg-red-50 border-red-200", color: "text-red-700" },
};

const methodIcons = {
  항공: <Plane size={14} />,
  해상: <Ship size={14} />,
  특송: <Truck size={14} />,
};

export function AdminShippingQuotes() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("전체");

  const filtered = quotes.filter((q) => filterStatus === "전체" || q.status === filterStatus);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Admin Header */}
      

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "전체", count: quotes.length, color: "bg-muted" },
          { label: "신규", count: quotes.filter(q => q.status === "신규").length, color: "bg-blue-50 border border-blue-200" },
          { label: "견적작성중", count: quotes.filter(q => q.status === "견적작성중").length, color: "bg-purple-50 border border-purple-200" },
          { label: "견적발송", count: quotes.filter(q => q.status === "견적발송").length, color: "bg-green-50 border border-green-200" },
          { label: "완료/취소", count: quotes.filter(q => q.status === "완료" || q.status === "취소").length, color: "bg-muted border border-border" },
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

      {/* Quotes List */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            운임 견적 요청 목록
          </h2>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((quote) => {
            const isExpanded = expandedId === quote.id;
            const statusStyle = statusConfig[quote.status];

            return (
              <div key={quote.id}>
                {/* Quote Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-sm text-foreground">{quote.id}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.color}`}>
                        {quote.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-white text-foreground">
                        {methodIcons[quote.method]}
                        {quote.method}
                      </span>
                    </div>
                    <div className="text-sm text-foreground font-medium mb-1">
                      {quote.origin} → {quote.destination}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={11} />{quote.buyer}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{quote.date}</span>
                      {quote.weight && <span className="flex items-center gap-1"><Package size={11} />{quote.weight}</span>}
                      {quote.cbm && <span className="flex items-center gap-1"><Package size={11} />{quote.cbm}</span>}
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
                            <span className="font-medium text-foreground">{quote.buyer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">이메일</span>
                            <span className="font-mono text-xs text-foreground">{quote.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">요청일시</span>
                            <span className="font-mono text-xs text-foreground">{quote.date}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">배송 정보</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">배송 방법</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                              {methodIcons[quote.method]}
                              {quote.method}
                            </span>
                          </div>
                          {quote.weight && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">무게</span>
                              <span className="font-medium text-foreground">{quote.weight}</span>
                            </div>
                          )}
                          {quote.cbm && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">부피</span>
                              <span className="font-medium text-foreground">{quote.cbm}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><MapPin size={11} />출발</span>
                            <span className="font-medium text-foreground">{quote.origin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><MapPin size={11} />도착</span>
                            <span className="font-medium text-primary">{quote.destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">상세 요구사항</h4>
                      <div className="bg-white border border-border rounded p-3 text-sm text-foreground leading-relaxed">
                        {quote.detail}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      {quote.status === "신규" && (
                        <button className="bg-primary hover:bg-primary/90 text-white text-xs px-4 py-2 rounded font-semibold transition-colors">
                          견적 작성 시작
                        </button>
                      )}
                      {quote.status === "견적작성중" && (
                        <button className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded font-semibold transition-colors">
                          견적서 발송
                        </button>
                      )}
                      <button className="border border-border text-muted-foreground hover:border-primary hover:text-primary text-xs px-4 py-2 rounded font-medium transition-colors">
                        바이어에게 이메일 발송
                      </button>
                      <button className="border border-border text-muted-foreground hover:border-primary hover:text-primary text-xs px-4 py-2 rounded font-medium transition-colors">
                        견적서 PDF 다운로드
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
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <div>해당 상태의 운임 견적 요청이 없습니다</div>
        </div>
      )}
    </div>
  );
}
