import { useState } from "react";
import {
  Clock, Users, Package, X, Zap, AlertTriangle, Calendar,
  Search, Filter, FileText, FlaskConical, Truck, CreditCard,
  CheckCircle, History,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────
interface ReadyRequest {
  id: string;
  productName: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  deliveryDate: string;
  imageUrl?: string;
  category: string;
  bidCount: number;
  buyerName: string;
}

interface CustomRequest {
  id: string;
  productName: string;
  detail: string;
  quantity: number;
  totalBudget: number;
  deliveryDate: string;
  category: string;
  subCategory: string;
  bidCount: number;
  buyerName: string;
  needSample: "Y" | "N";
  workFileCount: number;
}

interface ReadyBidForm {
  unitPrice: string;
  availableDate: string;
  expiryDate: string;
  comment: string;
}

interface CustomBidForm {
  totalBudget: string;
  samplePrice: string;
  availableDate: string;
  expiryDate: string;
  quoteFile: File | null;
  comment: string;
}

type BidSubmitStatus = "제출됨" | "샘플결제됨" | "샘플출고완료" | "승인" | "거절";

interface MyBid {
  requestId: string;
  type: "READY" | "CUSTOM";
  unitPrice?: string;
  totalBudget?: string;
  samplePrice?: string;
  availableDate?: string;
  expiryDate?: string;
  quoteFile?: File | null;
  comment?: string;
  status: BidSubmitStatus;
  submittedAt: string;
  trackingNumber?: string;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────
const today = new Date();
const daysLater = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const READY_DUMMY: ReadyRequest[] = [
  { id: "REQ-001", productName: "여성 린넨 와이드 팬츠", detail: "* 컬러/사이즈/수량: 아이보리 / S / 50장\n* 컬러/사이즈/수량: 아이보리 / M / 80장\n* 컬러/사이즈/수량: 베이지 / M / 70장\n허리 밴딩 처리.", quantity: 200, unitPrice: 18000, deliveryDate: daysLater(1), imageUrl: "", category: "하의", bidCount: 3, buyerName: "스타일피크" },
  { id: "REQ-002", productName: "플리츠 미디 스커트", detail: "* 컬러/사이즈/수량: 블랙 / S / 70장\n* 컬러/사이즈/수량: 네이비 / M / 70장\n허리 고무줄 처리.", quantity: 210, unitPrice: 22000, deliveryDate: daysLater(0), imageUrl: "", category: "하의", bidCount: 7, buyerName: "트렌드온" },
  { id: "REQ-003", productName: "크롭 볼레로 가디건", detail: "* 컬러/사이즈/수량: 화이트 / S / 30장\n* 컬러/사이즈/수량: 베이지 / M / 40장\n소매 리브 처리.", quantity: 100, unitPrice: 25000, deliveryDate: daysLater(3), imageUrl: "", category: "상의", bidCount: 2, buyerName: "모멘트클로젯" },
  { id: "REQ-004", productName: "스트라이프 오버핏 셔츠", detail: "* 컬러/사이즈/수량: 블루/화이트 / M / 50장\n면100%.", quantity: 150, unitPrice: 19000, deliveryDate: daysLater(5), imageUrl: "", category: "상의", bidCount: 5, buyerName: "데일리룩" },
  { id: "REQ-005", productName: "테리 집업 후드", detail: "* 컬러/사이즈/수량: 오트밀 / S / 80장\n* 컬러/사이즈/수량: 차콜 / M / 120장\n프리미엄 테리 소재.", quantity: 300, unitPrice: 35000, deliveryDate: daysLater(2), imageUrl: "", category: "상의", bidCount: 4, buyerName: "캐주얼랩" },
  { id: "REQ-006", productName: "A라인 플레어 원피스", detail: "* 컬러/사이즈/수량: 플로럴 / S / 60장\n안감 있음.", quantity: 180, unitPrice: 28000, deliveryDate: daysLater(10), imageUrl: "", category: "원피스/세트", bidCount: 6, buyerName: "로맨틱무드" },
];

const CUSTOM_DUMMY: CustomRequest[] = [
  { id: "CUS-001", productName: "자체브랜드 시그니처 트렌치코트", detail: "3페이지 컬러 샘플은 카멜 우선 진행 부탁드립니다. 안감 퀄리티 특히 신경써주세요.", quantity: 150, totalBudget: 12000000, deliveryDate: daysLater(20), category: "아우터", subCategory: "코트", bidCount: 2, buyerName: "르블랑", needSample: "Y", workFileCount: 3 },
  { id: "CUS-002", productName: "OEM 요가복 세트", detail: "소재 샘플 먼저 받아보고 싶습니다.", quantity: 500, totalBudget: 8500000, deliveryDate: daysLater(14), category: "스포츠/애슬레저", subCategory: "요가복", bidCount: 5, buyerName: "핏스튜디오", needSample: "Y", workFileCount: 2 },
  { id: "CUS-003", productName: "ODM 니트 가디건 시즌 라인", detail: "작업지시서 외 추가 요청사항 없습니다.", quantity: 200, totalBudget: 6000000, deliveryDate: daysLater(30), category: "상의", subCategory: "니트", bidCount: 0, buyerName: "소프트무드", needSample: "N", workFileCount: 4 },
  { id: "CUS-004", productName: "자체브랜드 데님 팬츠 2종", detail: "워싱 처리 디테일은 작업지시서 5페이지 참고 부탁드립니다.", quantity: 300, totalBudget: 9000000, deliveryDate: daysLater(25), category: "하의", subCategory: "데님", bidCount: 3, buyerName: "진스트리트", needSample: "Y", workFileCount: 2 },
  { id: "CUS-005", productName: "시즌 오프 패딩 기획전", detail: "충전재 스펙은 작업지시서 참고, 외부 원단 컬러 우선 확정 필요.", quantity: 400, totalBudget: 20000000, deliveryDate: daysLater(45), category: "아우터", subCategory: "패딩", bidCount: 1, buyerName: "윈터랩", needSample: "Y", workFileCount: 5 },
];

// 이전 소싱요청 더미 (마감된 것들)
const PAST_READY_DUMMY: ReadyRequest[] = [
  { id: "REQ-P01", productName: "봄 시즌 플로럴 블라우스", detail: "* 컬러/사이즈/수량: 핑크 / S / 100장", quantity: 100, unitPrice: 15000, deliveryDate: "2026-04-15", imageUrl: "", category: "상의", bidCount: 4, buyerName: "블룸스타일" },
  { id: "REQ-P02", productName: "데일리 스트레치 레깅스", detail: "* 컬러/사이즈/수량: 블랙 / M / 200장", quantity: 200, unitPrice: 12000, deliveryDate: "2026-05-01", imageUrl: "", category: "하의", bidCount: 6, buyerName: "피트니스몰" },
];

const PAST_CUSTOM_DUMMY: CustomRequest[] = [
  { id: "CUS-P01", productName: "겨울 시즌 울 코트 라인", detail: "소재 퀄리티 최우선, 안감 실크 처리.", quantity: 100, totalBudget: 15000000, deliveryDate: "2026-03-20", category: "아우터", subCategory: "코트", bidCount: 3, buyerName: "프리미엄무드", needSample: "Y", workFileCount: 4 },
];

const READY_CATEGORIES = ["전체", "상의", "하의", "원피스/세트", "아우터", "액세서리"];
const CUSTOM_CATEGORIES = ["전체", "상의", "하의", "아우터", "스포츠/애슬레저", "OEM/자체제작"];

// ── 상태 스타일 ───────────────────────────────────────────────────────
const BID_STATUS_STYLE: Record<BidSubmitStatus, string> = {
  "제출됨":      "bg-blue-50 text-blue-600 border-blue-200",
  "샘플결제됨":  "bg-amber-50 text-amber-600 border-amber-200",
  "샘플출고완료":"bg-teal-50 text-teal-600 border-teal-200",
  "승인":        "bg-green-50 text-green-600 border-green-200",
  "거절":        "bg-red-50 text-red-500 border-red-200",
};

// ── D-day 유틸 ────────────────────────────────────────────────────────
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

// ── 출고 확인 모달 ────────────────────────────────────────────────────
function ShipmentModal({
  bid,
  requestName,
  onClose,
  onConfirm,
}: {
  bid: MyBid;
  requestName: string;
  onClose: () => void;
  onConfirm: (requestId: string, trackingNumber: string) => void;
}) {
  const [done, setDone] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  const canConfirm = trackingNumber.trim().length > 0;

  const handleConfirm = () => {
    onConfirm(bid.requestId, trackingNumber.trim());
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!done ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-teal-500" />
            <h3 className="font-bold text-foreground">샘플 출고 처리</h3>
          </div>
          {!done && <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>}
        </div>
        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={22} className="text-teal-500" />
            </div>
            <div className="font-bold text-foreground mb-1">출고 완료!</div>
            <div className="text-sm text-muted-foreground mb-1">바이어에게 알림이 전송됩니다.</div>
            <div className="text-xs text-muted-foreground mb-6">
              운송장 번호: <span className="font-mono font-semibold text-foreground">{trackingNumber}</span>
            </div>
            <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품명</span>
                <span className="font-semibold text-foreground truncate ml-4">{requestName}</span>
              </div>
              {bid.samplePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">샘플비</span>
                  <span className="font-semibold text-foreground">{Number(bid.samplePrice).toLocaleString()}원</span>
                </div>
              )}
            </div>

            {/* 운송장 번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                운송장 번호 <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="예: 1234567890123"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition-colors bg-white font-mono tracking-wider"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">택배사 운송장 번호를 입력해주세요. 바이어에게 전달됩니다.</p>
            </div>

            <div className="text-xs text-muted-foreground bg-teal-50 border border-teal-200 rounded px-3 py-2.5 leading-relaxed">
              실제 출고 후 운송장을 등록해주세요. 바이어가 배송 현황을 확인할 수 있습니다.
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">취소</button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`flex-1 py-2.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  canConfirm ? "bg-teal-500 hover:bg-teal-600 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Truck size={14} /> 출고 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 기성품 견적 모달 ──────────────────────────────────────────────────
function ReadyBidModal({
  request, existingBid, onClose, onSubmit,
}: {
  request: ReadyRequest;
  existingBid: MyBid | null;
  onClose: () => void;
  onSubmit: (bid: MyBid) => void;
}) {
  const [step, setStep] = useState<"detail" | "bid" | "done">("detail");
  const isEdit = !!existingBid;
  const [form, setForm] = useState<ReadyBidForm>(
    existingBid
      ? { unitPrice: existingBid.unitPrice ?? "", availableDate: existingBid.availableDate ?? "", expiryDate: existingBid.expiryDate ?? "", comment: existingBid.comment ?? "" }
      : { unitPrice: "", availableDate: "", expiryDate: "", comment: "" }
  );

  const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";
  const canSubmit = !!(form.unitPrice && form.availableDate);

  const handleSubmit = () => {
    onSubmit({
      requestId: request.id,
      type: "READY",
      unitPrice: form.unitPrice,
      availableDate: form.availableDate,
      expiryDate: form.expiryDate,
      comment: form.comment,
      status: "제출됨",
      submittedAt: new Date().toISOString().split("T")[0],
    });
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">{request.id} · {request.category}</div>
            <h3 className="font-bold text-foreground">{request.productName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">제안완료</span>}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
          </div>
        </div>

        {step === "done" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={22} className="text-green-500" />
            </div>
            <div className="font-bold text-foreground mb-1">{isEdit ? "견적 수정 완료!" : "견적 제출 완료!"}</div>
            <div className="text-sm text-muted-foreground mb-6">관리자 검토 후 바이어에게 전달됩니다.</div>
            <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
          </div>
        ) : step === "detail" ? (
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "희망 수량", value: `${request.quantity.toLocaleString()}벌` },
                { label: "희망 단가", value: `${request.unitPrice.toLocaleString()}원` },
                { label: "납기일", value: request.deliveryDate.slice(5) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                  <div className="font-semibold text-sm text-foreground">{value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">세부 요구사항</div>
              <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground whitespace-pre-line leading-relaxed">{request.detail || "—"}</div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">닫기</button>
              <button onClick={() => setStep("bid")} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                <Zap size={14} /> {isEdit ? "견적 수정하기" : "견적 제출하기"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="text-xs text-muted-foreground bg-secondary rounded px-3 py-2">
              희망 단가 <strong className="text-foreground">{request.unitPrice.toLocaleString()}원</strong> · 납기 <strong className="text-foreground">{request.deliveryDate}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">제시 단가 <span className="text-primary">*</span></label>
              <div className="relative">
                <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="예: 16,500" className={`${inputCls} pr-8`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">출고 가능일 <span className="text-primary">*</span></label>
                <input type="date" value={form.availableDate} onChange={(e) => setForm({ ...form, availableDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">견적 유효기간 <span className="text-muted-foreground font-normal text-xs">(선택)</span></label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">공급사 한마디 <span className="text-muted-foreground font-normal text-xs">(선택)</span></label>
              <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="예: 인증서 보유, 당일 퀵 가능합니다." className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("detail")} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">이전</button>
              <button onClick={handleSubmit} disabled={!canSubmit} className={`flex-1 py-2.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${canSubmit ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                <Zap size={14} /> {isEdit ? "수정 완료" : "견적 제출"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 주문제작 견적 모달 ────────────────────────────────────────────────
function CustomBidModal({
  request, existingBid, onClose, onSubmit,
}: {
  request: CustomRequest;
  existingBid: MyBid | null;
  onClose: () => void;
  onSubmit: (bid: MyBid) => void;
}) {
  const [step, setStep] = useState<"detail" | "bid" | "done">("detail");
  const isEdit = !!existingBid;
  const [form, setForm] = useState<CustomBidForm>(
    existingBid
      ? { totalBudget: existingBid.totalBudget ?? "", samplePrice: existingBid.samplePrice ?? "", availableDate: existingBid.availableDate ?? "", expiryDate: existingBid.expiryDate ?? "", quoteFile: existingBid.quoteFile ?? null, comment: existingBid.comment ?? "" }
      : { totalBudget: "", samplePrice: "", availableDate: "", expiryDate: "", quoteFile: null, comment: "" }
  );

  const inputCls = "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";
  const canSubmit = !!(form.totalBudget && form.availableDate && form.quoteFile);

  const handleSubmit = () => {
    onSubmit({
      requestId: request.id,
      type: "CUSTOM",
      totalBudget: form.totalBudget,
      samplePrice: form.samplePrice,
      availableDate: form.availableDate,
      expiryDate: form.expiryDate,
      quoteFile: form.quoteFile,
      comment: form.comment,
      status: "제출됨",
      submittedAt: new Date().toISOString().split("T")[0],
    });
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">{request.id} · {request.category} &gt; {request.subCategory}</div>
            <h3 className="font-bold text-foreground">{request.productName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">제안완료</span>}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
          </div>
        </div>

        {step === "done" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={22} className="text-green-500" />
            </div>
            <div className="font-bold text-foreground mb-1">{isEdit ? "견적 수정 완료!" : "견적 제출 완료!"}</div>
            <div className="text-sm text-muted-foreground mb-6">관리자 검토 후 바이어에게 전달됩니다.</div>
            <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90 transition-colors">확인</button>
          </div>
        ) : step === "detail" ? (
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "희망 수량", value: `${request.quantity.toLocaleString()}벌` },
                { label: "전체 예산", value: `${(request.totalBudget / 10000).toLocaleString()}만원` },
                { label: "납기일", value: request.deliveryDate.slice(5) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                  <div className="font-semibold text-sm text-foreground">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${request.needSample === "Y" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-secondary text-muted-foreground border-border"}`}>
                샘플 {request.needSample === "Y" ? "필요" : "불필요"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full border bg-secondary text-muted-foreground border-border flex items-center gap-1">
                <FileText size={10} /> 작업지시서 {request.workFileCount}건
              </span>
            </div>
            {request.detail && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">바이어 강조사항</div>
                <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">{request.detail}</div>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">작업지시서 파일</div>
              <div className="space-y-1.5">
                {Array.from({ length: request.workFileCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-secondary hover:border-primary transition-colors cursor-pointer group/file">
                    <FileText size={14} className="text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1">작업지시서_{request.id}_{i + 1}.pdf</span>
                    <span className="text-xs text-primary opacity-0 group-hover/file:opacity-100 transition-opacity">다운로드</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">닫기</button>
              <button onClick={() => setStep("bid")} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                <Zap size={14} /> {isEdit ? "견적 수정하기" : "견적 제출하기"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="text-xs text-muted-foreground bg-secondary rounded px-3 py-2">
              전체 예산 <strong className="text-foreground">{(request.totalBudget / 10000).toLocaleString()}만원</strong> · 수량 <strong className="text-foreground">{request.quantity.toLocaleString()}벌</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">총 예산 제시 <span className="text-primary">*</span></label>
                <div className="relative">
                  <input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} placeholder="예: 11,000,000" className={`${inputCls} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
                </div>
              </div>
              {request.needSample === "Y" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    샘플비 <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input type="number" value={form.samplePrice} onChange={(e) => setForm({ ...form, samplePrice: e.target.value })} placeholder="예: 80,000" className={`${inputCls} pr-8 border-amber-200 focus:border-amber-400`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">바이어가 샘플 결제 후 진행됩니다</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">납품 가능일 <span className="text-primary">*</span></label>
                <input type="date" value={form.availableDate} onChange={(e) => setForm({ ...form, availableDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">견적 유효기간 <span className="text-muted-foreground font-normal text-xs">(선택)</span></label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">견적서 PDF <span className="text-primary">*</span></label>
              {form.quoteFile ? (
                <div className="flex items-center gap-3 border border-primary/40 bg-primary/5 rounded px-3 py-2">
                  <FileText size={15} className="text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{form.quoteFile.name}</span>
                  <button onClick={() => setForm({ ...form, quoteFile: null })} className="text-muted-foreground hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center gap-1">
                  <FileText size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-xs text-muted-foreground">클릭하여 PDF 첨부 <span className="text-primary font-medium">파일 선택</span></div>
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => setForm({ ...form, quoteFile: e.target.files?.[0] ?? null })} />
                </label>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">메모 <span className="text-muted-foreground font-normal text-xs">(선택)</span></label>
              <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="예: 동일 소재 납품 경력 5년, 샘플 1주일 내 가능합니다." className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("detail")} className="flex-1 py-2.5 border border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium">이전</button>
              <button onClick={handleSubmit} disabled={!canSubmit} className={`flex-1 py-2.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${canSubmit ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                <Zap size={14} /> {isEdit ? "수정 완료" : "견적 제출"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 기성품 카드 ───────────────────────────────────────────────────────
function ReadyCard({ req, myBid, onBid }: { req: ReadyRequest; myBid: MyBid | null; onBid: (r: ReadyRequest) => void }) {
  const dday = getDday(req.deliveryDate);
  const ddayIcon = dday.level === "urgent" ? <Zap size={11} /> : dday.level === "soon" ? <AlertTriangle size={11} /> : <Calendar size={11} />;

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all group">
      <div className="relative h-44 bg-muted overflow-hidden">
        {req.imageUrl ? (
          <img src={req.imageUrl} alt={req.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Package size={32} className="text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">이미지 없음</span>
          </div>
        )}
        <div className={`absolute top-3 right-3 flex items-center gap-1 border rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${ddayColorCls[dday.level]}`}>
          {ddayIcon} {dday.label}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${dday.level === "urgent" ? "bg-red-500" : dday.level === "soon" ? "bg-orange-400" : "bg-gradient-to-r from-primary to-accent"}`} />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{req.id}</span>
            <span className="text-[10px] bg-secondary text-primary px-2 py-0.5 rounded">{req.category}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Users size={11} />{req.bidCount}개사
          </div>
        </div>
        <h3 className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors mb-0.5">{req.productName}</h3>
        <div className="text-xs text-muted-foreground mb-3">{req.buyerName}</div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 whitespace-pre-line">{req.detail}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "희망수량(벌)", value: req.quantity.toLocaleString() },
            { label: "희망납기일", value: req.deliveryDate.slice(5) },
            { label: "희망단가(원)", value: req.unitPrice.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted rounded p-2 text-center">
              <div className="font-mono font-bold text-sm text-foreground">{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        {myBid ? (
          <div className="space-y-2">
            <div className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${BID_STATUS_STYLE[myBid.status]}`}>{myBid.status}</span>
                <span className="text-xs text-green-700 font-mono font-bold">{Number(myBid.unitPrice).toLocaleString()}원</span>
              </div>
              <span className="text-xs text-muted-foreground">{myBid.availableDate} 출고</span>
            </div>
            <button onClick={() => onBid(req)} className="w-full border border-primary text-primary hover:bg-primary hover:text-white text-sm py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2">
              <Zap size={14} /> 제안 보기/수정
            </button>
          </div>
        ) : (
          <button onClick={() => onBid(req)} className="w-full bg-primary hover:bg-primary/90 text-white text-sm py-2.5 rounded font-semibold transition-colors flex items-center justify-center gap-2">
            <Zap size={14} /> 단가 제시하기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 주문제작 리스트 행 ────────────────────────────────────────────────
function CustomRow({ req, myBid, onBid, onShip }: { req: CustomRequest; myBid: MyBid | null; onBid: (r: CustomRequest) => void; onShip?: (bid: MyBid) => void }) {
  const dday = getDday(req.deliveryDate);
  const ddayIcon = dday.level === "urgent" ? <Zap size={11} /> : dday.level === "soon" ? <AlertTriangle size={11} /> : <Calendar size={11} />;
  const isSamplePaid = myBid?.status === "샘플결제됨";

  return (
    <div className="bg-white border border-border rounded-lg px-5 py-4 hover:border-primary hover:shadow-sm transition-all group">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">{req.id}</span>
            <span className="text-[10px] bg-secondary text-primary px-2 py-0.5 rounded">{req.category} &gt; {req.subCategory}</span>
            <span className={`flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 font-semibold ${ddayColorCls[dday.level]}`}>
              {ddayIcon} {dday.label}
            </span>
            {myBid && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${BID_STATUS_STYLE[myBid.status]}`}>{myBid.status}</span>
            )}
          </div>
          <div className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">{req.productName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{req.buyerName}</div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
          <div>
            <div className="font-mono font-bold text-sm text-foreground">{req.quantity.toLocaleString()}벌</div>
            <div className="text-[10px] text-muted-foreground">희망수량</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-foreground">{(req.totalBudget / 10000).toLocaleString()}만원</div>
            <div className="text-[10px] text-muted-foreground">전체예산</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-foreground">{req.deliveryDate.slice(5)}</div>
            <div className="text-[10px] text-muted-foreground">희망납기</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <FileText size={11} className="text-muted-foreground" />
              <span className="font-mono font-bold text-sm text-foreground">{req.workFileCount}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">작업지시서</div>
          </div>
          <div>
            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${req.needSample === "Y" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-secondary text-muted-foreground border-border"}`}>
              샘플 {req.needSample === "Y" ? "필요" : "불필요"}
            </div>
            <div className="text-[10px] text-muted-foreground text-center mt-0.5">{req.bidCount}개사 참여</div>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col gap-2">
          {isSamplePaid && onShip && (
            <button
              onClick={() => onShip(myBid)}
              className="px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Truck size={13} /> 샘플 출고
            </button>
          )}
          <button
            onClick={() => onBid(req)}
            className={`px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
              myBid ? "border border-primary text-primary hover:bg-primary hover:text-white" : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            <Zap size={13} />
            {myBid ? "보기/수정" : "상세보기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 이전 요청 행 (읽기 전용) ──────────────────────────────────────────
function PastRow({ req, myBid }: { req: ReadyRequest | CustomRequest; myBid: MyBid | null }) {
  const isCustom = "totalBudget" in req;
  return (
    <div className="bg-white border border-border rounded-lg px-5 py-4 opacity-80">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">{req.id}</span>
            <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{req.category}</span>
            <span className="text-[10px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full">마감</span>
            {myBid && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${BID_STATUS_STYLE[myBid.status]}`}>{myBid.status}</span>
            )}
          </div>
          <div className="font-semibold text-sm text-foreground truncate">{req.productName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{req.buyerName} · 납기 {req.deliveryDate}</div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
          <div>
            <div className="font-mono font-bold text-sm text-muted-foreground">{req.quantity.toLocaleString()}벌</div>
            <div className="text-[10px] text-muted-foreground">수량</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-muted-foreground">
              {isCustom ? `${((req as CustomRequest).totalBudget / 10000).toLocaleString()}만원` : `${(req as ReadyRequest).unitPrice.toLocaleString()}원`}
            </div>
            <div className="text-[10px] text-muted-foreground">{isCustom ? "예산" : "단가"}</div>
          </div>
        </div>
        {myBid ? (
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {myBid.submittedAt} 제출
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex-shrink-0">미제출</div>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function SellerRequestList() {
  const [activeTab, setActiveTab] = useState<"READY" | "CUSTOM">("READY");
  // current / past / my 세 개의 서브탭
  const [subTab, setSubTab] = useState<"current" | "my" | "past">("current");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [selectedReady, setSelectedReady] = useState<ReadyRequest | null>(null);
  const [selectedCustom, setSelectedCustom] = useState<CustomRequest | null>(null);
  const [shipBid, setShipBid] = useState<{ bid: MyBid; requestName: string } | null>(null);

  const [myBids, setMyBids] = useState<Record<string, MyBid>>({});

  const handleBidSubmit = (bid: MyBid) => {
    setMyBids((prev) => ({ ...prev, [bid.requestId]: bid }));
  };

  const handleShipConfirm = (requestId: string, trackingNumber: string) => {
    setMyBids((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], status: "샘플출고완료", trackingNumber },
    }));
    setShipBid(null);
  };

  const handleTabChange = (tab: "READY" | "CUSTOM") => {
    setActiveTab(tab);
    setActiveCategory("전체");
    setSearch("");
    setUrgentOnly(false);
    setSubTab("current");
  };

  const categories = activeTab === "READY" ? READY_CATEGORIES : CUSTOM_CATEGORIES;

  const allReady = READY_DUMMY;
  const allCustom = CUSTOM_DUMMY;

  const filterReady = (list: ReadyRequest[]) =>
    list.filter((r) => {
      const matchSearch = r.productName.includes(search) || r.detail.includes(search);
      const matchCat = activeCategory === "전체" || r.category === activeCategory;
      const matchUrgent = !urgentOnly || getDday(r.deliveryDate).level === "urgent";
      return matchSearch && matchCat && matchUrgent;
    });

  const filterCustom = (list: CustomRequest[]) =>
    list.filter((r) => {
      const matchSearch = r.productName.includes(search) || r.detail.includes(search);
      const matchCat = activeCategory === "전체" || r.category === activeCategory;
      return matchSearch && matchCat;
    });

  // 서브탭별 데이터
  // past = 현재 활성 탭(READY/CUSTOM)에서 내가 제안한 것들 (탭 구분 없이 myBids 전체)
  const allMyBidRequests =
    activeTab === "READY"
      ? [...READY_DUMMY, ...PAST_READY_DUMMY].filter((r) => !!myBids[r.id])
      : [...CUSTOM_DUMMY, ...PAST_CUSTOM_DUMMY].filter((r) => !!myBids[r.id]);

  const readyList =
    subTab === "current" ? filterReady(allReady) :
    subTab === "my"      ? filterReady(allReady.filter((r) => !!myBids[r.id])) :
                           filterReady(allMyBidRequests as ReadyRequest[]);

  const customList =
    subTab === "current" ? filterCustom(allCustom) :
    subTab === "my"      ? filterCustom(allCustom.filter((r) => !!myBids[r.id])) :
                           filterCustom(allMyBidRequests as CustomRequest[]);

  const urgentCount = READY_DUMMY.filter((r) => getDday(r.deliveryDate).level === "urgent").length;
  const myBidCount = activeTab === "READY"
    ? allReady.filter((r) => !!myBids[r.id]).length
    : allCustom.filter((r) => !!myBids[r.id]).length;

  return (
    <div className="font-[Inter,sans-serif]">
      {/* 히어로 */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="inline-block bg-primary text-xs font-mono px-2 py-1 rounded mb-4 tracking-wider uppercase">소싱 요청 게시판</div>
          <h1 className="text-4xl font-bold mb-3">
            바이어 소싱 요청{" "}
            <span className="text-accent">{activeTab === "READY" ? READY_DUMMY.length : CUSTOM_DUMMY.length}</span>건
          </h1>
          <p className="text-white/70 mb-6">
            {activeTab === "READY"
              ? "바이어가 올린 사입 요청서에 단가를 제시하고 거래를 성사시키세요."
              : "바이어의 주문제작 요청서를 확인하고 제작 견적을 제출하세요."}
          </p>
          {activeTab === "READY" && urgentCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
              <Zap size={14} /> 오늘 마감 요청 {urgentCount}건 — 빠르게 확인하세요!
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8">

        {/* 메인 탭 */}
        <div className="flex gap-1 bg-secondary border border-border rounded-lg p-1 mb-5 w-fit">
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
              {tab === "READY" ? "🏷️ 기성품 사입" : "✂️ 주문제작"}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-mono ${activeTab === tab ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
                {tab === "READY" ? READY_DUMMY.length : CUSTOM_DUMMY.length}
              </span>
            </button>
          ))}
        </div>

        {/* 서브 탭 */}
        <div className="flex gap-0 border-b border-border mb-6">
          {(["current", "my", "past"] as const).map((tab) => {
            const labels: Record<typeof tab, string> = { current: "전체 요청", my: "내 제안", past: "이전 요청" };
            const icons = { current: <Filter size={13} />, my: <Zap size={13} />, past: <History size={13} /> };
            const isActive = subTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {icons[tab]}
                {labels[tab]}
                {tab === "my" && myBidCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${isActive ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
                    {myBidCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 필터 — 이전 요청 탭에서는 숨김 */}
        {subTab !== "past" && (
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
              {activeTab === "READY" && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <div
                    onClick={() => setUrgentOnly(!urgentOnly)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${urgentOnly ? "bg-red-500" : "bg-[#ddd]"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${urgentOnly ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <Zap size={13} className={urgentOnly ? "text-red-500" : ""} /> 마감임박만
                </label>
              )}
              <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Filter size={12} /> {activeTab === "READY" ? readyList.length : customList.length}건
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {categories.map((cat) => (
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
        )}

        {/* 이전 요청 탭 안내 */}
        {subTab === "past" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary border border-border rounded px-4 py-3 mb-6">
            <History size={14} /> 내가 견적을 제출한 요청 이력입니다.
          </div>
        )}

        {/* 기성품 */}
        {activeTab === "READY" && subTab !== "past" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {readyList.map((req) => (
                <ReadyCard key={req.id} req={req} myBid={myBids[req.id] ?? null} onBid={setSelectedReady} />
              ))}
            </div>
            {readyList.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-medium">{subTab === "my" ? "제안한 요청이 없습니다" : "검색 결과가 없습니다"}</div>
              </div>
            )}
          </>
        )}

        {/* 주문제작 */}
        {activeTab === "CUSTOM" && subTab !== "past" && (
          <>
            <div className="space-y-3">
              {customList.map((req) => (
                <CustomRow
                  key={req.id}
                  req={req}
                  myBid={myBids[req.id] ?? null}
                  onBid={setSelectedCustom}
                  onShip={(bid) => setShipBid({ bid, requestName: req.productName })}
                />
              ))}
            </div>
            {customList.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-medium">{subTab === "my" ? "제안한 요청이 없습니다" : "검색 결과가 없습니다"}</div>
              </div>
            )}
          </>
        )}

        {/* 이전 요청 목록 — 내가 견적 제출한 것만 */}
        {subTab === "past" && (
          <div className="space-y-3">
            {(activeTab === "READY" ? readyList : customList).map((req) => (
              <PastRow key={req.id} req={req} myBid={myBids[req.id] ?? null} />
            ))}
            {(activeTab === "READY" ? readyList : customList).length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-medium">제출한 견적 내역이 없습니다</div>
                <div className="text-sm mt-1 text-muted-foreground">견적을 제출하면 여기서 이력을 확인할 수 있습니다</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 기성품 모달 */}
      {selectedReady && (
        <ReadyBidModal
          request={selectedReady}
          existingBid={myBids[selectedReady.id] ?? null}
          onClose={() => setSelectedReady(null)}
          onSubmit={handleBidSubmit}
        />
      )}

      {/* 주문제작 모달 */}
      {selectedCustom && (
        <CustomBidModal
          request={selectedCustom}
          existingBid={myBids[selectedCustom.id] ?? null}
          onClose={() => setSelectedCustom(null)}
          onSubmit={handleBidSubmit}
        />
      )}

      {/* 샘플 출고 모달 */}
      {shipBid && (
        <ShipmentModal
          bid={shipBid.bid}
          requestName={shipBid.requestName}
          onClose={() => setShipBid(null)}
          onConfirm={handleShipConfirm}
        />
      )}
    </div>
  );
}
