import { useState } from "react";
import { Link } from "react-router";
import {
  Clock, Users, Package, ChevronRight, X,
  Zap, AlertTriangle, Calendar, Search, Filter, Tag,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
interface ReadyRequest {
  id: string;
  productName: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  deliveryDate: string; // YYYY-MM-DD
  imageUrl?: string;
  category: string;
  bidCount: number;
  buyerName: string;
}

interface BidForm {
  unitPrice: string;
  availableDate: string;
  comment: string;
}

// 내가 제출한 견적 저장 타입
interface MyBid {
  requestId: string;
  unitPrice: string;
  availableDate: string;
  comment: string;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────
const today = new Date();
const daysLater = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const DUMMY: ReadyRequest[] = [
  {
    id: "REQ-001", productName: "여성 린넨 와이드 팬츠", detail: "아이보리/베이지 컬러, S~XL 각 50장. 허리 밴딩 처리. https://item.kakao.com/example",
    quantity: 200, unitPrice: 18000, deliveryDate: daysLater(1), imageUrl: "", category: "하의", bidCount: 3, buyerName: "스타일피크",
  },
  {
    id: "REQ-002", productName: "플리츠 미디 스커트", detail: "블랙/네이비. 사이즈 S/M/L 각 70장. 허리 고무줄 처리.",
    quantity: 210, unitPrice: 22000, deliveryDate: daysLater(0), imageUrl: "", category: "하의", bidCount: 7, buyerName: "트렌드온",
  },
  {
    id: "REQ-003", productName: "크롭 볼레로 가디건", detail: "화이트, 베이지 2컬러. S~XL 혼합 100장. 소매 리브 처리.",
    quantity: 100, unitPrice: 25000, deliveryDate: daysLater(3), imageUrl: "", category: "상의", bidCount: 2, buyerName: "모멘트클로젯",
  },
  {
    id: "REQ-004", productName: "스트라이프 오버핏 셔츠", detail: "블루/화이트 스트라이프. 남녀공용 M~XXL. 면100%.",
    quantity: 150, unitPrice: 19000, deliveryDate: daysLater(5), imageUrl: "", category: "상의", bidCount: 5, buyerName: "데일리룩",
  },
  {
    id: "REQ-005", productName: "슬링백 뮬 힐", detail: "베이지/블랙 2컬러. 225~250 사이즈. 굽 높이 5cm.",
    quantity: 80, unitPrice: 32000, deliveryDate: daysLater(7), imageUrl: "", category: "액세서리", bidCount: 1, buyerName: "슈즈팩토리",
  },
  {
    id: "REQ-006", productName: "테리 집업 후드", detail: "오트밀/차콜. S~2XL. 프리미엄 테리 소재.",
    quantity: 300, unitPrice: 35000, deliveryDate: daysLater(2), imageUrl: "", category: "상의", bidCount: 4, buyerName: "캐주얼랩",
  },
  {
    id: "REQ-007", productName: "A라인 플레어 원피스", detail: "플로럴 패턴. S/M/L 각 60장. 안감 있음.",
    quantity: 180, unitPrice: 28000, deliveryDate: daysLater(10), imageUrl: "", category: "원피스/세트", bidCount: 6, buyerName: "로맨틱무드",
  },
  {
    id: "REQ-008", productName: "하이웨이스트 스키니 데님", detail: "인디고/블랙. 24~31인치. 스트레치 원단.",
    quantity: 250, unitPrice: 29000, deliveryDate: daysLater(14), imageUrl: "", category: "하의", bidCount: 9, buyerName: "진스트리트",
  },
];

const CATEGORIES = ["전체", "상의", "하의", "원피스/세트", "아우터", "액세서리"];

// ── URL 자동 링크 ─────────────────────────────────────────────────────
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className="text-primary underline break-all hover:text-primary/70 transition-colors">
        {part}
      </a>
    ) : part
  );
}

// ── D-day 유틸 ────────────────────────────────────────────────────────
function getDday(dateStr: string): { label: string; level: "urgent" | "soon" | "normal" } {
  const diff = Math.ceil((new Date(dateStr).getTime() - today.setHours(0,0,0,0)) / 86400000);
  if (diff <= 0) return { label: "당일 배송 필요", level: "urgent" };
  if (diff === 1) return { label: "D-1 마감임박", level: "urgent" };
  if (diff <= 3) return { label: `D-${diff} 임박`, level: "soon" };
  return { label: `D-${diff}`, level: "normal" };
}

