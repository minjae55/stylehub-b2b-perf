import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  LoaderCircle,
  Package,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import api from "@/api/axios";

type ContractStatus =
  | "DRAFT"
  | "SELLER_SIGNED"
  | "BUYER_SIGNED"
  | "COMPLETED"
  | "CANCELED"
  | "EXPIRED";

type ContractItem = {
  contractItemId: number;
  productName: string;
  optionSummary: string | null;
  material: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type BuyerContractDetail = {
  contractId: number;
  contractNo: string;
  quoteId: number;
  quoteNo: string;
  status: ContractStatus;
  buyerCompanyName: string;
  buyerBusinessNumber: string;
  sellerCompanyName: string;
  sellerBusinessNumber: string;
  productName: string;
  material: string | null;
  deliveryCompany: string | null;
  shippingFee: number;
  leadTimeDays: number;
  validUntil: string;
  contractAmount: number;
  deliveryDate: string;
  paymentTerms: string;
  returnPolicy: string;
  specialTerms: string | null;
  createdAt: string;
  sellerSignedAt: string | null;
  buyerSignedAt: string | null;
  completedAt: string | null;
  items: ContractItem[];
};

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SignatureCanvas({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.strokeStyle = "#172019";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  const getPosition = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pointer = "touches" in event ? event.touches[0] : event;

    return {
      x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
      y: (pointer.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const position = getPosition(event);
    isDrawing.current = true;
    context.beginPath();
    context.moveTo(position.x, position.y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing.current) return;

    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const position = getPosition(event);
    context.lineTo(position.x, position.y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing.current || !canvasRef.current) return;

    isDrawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <PenLine size={15} className="text-primary" />
          손 서명
        </span>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600"
          >
            <RotateCcw size={12} />
            다시 서명
          </button>
        )}
      </div>
      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={720}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
          className="h-32 w-full touch-none cursor-crosshair"
        />
        {!value && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            이 영역에 서명해 주세요
          </p>
        )}
      </div>
    </div>
  );
}

