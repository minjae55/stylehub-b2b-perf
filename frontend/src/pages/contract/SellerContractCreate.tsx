import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isAxiosError } from "axios";
import SignaturePad from "signature_pad";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  FileSearch,
  Package,
  PenLine,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import api from "@/api/axios";

type QuoteItem = {
  quoteItemId: number;
  optionSummary: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isSample: boolean;
};

type QuoteDetail = {
  quoteId: number;
  quoteNo: string;
  productName: string;
  material: string | null;
  leadTimeDays: number;
  deliveryCompany: string | null;
  shippingFee: number;
  totalAmount: number;
  status: string;
  buyerName: string;
  sellerName: string;
  companyName: string;
  items: QuoteItem[];
};

type ContractForm = {
  contractName: string;
  deliveryDate: string;
  paymentTerms: string;
  returnPolicy: string;
  specialTerms: string;
};

type ContractCreateResponse = {
  contractId: number;
  quoteId: number;
  contractName: string;
  status: string;
};

type ContractDraft = {
  contractId: number;
  contractName: string | null;
  status: string;
  deliveryDate: string;
  paymentTerms: string;
  returnPolicy: string;
  specialTerms: string | null;
};

// new Date().toISOString()는 항상 UTC 기준 날짜를 반환한다. 한국(KST, UTC+9)에서는
// 자정부터 오전 9시 사이에 이 함수를 호출하면 실제 로컬 날짜보다 하루 이른 날짜가 나와서,
// 그 값을 그대로 납품 예정일 기본값/최소값으로 쓰면 서버의 @FutureOrPresent 검증(서버 기준
// "오늘")에 걸려 계약 초안 저장/미리보기/서명 발송이 전부 400(잘못된 입력값입니다)으로
// 실패했다. 로컬 타임존 기준 연/월/일을 직접 조합해 이 문제를 피한다.
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const INITIAL_FORM: ContractForm = {
  contractName: "",
  deliveryDate: getToday(),
  paymentTerms: "계약 체결 후 합의된 결제 수단과 일정에 따라 대금을 지급합니다.",
  returnPolicy:
    "납품 상품의 하자 또는 계약 내용과 다른 상품이 확인된 경우, 당사자 간 확인 후 교환 또는 반품을 진행합니다.",
  specialTerms: "",
};

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function SignatureCanvas({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const signaturePad = new SignaturePad(canvas, {
      minWidth: 0.7,
      maxWidth: 2.8,
      velocityFilterWeight: 0.7,
      penColor: "#172033",
    });
    signaturePadRef.current = signaturePad;

    if (value) {
      void signaturePad.fromDataURL(value);
    }

    const handleEndStroke = () => {
      if (!signaturePad.isEmpty()) {
        onChange(signaturePad.toDataURL("image/png"));
      }
    };

    signaturePad.addEventListener("endStroke", handleEndStroke);

    return () => {
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, [onChange, value]);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    onChange("");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">손서명</span>
        <button
          type="button"
          onClick={clearSignature}
          disabled={!value}
          title="서명 다시 작성"
          className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div
        className={`relative mt-1.5 overflow-hidden rounded-md border-2 bg-white ${
          value ? "border-primary/60" : "border-dashed border-slate-200"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="h-44 w-full touch-none cursor-crosshair"
        />
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            <PenLine size={30} />
            <p className="mt-2 text-xs font-semibold">
              마우스나 손가락으로 서명해 주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SellerContractCreate() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuoteDetail>();
  const [contractId, setContractId] = useState<number | null>(null);
  const [form, setForm] = useState<ContractForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState("");
  const [signatureDraft, setSignatureDraft] = useState("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [agreements, setAgreements] = useState({
    items: false,
    delivery: false,
    signature: false,
  });
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!quoteId) {
      setLoadError("견적 정보를 확인할 수 없습니다.");
      setIsLoading(false);
      return;
    }

    const loadQuote = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await api.get<QuoteDetail>(`/quotes/${quoteId}`);
        setQuote(response);
        setForm((previous) => ({
          ...previous,
          contractName: `${response.productName} 공급 계약`,
        }));

        try {
          const draft = await api.get<ContractDraft>(
            `/seller/contracts/quotes/${quoteId}`
          );

          if (draft.status !== "DRAFT") {
            navigate(`/seller/contracts/quotes/${quoteId}`, {
              replace: true,
            });
            return;
          }

          setContractId(draft.contractId);
          setDraftMessage("저장된 계약서 초안을 불러왔습니다.");
          setForm({
            contractName:
              draft.contractName?.trim() ||
              `${response.productName} 공급 계약`,
            deliveryDate: draft.deliveryDate,
            paymentTerms: draft.paymentTerms,
            returnPolicy: draft.returnPolicy,
            specialTerms: draft.specialTerms ?? "",
          });
        } catch (error) {
          // 아직 계약 초안이 없는 404는 신규 작성의 정상 흐름이다.
          if (!isAxiosError(error) || error.response?.status !== 404) {
            throw error;
          }
        }
      } catch (error) {
        console.error("계약서 작성을 위한 견적 조회 실패", error);
        setLoadError("채택된 견적 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuote();
  }, [navigate, quoteId]);

  const contractItems = useMemo(
    () => quote?.items.filter((item) => !item.isSample) ?? [],
    [quote]
  );

  const totalQuantity = useMemo(
    () => contractItems.reduce((sum, item) => sum + item.quantity, 0),
    [contractItems]
  );

  const canSave =
    quote?.status === "APPROVED" &&
    form.contractName.trim().length > 0 &&
    form.deliveryDate.length > 0 &&
    form.paymentTerms.trim().length > 0 &&
    form.returnPolicy.trim().length > 0 &&
    !isSaving;

  const canSignAndSend =
    canSave &&
    signatureText.trim().length > 0 &&
    signatureImage.length > 0 &&
    agreements.items &&
    agreements.delivery &&
    agreements.signature &&
    !isSending;

  const updateForm = (field: keyof ContractForm, value: string) => {
    setDraftMessage("");
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const openSignatureModal = () => {
    setSignatureDraft(signatureImage);
    setIsSignatureModalOpen(true);
  };

  const applySignature = () => {
    if (!signatureDraft) return;
    setSignatureImage(signatureDraft);
    setUploadedSignatureUrl("");
    setIsSignatureModalOpen(false);
  };

  const persistDraft = async () => {
    if (!quote) throw new Error("견적 정보를 확인할 수 없습니다.");

    const request = {
      quoteId: quote.quoteId,
      contractName: form.contractName.trim(),
      deliveryDate: form.deliveryDate,
      paymentTerms: form.paymentTerms.trim(),
      returnPolicy: form.returnPolicy.trim(),
      specialTerms: form.specialTerms.trim() || null,
    };

    // 이미 저장한 초안이 있다면 새 계약을 만들지 않고 기존 초안을 수정한다.
    if (contractId) {
      await api.patch(`/seller/contracts/${contractId}`, {
        contractName: request.contractName,
        deliveryDate: request.deliveryDate,
        paymentTerms: request.paymentTerms,
        returnPolicy: request.returnPolicy,
        specialTerms: request.specialTerms,
      });

      return contractId;
    }

    // 최초 저장일 때만 계약 초안을 생성하고 반환된 PK를 보관한다.
    const createdContract =
      await api.post<ContractCreateResponse>("/seller/contracts", request);

    setContractId(createdContract.contractId);
    return createdContract.contractId;
  };

  const handleSaveDraft = async () => {
    if (!quote || !canSave) return;

    try {
      setIsSaving(true);
      setSaveError("");

      await persistDraft();
      setDraftMessage("계약서 초안이 임시 저장되었습니다.");
    } catch (error) {
      console.error("계약서 초안 저장 실패", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "계약서 초안을 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadSignature = async (contractId: number) => {
    if (uploadedSignatureUrl) {
      return uploadedSignatureUrl;
    }

    const response = await fetch(signatureImage);
    const blob = await response.blob();
    const file = new File(
      [blob],
      `contract-signature-${contractId}.png`,
      { type: "image/png" }
    );
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", "contract-signatures");

    const imageUrl = await api.post<string>("/common/image/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setUploadedSignatureUrl(imageUrl);
    return imageUrl;
  };

  const handlePreview = async () => {
    if (!canSave || isPreviewing) return;

    // 브라우저의 팝업 차단을 피하기 위해 클릭 시점에 빈 탭을 먼저 연다.
    const previewWindow = window.open("about:blank", "_blank");

    if (!previewWindow) {
      setSaveError("팝업이 차단되어 PDF 미리보기를 열 수 없습니다.");
      return;
    }

    previewWindow.opener = null;

    try {
      setIsPreviewing(true);
      setSaveError("");

      // 최신 입력값을 초안에 반영하고, 작성한 서명이 있으면 미리보기용으로 함께 전달한다.
      const savedContractId = await persistDraft();
      const signatureImageUrl = signatureImage
        ? await uploadSignature(savedContractId)
        : null;

      const previewResponse = await fetch(
        `/api/seller/contracts/${savedContractId}/preview`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signatureText:
              signatureImageUrl
                ? signatureText.trim() || quote?.sellerName || "판매자"
                : null,
            signatureImageUrl,
          }),
        }
      );

      if (!previewResponse.ok) {
        const errorResponse = await previewResponse
          .json()
          .catch(() => null);

        throw new Error(
          errorResponse?.message ?? "계약서 PDF를 생성하지 못했습니다."
        );
      }

      const previewBlob = await previewResponse.blob();
      const previewUrl = URL.createObjectURL(previewBlob);
      previewWindow.location.href = previewUrl;
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);

      setDraftMessage(
        signatureImage
          ? "현재 서명을 포함한 계약서 미리보기를 생성했습니다."
          : "최신 내용으로 계약서 미리보기를 생성했습니다."
      );
    } catch (error) {
      previewWindow.close();
      console.error("계약서 PDF 미리보기 실패", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "계약서 PDF 미리보기를 생성하지 못했습니다."
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSignAndSend = async () => {
    if (!quote || !canSignAndSend) return;

    try {
      setIsSending(true);
      setSaveError("");

      const savedContractId = await persistDraft();
      const signatureImageUrl = await uploadSignature(savedContractId);

      await api.post(`/seller/contracts/${savedContractId}/sign`, {
        signatureText: signatureText.trim(),
        signatureImageUrl,
      });

      navigate(`/seller/contracts/quotes/${quote.quoteId}`);
    } catch (error) {
      console.error("계약서 서명 및 발송 실패", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "계약서를 서명하여 발송하지 못했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center text-sm font-semibold text-slate-500">
        견적 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (!quote || loadError) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-rose-400" size={42} />
        <h1 className="mt-4 text-xl font-black text-slate-900">
          계약서를 작성할 수 없습니다.
        </h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <Link
          to="/seller/quotes"
          className="mt-6 inline-flex h-10 items-center bg-primary px-5 text-sm font-bold text-white"
        >
          견적 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1380px] items-center gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to={`/seller/quotes/${quote.quoteId}`}
              title="견적 상세로 돌아가기"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronLeft size={19} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-950">
                상품 공급계약서
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                계약 대상: {quote.productName} · 연동 견적 {quote.quoteNo}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1380px] items-start gap-6 px-4 py-7 sm:px-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {quote.status !== "APPROVED" && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              채택 완료된 견적서만 계약서로 작성할 수 있습니다.
            </div>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="contract-name" className="block">
              <span className="text-sm font-black text-slate-900">
                관리용 계약명
              </span>
              <span className="ml-2 text-xs font-semibold text-rose-500">
                필수
              </span>
              <input
                id="contract-name"
                type="text"
                maxLength={150}
                value={form.contractName}
                onChange={(event) =>
                  updateForm("contractName", event.target.value)
                }
                placeholder="예: 2026 여름 린넨 셔츠 1차 공급 계약"
                className="mt-3 h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="mt-2 flex items-start justify-between gap-4">
              <p className="text-xs leading-5 text-slate-500">
                계약 목록과 검색에서 사용하는 이름이며, 공식 문서 제목은
                상품 공급계약서로 표시됩니다.
              </p>
              <span className="shrink-0 text-xs font-semibold text-slate-400">
                {form.contractName.length}/150
              </span>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                <Building2 size={17} />
                발주자 (Buyer)
              </div>
              <p className="mt-4 text-lg font-black text-slate-950">
                {quote.buyerName || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                견적을 채택한 구매 담당자
              </p>
            </div>

            <div className="rounded-lg border border-l-4 border-slate-200 border-l-blue-600 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                <Building2 size={17} />
                공급자 (Seller)
              </div>
              <p className="mt-4 text-lg font-black text-slate-950">
                {quote.companyName || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                담당자 {quote.sellerName || "-"}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Package size={17} className="text-slate-500" />
                <h2 className="text-sm font-black text-slate-900">
                  계약 품목 리스트
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                총 {contractItems.length}건 ·{" "}
                {totalQuantity.toLocaleString("ko-KR")}개
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">품목명 / 상세 옵션</th>
                    <th className="px-4 py-3 text-right">단가</th>
                    <th className="px-4 py-3 text-right">수량</th>
                    <th className="px-5 py-3 text-right">합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractItems.map((item) => (
                    <tr
                      key={item.quoteItemId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-900">
                          {quote.productName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.optionSummary || "기본 옵션"}
                          {quote.material ? ` · ${quote.material}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                        {item.quantity.toLocaleString("ko-KR")}개
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-black text-slate-950">
                        {formatPrice(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-900">핵심 계약 조건</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="flex items-center gap-2 text-xs font-black text-slate-600">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <CalendarDays size={16} />
                  </span>
                  납품 예정일
                </span>
                <input
                  type="date"
                  min={getToday()}
                  value={form.deliveryDate}
                  onChange={(event) =>
                    updateForm("deliveryDate", event.target.value)
                  }
                  className="mt-3 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                />
              </label>

              <div>
                <span className="flex items-center gap-2 text-xs font-black text-slate-600">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <Truck size={16} />
                  </span>
                  견적 기준 배송
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">
                  {quote.deliveryCompany || "협의 배송"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  배송비{" "}
                  {quote.shippingFee === 0
                    ? "무료"
                    : formatPrice(quote.shippingFee)}
                </p>
              </div>

              <div>
                <span className="flex items-center gap-2 text-xs font-black text-slate-600">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <ShieldCheck size={16} />
                  </span>
                  제작·검수 기준
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">
                  리드타임 {quote.leadTimeDays}일
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  수령 후 품목·수량·하자 검수
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-black text-slate-900">
                세부 계약 조건
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                바이어에게 발송할 결제·반품·특약 조건입니다.
              </p>
            </div>
            <div className="grid gap-5 p-5">
              <label>
                <span className="text-xs font-black text-slate-600">
                  대금 결제 조건
                </span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.paymentTerms}
                  onChange={(event) =>
                    updateForm("paymentTerms", event.target.value)
                  }
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-blue-500"
                />
                <span className="mt-1 block text-right text-[11px] text-slate-400">
                  {form.paymentTerms.length}/500
                </span>
              </label>

              <label>
                <span className="text-xs font-black text-slate-600">
                  반품 및 교환 조건
                </span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.returnPolicy}
                  onChange={(event) =>
                    updateForm("returnPolicy", event.target.value)
                  }
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-blue-500"
                />
              </label>

              <label>
                <span className="text-xs font-black text-slate-600">
                  특약 사항
                </span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.specialTerms}
                  onChange={(event) =>
                    updateForm("specialTerms", event.target.value)
                  }
                  placeholder="별도로 합의한 조건이 있다면 입력하세요."
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:col-span-4">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="bg-[#172033] p-5 text-white">
              <p className="text-xs font-black text-white/60">계약 요약</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <span className="text-sm text-white/75">최종 합계 금액</span>
                <span className="text-2xl font-black">
                  {formatPrice(quote.totalAmount)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-xs">
                <div>
                  <p className="text-white/50">상품 금액</p>
                  <p className="mt-1 font-bold">
                    {formatPrice(quote.totalAmount - quote.shippingFee)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/50">배송비</p>
                  <p className="mt-1 font-bold">
                    {quote.shippingFee === 0
                      ? "무료"
                      : formatPrice(quote.shippingFee)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-sm font-black text-slate-900">
                계약 확인 및 동의
              </h2>
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 transition hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={
                    agreements.items &&
                    agreements.delivery &&
                    agreements.signature
                  }
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAgreements({
                      items: checked,
                      delivery: checked,
                      signature: checked,
                    });
                  }}
                  className="size-4 shrink-0 accent-blue-600"
                />
                <span className="text-sm font-black text-slate-900">
                  전체 선택 및 동의
                </span>
              </label>
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {[
                  {
                    key: "items" as const,
                    title: "품목 및 수량 확인",
                    description: "계약 상품의 옵션과 수량이 정확합니다.",
                  },
                  {
                    key: "delivery" as const,
                    title: "납기 및 배송 조건 확인",
                    description: "견적 기준 배송비와 납품일을 확인했습니다.",
                  },
                  {
                    key: "signature" as const,
                    title: "전자서명 동의",
                    description: "위 계약 내용에 전자서명하는 것에 동의합니다.",
                  },
                ].map((agreement) => (
                  <label
                    key={agreement.key}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={agreements[agreement.key]}
                      onChange={(event) =>
                        setAgreements((previous) => ({
                          ...previous,
                          [agreement.key]: event.target.checked,
                        }))
                      }
                      className="mt-0.5 size-4 shrink-0 accent-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">
                        {agreement.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        {agreement.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <label className="text-xs font-black text-slate-600">
                  서명자 성명
                </label>
                <div className="relative mt-2">
                  <PenLine
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={signatureText}
                    onChange={(event) => setSignatureText(event.target.value)}
                    maxLength={100}
                    placeholder="성함을 입력하세요"
                    className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-600">전자 서명</p>
                  {signatureImage && (
                    <button
                      type="button"
                      onClick={openSignatureModal}
                      className="text-xs font-bold text-slate-500 hover:text-blue-700"
                    >
                      다시 작성
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openSignatureModal}
                  className="mt-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-400 hover:bg-blue-50/40"
                >
                  {signatureImage ? (
                    <img
                      src={signatureImage}
                      alt="작성한 손서명"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-400">
                      <PenLine size={25} />
                      클릭하여 서명해 주세요
                    </span>
                  )}
                </button>
              </div>

              {saveError && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                  <AlertCircle size={14} className="shrink-0" />
                  {saveError}
                </div>
              )}

              {draftMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                  <Check size={14} className="shrink-0" />
                  {draftMessage}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={!canSave || isPreviewing || isSending}
                  onClick={handlePreview}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FileSearch size={15} />
                  {isPreviewing ? "생성 중..." : "PDF 미리보기"}
                </button>
                <button
                  type="button"
                  disabled={!canSave || isSending}
                  onClick={handleSaveDraft}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={15} />
                  {isSaving ? "저장 중..." : "임시 저장"}
                </button>
              </div>

              <button
                type="button"
                disabled={!canSignAndSend}
                onClick={handleSignAndSend}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSending ? "발송 중..." : "서명 후 바이어에게 전송"}
                <Send size={16} />
              </button>
              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                발송 후에는 계약 조건을 수정할 수 없습니다.
              </p>
            </div>
          </section>
        </aside>
      </main>

      {isSignatureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signature-modal-title"
        >
          <div className="w-full max-w-[720px] rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="signature-modal-title"
                  className="text-lg font-black text-slate-950"
                >
                  판매자 손서명
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  계약서에 사용할 서명을 아래 영역에 작성하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                title="닫기"
                className="inline-flex size-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6">
              <SignatureCanvas
                value={signatureDraft}
                onChange={setSignatureDraft}
              />
              <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                적용한 서명은 계약 발송 시 서명 이미지로 저장됩니다.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="h-10 rounded-md border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!signatureDraft}
                onClick={applySignature}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={16} />
                서명 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