// ── 단가 제시 모달 ────────────────────────────────────────────────────
function BidModal({
  request, existingBid, onClose, onSubmit,
}: {
  request: ReadyRequest;
  existingBid: MyBid | null;
  onClose: () => void;
  onSubmit: (bid: MyBid) => void;
}) {
  const [form, setForm] = useState<BidForm>(
    existingBid
      ? { unitPrice: existingBid.unitPrice, availableDate: existingBid.availableDate, comment: existingBid.comment }
      : { unitPrice: "", availableDate: "", comment: "" }
  );
  const [done, setDone] = useState(false);
  const isEdit = !!existingBid;

  const canSubmit = form.unitPrice && form.availableDate;

  const handleSubmit = () => {
    const bid: MyBid = { requestId: request.id, ...form };
    console.log(isEdit ? "견적 수정" : "견적 제출", bid);
    onSubmit(bid);
    setDone(true);
  };

  const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden">

        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">{request.id}</div>
            <h3 className="font-bold text-foreground text-base">{request.productName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">제안완료</span>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={22} className="text-green-500" />
            </div>
            <div className="font-bold text-foreground mb-1">{isEdit ? "견적 수정 완료!" : "견적 제출 완료!"}</div>
            <div className="text-sm text-muted-foreground mb-6">바이어에게 단가가 전달되었습니다.</div>
            <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">
              확인
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* 요청 요약 */}
            <div className="bg-secondary rounded-lg px-4 py-3 space-y-3 text-sm">
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">희망 수량</div>
                  <div className="font-semibold text-foreground">{request.quantity.toLocaleString()}벌</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">바이어 희망 단가</div>
                  <div className="font-semibold text-foreground">{request.unitPrice.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">납기일</div>
                  <div className="font-semibold text-foreground">{request.deliveryDate}</div>
                </div>
              </div>
              {request.detail && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">세부 요구사항</div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{linkify(request.detail)}</p>
                </div>
              )}
            </div>

            {/* 입력 폼 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                제시 단가 <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="예: 16,500"
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                출고 가능일 <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                value={form.availableDate}
                onChange={(e) => setForm({ ...form, availableDate: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                공급사 한마디 <span className="text-muted-foreground font-normal text-xs">(선택)</span>
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={3}
                placeholder="예: 인증서 보유하고 있습니다. 바로 다마스 퀵 가능합니다."
                className={`${inputCls} resize-none`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                canSubmit ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Zap size={15} /> {isEdit ? "견적 수정하기" : "단가 제시하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 요청 카드 ─────────────────────────────────────────────────────────
function RequestCard({
  req, myBid, onBid,
}: {
  req: ReadyRequest;
  myBid: MyBid | null;
  onBid: (req: ReadyRequest) => void;
}) {
  const dday = getDday(req.deliveryDate);

  const ddayColor = {
    urgent: "bg-red-50 text-red-600 border-red-200",
    soon:   "bg-orange-50 text-orange-600 border-orange-200",
    normal: "bg-secondary text-muted-foreground border-border",
  }[dday.level];

  const ddayIcon = dday.level === "urgent"
    ? <Zap size={11} className="flex-shrink-0" />
    : dday.level === "soon"
    ? <AlertTriangle size={11} className="flex-shrink-0" />
    : <Calendar size={11} className="flex-shrink-0" />;

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all group">
      {/* 상품 이미지 */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {req.imageUrl ? (
          <img src={req.imageUrl} alt={req.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Package size={32} className="text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">이미지 없음</span>
          </div>
        )}
        {/* D-day 태그 — 이미지 위 오버레이 */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 border rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${ddayColor}`}>
          {ddayIcon}
          {dday.label}
        </div>
        {/* 컬러바 대신 이미지 하단 그라데이션 */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${dday.level === "urgent" ? "bg-red-500" : dday.level === "soon" ? "bg-orange-400" : "bg-gradient-to-r from-primary to-accent"}`} />
      </div>

      <div className="p-5">
        {/* 상단 행 */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">{req.id}</span>
            <span className="text-[10px] bg-secondary text-primary px-2 py-0.5 rounded">{req.category}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Users size={11} />{req.bidCount}개사 참여
          </div>
        </div>

        <h3 className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors mb-0.5">
          {req.productName}
        </h3>
        <div className="text-xs text-muted-foreground mb-3">{req.buyerName}</div>

        {/* 세부 요구사항 */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{req.detail}</p>

        {/* 스탯 — 희망수량 / 희망납기일 / 희망단가 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted rounded p-2 text-center">
            <div className="font-mono font-bold text-sm text-foreground">{req.quantity.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">희망수량(벌)</div>
          </div>
          <div className="bg-muted rounded p-2 text-center">
            <div className="font-mono font-bold text-sm text-foreground">{req.deliveryDate.slice(5)}</div>
            <div className="text-[10px] text-muted-foreground">희망납기일</div>
          </div>
          <div className="bg-muted rounded p-2 text-center">
            <div className="font-mono font-bold text-sm text-foreground">{req.unitPrice.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">희망단가(원)</div>
          </div>
        </div>

        {/* 버튼 */}
        {myBid ? (
          <div className="space-y-2">
            <div className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">제안완료</span>
                <span className="text-xs text-green-700 font-mono font-bold">{Number(myBid.unitPrice).toLocaleString()}원</span>
              </div>
              <span className="text-xs text-muted-foreground">{myBid.availableDate} 출고</span>
            </div>
            <button
              onClick={() => onBid(req)}
              className="w-full border border-primary text-primary hover:bg-primary hover:text-white text-sm py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={14} /> 제안 내역 보기/수정
            </button>
          </div>
        ) : (
          <button
            onClick={() => onBid(req)}
            className="w-full bg-primary hover:bg-primary/90 text-white text-sm py-2.5 rounded font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={14} /> 단가 제시하기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function ReadyRequestList() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedReq, setSelectedReq] = useState<ReadyRequest | null>(null);
  const [myBids, setMyBids] = useState<Record<string, MyBid>>({});

  const handleBidSubmit = (bid: MyBid) => {
    setMyBids((prev) => ({ ...prev, [bid.requestId]: bid }));
  };

  const filtered = DUMMY.filter((r) => {
    const matchSearch = r.productName.includes(search) || r.detail.includes(search);
    const matchCat = activeCategory === "전체" || r.category === activeCategory;
    const matchUrgent = !urgentOnly || getDday(r.deliveryDate).level === "urgent";
    return matchSearch && matchCat && matchUrgent;
  });

  const urgentCount = DUMMY.filter((r) => getDday(r.deliveryDate).level === "urgent").length;

  return (
    <div className="font-[Inter,sans-serif]">
      {/* 히어로 */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="inline-block bg-primary text-xs font-mono px-2 py-1 rounded mb-4 tracking-wider uppercase">사입 요청 게시판</div>
          <h1 className="text-4xl font-bold mb-3">
            바이어 사입 요청 <span className="text-accent">{DUMMY.length}</span>건
          </h1>
          <p className="text-white/70 mb-6">구매자들이 올린 사입 요청서에 단가를 제시하고 거래를 성사시키세요.</p>
          {urgentCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
              <Zap size={14} /> 오늘 마감 요청 {urgentCount}건 — 빠르게 확인하세요!
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* 필터 */}
        <div className="bg-white border border-border rounded p-5 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-border rounded px-3 py-2 gap-2 flex-1 min-w-[240px]">
              <Search size={15} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="상품명, 요구사항 검색..."
                className="text-sm outline-none flex-1"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <div
                onClick={() => setUrgentOnly(!urgentOnly)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${urgentOnly ? "bg-red-500" : "bg-[#ddd]"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${urgentOnly ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <Zap size={13} className={urgentOnly ? "text-red-500" : ""} /> 마감임박만
            </label>

            <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Filter size={12} /> {filtered.length}건
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} myBid={myBids[req.id] ?? null} onBid={setSelectedReq} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium">검색 결과가 없습니다</div>
            <div className="text-sm mt-1">다른 키워드나 필터를 사용해보세요</div>
          </div>
        )}
      </div>

      {/* 모달 */}
      {selectedReq && (
        <BidModal
          request={selectedReq}
          existingBid={myBids[selectedReq.id] ?? null}
          onClose={() => setSelectedReq(null)}
          onSubmit={handleBidSubmit}
        />
      )}
    </div>
  );
}