export function BuyerContractSign() {
  const { contractId } = useParams<{ contractId: string }>();
  const [contract, setContract] = useState<BuyerContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [agreements, setAgreements] = useState({
    specification: false,
    returnPolicy: false,
    final: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const parsedContractId = Number(contractId);

    if (!Number.isInteger(parsedContractId) || parsedContractId <= 0) {
      setLoadError("유효하지 않은 계약서입니다.");
      setIsLoading(false);
      return;
    }

    const loadContract = async () => {
      try {
        setLoadError("");
        const response = await api.get<BuyerContractDetail>(
          `/buyer/contracts/${parsedContractId}`,
        );
        setContract(response);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "계약서를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadContract();
  }, [contractId]);

  const uploadSignature = async () => {
    const imageResponse = await fetch(signatureImage);
    const blob = await imageResponse.blob();
    const file = new File(
      [blob],
      `buyer-contract-signature-${contract?.contractId}.png`,
      { type: "image/png" },
    );
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", "contract-signatures");

    return api.post<string>("/common/image/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const canSign =
    contract?.status === "SELLER_SIGNED"
    && signatureText.trim().length > 0
    && signatureImage.length > 0
    && agreements.specification
    && agreements.returnPolicy
    && agreements.final
    && !isSubmitting;

  const handleSign = async () => {
    if (!contract || !canSign) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const signatureImageUrl = await uploadSignature();

      await api.post(`/buyer/contracts/${contract.contractId}/sign`, {
        signatureText: signatureText.trim(),
        signatureImageUrl,
      });

      const completedAt = new Date().toISOString();
      setContract({
        ...contract,
        status: "COMPLETED",
        buyerSignedAt: completedAt,
        completedAt,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "계약서 서명에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!contract || loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle size={42} className="mx-auto mb-4 text-rose-500" />
        <h1 className="text-xl font-bold text-slate-950">계약서를 확인할 수 없습니다</h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <Link
          to="/buyer/quotes"
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          견적 목록으로
        </Link>
      </div>
    );
  }

  const totalQuantity = contract.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const isCompleted = contract.status === "COMPLETED";
  const canDisplaySignForm = contract.status === "SELLER_SIGNED";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[980px]">
        <Link
          to="/buyer/quotes"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary"
        >
          <ChevronLeft size={15} />
          견적 목록으로
        </Link>

        <header className="mb-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <h1 className="text-xl font-bold text-slate-950">계약서 검토 및 서명</h1>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-700">
                {contract.contractNo}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                견적번호 {contract.quoteNo}
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-secondary px-4 py-3 text-right">
              <p className="text-xs font-bold text-primary">계약 금액</p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {formatPrice(contract.contractAmount)}
              </p>
            </div>
          </div>
        </header>

        {isCompleted ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <p className="font-bold text-green-900">계약 체결이 완료되었습니다</p>
              <p className="mt-1 text-sm text-green-700">
                바이어 서명 {formatDateTime(contract.buyerSignedAt)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold text-blue-900">셀러 서명 완료</p>
              <p className="mt-1 text-sm text-blue-700">
                {contract.sellerCompanyName} · {formatDateTime(contract.sellerSignedAt)}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
                <FileText size={16} className="text-primary" />
                계약 당사자
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <PartyInfo
                  label="바이어"
                  companyName={contract.buyerCompanyName}
                  businessNumber={contract.buyerBusinessNumber}
                />
                <PartyInfo
                  label="셀러"
                  companyName={contract.sellerCompanyName}
                  businessNumber={contract.sellerBusinessNumber}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
                <Package size={16} className="text-primary" />
                계약 상품
              </h2>
              <div className="space-y-3">
                {contract.items.map((item) => (
                  <div
                    key={item.contractItemId}
                    className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[item.optionSummary, item.material].filter(Boolean).join(" · ") || "옵션 정보 없음"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500">
                        {item.quantity.toLocaleString()}개 × {formatPrice(item.unitPrice)}
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
                <Truck size={16} className="text-primary" />
                납품 및 계약 조건
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox icon={<Calendar size={14} />} label="납품 예정일" value={formatDate(contract.deliveryDate)} />
                <InfoBox icon={<Clock size={14} />} label="리드타임" value={`${contract.leadTimeDays}일`} />
                <InfoBox label="결제 조건" value={contract.paymentTerms} />
                <InfoBox label="배송사" value={contract.deliveryCompany || "협의 예정"} />
              </div>
              <TermsBlock label="반품·교환 조건" value={contract.returnPolicy} />
              {contract.specialTerms && (
                <TermsBlock label="특약사항" value={contract.specialTerms} />
              )}
            </section>

            {canDisplaySignForm && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
                  <PenLine size={16} className="text-primary" />
                  바이어 서명
                </h2>
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-800">서명자명</span>
                  <input
                    value={signatureText}
                    onChange={(event) => setSignatureText(event.target.value)}
                    maxLength={100}
                    placeholder="서명자명을 입력하세요"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
                <SignatureCanvas value={signatureImage} onChange={setSignatureImage} />

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  <Agreement
                    checked={agreements.specification}
                    onChange={(checked) =>
                      setAgreements((current) => ({ ...current, specification: checked }))
                    }
                    label="계약 상품과 수량, 단가를 확인했습니다."
                  />
                  <Agreement
                    checked={agreements.returnPolicy}
                    onChange={(checked) =>
                      setAgreements((current) => ({ ...current, returnPolicy: checked }))
                    }
                    label="납품 및 반품·교환 조건을 확인했습니다."
                  />
                  <Agreement
                    checked={agreements.final}
                    onChange={(checked) =>
                      setAgreements((current) => ({ ...current, final: checked }))
                    }
                    label="계약 내용에 동의하며 전자서명을 진행합니다."
                  />
                </div>

                {submitError && (
                  <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                    {submitError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!canSign}
                  onClick={handleSign}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSubmitting ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <PenLine size={16} />
                  )}
                  {isSubmitting ? "서명 처리 중..." : "계약서 서명 완료"}
                </button>
              </section>
            )}
          </main>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-950">계약 요약</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label="상품 종류" value={`${contract.items.length}건`} />
                <SummaryRow label="총 수량" value={`${totalQuantity.toLocaleString()}개`} />
                <SummaryRow label="상품 금액" value={formatPrice(contract.contractAmount - contract.shippingFee)} />
                <SummaryRow label="배송비" value={formatPrice(contract.shippingFee)} />
              </dl>
              <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-bold text-slate-700">계약 금액</span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(contract.contractAmount)}
                </span>
              </div>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                유효기간 {formatDate(contract.validUntil)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PartyInfo({
  label,
  companyName,
  businessNumber,
}: {
  label: string;
  companyName: string;
  businessNumber: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-primary">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{companyName}</p>
      <p className="mt-1 text-xs text-slate-500">{businessNumber}</p>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TermsBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function Agreement({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-bold text-slate-900">{value}</dd>
    </div>
  );
}
