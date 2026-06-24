import { useState, useRef } from "react";
import { Link, useLocation } from "react-router";
import {
    CheckCircle, Upload, Package, Plus,
    Trash2, FileText, ChevronRight, X,
} from "lucide-react";

const DUMMY_BUYER = {
    buyerId: 7,
};

const CATEGORY_MAP: Record<string, string[]> = {
    "상의":           ["티셔츠", "블라우스", "니트", "셔츠", "후드/맨투맨", "기타 상의"],
    "하의":           ["팬츠", "스커트", "데님", "레깅스", "기타 하의"],
    "원피스/세트":    ["원피스", "투피스 세트", "점프수트", "기타"],
    "아우터":         ["코트", "자켓", "가디건", "패딩", "기타 아우터"],
    "이너/언더웨어":  ["이너웨어", "브라탑", "속옷 세트", "기타"],
    "스포츠/애슬레저":["요가복", "러닝복", "트레이닝", "기타"],
    "액세서리":       ["가방", "모자", "스카프", "기타 액세서리"],
    "OEM/자체제작":   ["OEM", "ODM", "자체 브랜드", "기타"],
};
const MAIN_CATS = Object.keys(CATEGORY_MAP);

type SourcingType = "READY" | "CUSTOM";

const CUSTOM_DETAIL_PLACEHOLDER = `파일 외에 강조하고 싶은 사항을 자유롭게 적어주세요.
(예: 3페이지 컬러 샘플은 블랙을 우선 진행 부탁드립니다)`;

interface ReadyOptionPair {
    optionName: string;
    optionValue: string;
}

interface ReadyOptionRow {
    id: string;
    pairs: ReadyOptionPair[];
    quantity: string;
    sampleQuantity: string;
}

interface CustomOptionRow {
    id: string;
    optionName: string;
    quantity: string;
    sampleQuantity: string;
}

const makeReadyOption = (): ReadyOptionRow => ({
    id: crypto.randomUUID(),
    pairs: [
        { optionName: "색상", optionValue: "" },
        { optionName: "사이즈", optionValue: "" },
    ],
    quantity: "",
    sampleQuantity: "",
});

const makeCustomOption = (): CustomOptionRow => ({
    id: crypto.randomUUID(),
    optionName: "",
    quantity: "",
    sampleQuantity: "",
});

interface SourcingItem {
    id: string;
    type: SourcingType;
    productName: string;
    deliveryDate: string;
    expiryDate: string;
    needSample: "Y" | "N" | "";
    mainMaterial: string;
    brandName: string;
    mainCategory: string;
    subCategory: string;
    subCategoryId: number | null;
    unitPrice: string;
    refUrl: string;
    readyOptions: ReadyOptionRow[];
    refImageFile: File | null;
    totalBudget: string;
    customOptions: CustomOptionRow[];
    detail: string;
    workFiles: File[];
}

const makeItem = (): SourcingItem => ({
    id: crypto.randomUUID(),
    type: "READY",
    productName: "",
    deliveryDate: "",
    expiryDate: "",
    needSample: "",
    mainMaterial: "",
    brandName: "",
    mainCategory: "",
    subCategory: "",
    subCategoryId: null,
    unitPrice: "",
    refUrl: "",
    readyOptions: [makeReadyOption()],
    refImageFile: null,
    totalBudget: "",
    customOptions: [makeCustomOption()],
    detail: "",
    workFiles: [],
});

const sumReadyQty = (rows: ReadyOptionRow[]) =>
    rows.reduce((acc, r) => acc + (parseInt(r.quantity) || 0), 0);

const sumReadySampleQty = (rows: ReadyOptionRow[]) =>
    rows.reduce((acc, r) => acc + (parseInt(r.sampleQuantity) || 0), 0);

const sumCustomQty = (rows: CustomOptionRow[]) =>
    rows.reduce((acc, r) => acc + (parseInt(r.quantity) || 0), 0);

const sumCustomSampleQty = (rows: CustomOptionRow[]) =>
    rows.reduce((acc, r) => acc + (parseInt(r.sampleQuantity) || 0), 0);

function buildOptionSummary(pairs: ReadyOptionPair[]) {
    return pairs
        .filter((p) => p.optionName.trim() || p.optionValue.trim())
        .map((p) => `${p.optionName.trim()}: ${p.optionValue.trim()}`)
        .join(" / ");
}

// ── API 호출 유틸 ─────────────────────────────────────────────────────
const BASE_URL = "/api/sourcing";

async function postSourcingRequest(
    buyerId: number,
    item: SourcingItem
): Promise<number> {
    const body = {
        buyerId,
        items: [{
            type: item.type,
            productName: item.productName,
            brandName: item.brandName || null,
            subCategoryId: item.subCategoryId,
            needSample: item.needSample,
            mainMaterial: item.mainMaterial || null,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            refUrl: item.refUrl || null,
            totalBudget: item.totalBudget ? Number(item.totalBudget) : null,
            detail: item.detail || null,
            deliveryDate: item.deliveryDate || null,
            expiryDate: item.expiryDate || null,
            options:
                item.type === "READY"
                    ? item.readyOptions.map((r) => ({
                        optionSummary: buildOptionSummary(r.pairs),
                        quantity: Number(r.quantity),
                        sampleQuantity: r.sampleQuantity ? Number(r.sampleQuantity) : null,
                    }))
                    : item.customOptions
                        .filter((r) => r.optionName.trim() || r.quantity)
                        .map((r) => ({
                            optionSummary: r.optionName,
                            quantity: Number(r.quantity) || 0,
                            sampleQuantity: r.sampleQuantity ? Number(r.sampleQuantity) : null,
                        })),
        }],
    };

    const res = await fetch(`${BASE_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`소싱 요청 실패: ${res.status}`);

    const data = await res.json();
    return (data.sourcingRequestIds as number[])[0];
}

async function uploadFiles(
    sourcingRequestId: number,
    fileType: "REF_IMAGE" | "WORK_FILE",
    files: File[]
): Promise<void> {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const res = await fetch(
        `${BASE_URL}/requests/${sourcingRequestId}/files?fileType=${fileType}`,
        { method: "POST", body: formData }
    );

    if (!res.ok) throw new Error(`파일 업로드 실패 (id: ${sourcingRequestId}): ${res.status}`);
}

// ── 유효성 검사 ───────────────────────────────────────────────────────
const isItemValid = (item: SourcingItem): boolean => {
    if (item.type === "READY") {
        const hasOptions = item.readyOptions.some(
            (r) => r.pairs.some((p) => p.optionValue.trim()) && r.quantity
        );
        return !!(
            item.productName &&
            item.mainCategory &&
            item.subCategory &&
            item.unitPrice &&
            hasOptions &&
            item.needSample
        );
    }
    if (item.type === "CUSTOM") {
        return !!(
            item.productName &&
            item.mainCategory &&
            item.subCategory &&
            item.totalBudget &&
            item.workFiles.length > 0 &&
            item.needSample
        );
    }
    return false;
};

const getTotalQty = (item: SourcingItem): number => {
    if (item.type === "READY") return sumReadyQty(item.readyOptions);
    return sumCustomQty(item.customOptions);
};

// ── 메인 페이지 ───────────────────────────────────────────────────────
interface PrefillState {
    prefillItem?: Omit<SourcingItem, "id" | "refImageFile" | "workFiles">;
    isRerequest?: boolean;
    originalRequestId?: string;
}

export function SourcingRequest() {
    const location = useLocation();
    const prefill = (location.state as PrefillState) ?? {};

    const makeInitialItem = (): SourcingItem => {
        if (prefill.prefillItem) {
            return { ...makeItem(), ...prefill.prefillItem };
        }
        return makeItem();
    };

    const [item, setItem] = useState<SourcingItem>(makeInitialItem);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateItem = (id: string, key: keyof SourcingItem, value: unknown) =>
        setItem((prev) => ({ ...prev, [key]: value }));

    const canSubmit = isItemValid(item) && !isLoading;

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const sourcingRequestId = await postSourcingRequest(DUMMY_BUYER.buyerId, item);

            if (item.type === "READY" && item.refImageFile) {
                await uploadFiles(sourcingRequestId, "REF_IMAGE", [item.refImageFile]);
            }
            if (item.type === "CUSTOM" && item.workFiles.length > 0) {
                await uploadFiles(sourcingRequestId, "WORK_FILE", item.workFiles);
            }

            setSubmitted(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "요청 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const imageRef = useRef<HTMLInputElement>(null);
    const workRef = useRef<HTMLInputElement>(null);
    const subCats = item.mainCategory ? CATEGORY_MAP[item.mainCategory] : [];

    const inputCls = "w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white";

    const field = (label: string, required: boolean, children: React.ReactNode, sub?: string) => (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
                {label} {required && <span className="text-primary">*</span>}
                {sub && <span className="text-muted-foreground font-normal text-xs ml-1">{sub}</span>}
            </label>
            {children}
        </div>
    );

    const handleWorkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []);
        updateItem(item.id, "workFiles", [...(item.workFiles ?? []), ...newFiles]);
        e.target.value = "";
    };

    const removeWorkFile = (idx: number) => {
        updateItem(item.id, "workFiles", (item.workFiles ?? []).filter((_, i) => i !== idx));
    };

    const addReadyOption = () =>
        updateItem(item.id, "readyOptions", [...item.readyOptions, makeReadyOption()]);

    const removeReadyOption = (rid: string) =>
        updateItem(item.id, "readyOptions", item.readyOptions.filter((r) => r.id !== rid));

    const updateReadyOptionField = (rid: string, f: "quantity" | "sampleQuantity", val: string) =>
        updateItem(item.id, "readyOptions",
            item.readyOptions.map((r) => r.id === rid ? { ...r, [f]: val } : r));

    const addOptionPair = (rid: string) =>
        updateItem(item.id, "readyOptions",
            item.readyOptions.map((r) =>
                r.id === rid ? { ...r, pairs: [...r.pairs, { optionName: "", optionValue: "" }] } : r));

    const removeOptionPair = (rid: string, pairIndex: number) =>
        updateItem(item.id, "readyOptions",
            item.readyOptions.map((r) =>
                r.id === rid ? { ...r, pairs: r.pairs.filter((_, i) => i !== pairIndex) } : r));

    const updateOptionPair = (rid: string, pairIndex: number, key: keyof ReadyOptionPair, val: string) =>
        updateItem(item.id, "readyOptions",
            item.readyOptions.map((r) =>
                r.id === rid
                    ? { ...r, pairs: r.pairs.map((p, i) => i === pairIndex ? { ...p, [key]: val } : p) }
                    : r));

    const addCustomOption = () =>
        updateItem(item.id, "customOptions", [...item.customOptions, makeCustomOption()]);

    const removeCustomOption = (cid: string) =>
        updateItem(item.id, "customOptions", item.customOptions.filter((r) => r.id !== cid));

    const updateCustomOption = (cid: string, key: keyof CustomOptionRow, val: string) =>
        updateItem(item.id, "customOptions",
            item.customOptions.map((r) => r.id === cid ? { ...r, [key]: val } : r));

    const totalReadyQty = sumReadyQty(item.readyOptions);
    const totalReadySampleQty = sumReadySampleQty(item.readyOptions);
    const totalCustomQty = sumCustomQty(item.customOptions);
    const totalCustomSampleQty = sumCustomSampleQty(item.customOptions);

    if (submitted) {
        return (
            <div className="max-w-[600px] mx-auto px-4 py-20 text-center font-[Inter,sans-serif]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">소싱 요청 완료!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                    소싱 요청서가 접수되었습니다.<br />
                    스타일허브 소싱팀이 검토 후 영업일 <strong className="text-foreground">2~3일</strong> 이내로 연락드립니다.
                </p>
                <div className="bg-secondary border border-primary/20 rounded-lg p-5 text-left text-sm mb-8 space-y-2">
                    <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Package size={15} className="text-primary" /> 요청 내역
                    </div>
                    <div className="flex gap-3 text-muted-foreground">
                        <span className="text-primary font-mono">1.</span>
                        <span>
                            {item.productName} · {item.type === "READY" ? "기성품" : "주문제작"} · {getTotalQty(item).toLocaleString()}개
                        </span>
                    </div>
                </div>
                <div className="flex gap-3 justify-center">
                    <Link to="/suppliers" className="px-6 py-2.5 border border-border rounded font-medium text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        공급업체 목록
                    </Link>
                    <Link to="/" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-semibold text-sm transition-colors">
                        홈으로
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[760px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
            <div className="flex items-center gap-2 mb-1">
                <Package size={22} className="text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                    {prefill.isRerequest ? "소싱 재요청" : "소싱 요청서"}
                </h1>
            </div>

            {prefill.isRerequest && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-4 flex items-center gap-2">
                    <span className="font-semibold">재요청</span> 기존 요청 내용이 불러와졌습니다. 내용을 수정 후 제출하면 새 요청으로 등록됩니다.
                    {prefill.originalRequestId && (
                        <span className="ml-auto text-xs font-mono text-amber-500">원본: {prefill.originalRequestId}</span>
                    )}
                </div>
            )}
            <p className="text-sm text-muted-foreground mb-8">
                원하는 상품을 상세히 입력하면 스타일허브 소싱팀이 최적의 공급업체를 매칭해 드립니다.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4">
                    {error}
                </div>
            )}

            {/* 소싱 요청서 카드 */}
            <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="flex items-center px-5 py-3 border-b border-border bg-secondary/40">
                    <span className="text-sm font-semibold text-foreground">소싱 요청서</span>
                    {item.productName && (
                        <span className="text-xs text-muted-foreground ml-2">— {item.productName}</span>
                    )}
                </div>

                <div className="p-5 space-y-5">
                    {/* 소싱 유형 */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">소싱 유형 <span className="text-primary">*</span></label>
                        <div className="flex gap-3">
                            {(["READY", "CUSTOM"] as SourcingType[]).map((t) => (
                                <label
                                    key={t}
                                    className={`flex-1 flex items-center justify-center gap-2 border rounded py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                                        item.type === t
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t}
                                        checked={item.type === t}
                                        onChange={() => updateItem(item.id, "type", t)}
                                        className="accent-primary"
                                    />
                                    {t === "READY" ? "기성품 (READY)" : "주문제작 (CUSTOM)"}
                                </label>
                            ))}
                        </div>
                    </div>

                    {field("상품명", true,
                        <input
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                            placeholder="예: 여성 린넨 와이드 팬츠"
                            className={inputCls}
                        />
                    )}

                    {item.type === "READY" && (
                        <>
                            {field("브랜드명", false,
                                <input
                                    value={item.brandName}
                                    onChange={(e) => updateItem(item.id, "brandName", e.target.value)}
                                    placeholder="예: 빈폴, 자체 브랜드 등 (없으면 비워두세요)"
                                    className={inputCls}
                                />,
                                "(선택)"
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {field("대카테고리", true,
                                    <select
                                        value={item.mainCategory}
                                        onChange={(e) => {
                                            updateItem(item.id, "mainCategory", e.target.value);
                                            updateItem(item.id, "subCategory", "");
                                            updateItem(item.id, "subCategoryId", 6);
                                        }}
                                        className={inputCls}
                                    >
                                        <option value="">선택하세요</option>
                                        {MAIN_CATS.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                )}
                                {field("중카테고리", true,
                                    <select
                                        value={item.subCategory}
                                        onChange={(e) => {
                                            updateItem(item.id, "subCategory", e.target.value);
                                            updateItem(item.id, "subCategoryId", 6);
                                        }}
                                        className={inputCls}
                                        disabled={!item.mainCategory}
                                    >
                                        <option value="">선택하세요</option>
                                        {(item.mainCategory ? CATEGORY_MAP[item.mainCategory] : []).map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                )}
                            </div>

                            {field("희망 단가", true,
                                <div className="relative">
                                    <input
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                                        placeholder="예: 15,000"
                                        type="number"
                                        min="0"
                                        className={`${inputCls} pr-8`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
                                </div>
                            )}

                            {field("주소재", false,
                                <input
                                    value={item.mainMaterial}
                                    onChange={(e) => updateItem(item.id, "mainMaterial", e.target.value)}
                                    placeholder="예: 린넨, 코튼 100%, 폴리에스터 혼방"
                                    className={inputCls}
                                />,
                                "(선택)"
                            )}

                            {field("레퍼런스 URL", false,
                                <input
                                    value={item.refUrl}
                                    onChange={(e) => updateItem(item.id, "refUrl", e.target.value)}
                                    placeholder="예: https://www.musinsa.com/..."
                                    type="url"
                                    className={inputCls}
                                />,
                                "(선택)"
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    샘플 필요 여부 <span className="text-primary">*</span>
                                </label>
                                <div className="flex gap-3">
                                    {(["Y", "N"] as const).map((v) => (
                                        <label
                                            key={v}
                                            className={`flex-1 flex items-center justify-center gap-2 border rounded py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                                                item.needSample === v
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="sample"
                                                value={v}
                                                checked={item.needSample === v}
                                                onChange={() => updateItem(item.id, "needSample", v)}
                                                className="accent-primary"
                                            />
                                            {v === "Y" ? "필요" : "불필요"}
                                        </label>
                                    ))}
                                </div>
                                {item.needSample === "Y" && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        샘플비는 바이어 부담이며 환불되지 않습니다.
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-foreground">
                                        옵션별 수량 <span className="text-primary">*</span>
                                    </label>
                                    {totalReadyQty > 0 && (
                                        <span className="text-xs text-muted-foreground flex gap-3">
                                            <span>총 <strong className="text-foreground">{totalReadyQty.toLocaleString()}</strong>개</span>
                                            {item.needSample === "Y" && totalReadySampleQty > 0 && (
                                                <span className="text-primary">샘플 <strong>{totalReadySampleQty.toLocaleString()}</strong>개</span>
                                            )}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {item.readyOptions.map((row, rowIndex) => {
                                        const summary = buildOptionSummary(row.pairs);
                                        return (
                                            <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">품목 {rowIndex + 1}</p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">옵션명과 옵션값을 입력하고 수량을 설정하세요.</p>
                                                    </div>
                                                    {item.readyOptions.length > 1 && (
                                                        <button
                                                            onClick={() => removeReadyOption(row.id)}
                                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    {row.pairs.map((pair, pairIndex) => (
                                                        <div key={pairIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                                            <input
                                                                type="text"
                                                                value={pair.optionName}
                                                                onChange={(e) => updateOptionPair(row.id, pairIndex, "optionName", e.target.value)}
                                                                placeholder="옵션명 예: 색상"
                                                                className={inputCls}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={pair.optionValue}
                                                                onChange={(e) => updateOptionPair(row.id, pairIndex, "optionValue", e.target.value)}
                                                                placeholder="옵션값 예: 블랙"
                                                                className={inputCls}
                                                            />
                                                            {row.pairs.length > 1 ? (
                                                                <button
                                                                    onClick={() => removeOptionPair(row.id, pairIndex)}
                                                                    className="rounded-lg border border-border bg-white px-2 text-muted-foreground hover:border-red-200 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            ) : (
                                                                <div className="w-9" />
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addOptionPair(row.id)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                                                    >
                                                        <Plus size={13} /> 옵션 추가
                                                    </button>
                                                </div>

                                                <div className={`grid gap-3 ${item.needSample === "Y" ? "grid-cols-2" : "grid-cols-1"}`}>
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                                            수량 <span className="text-primary">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                value={row.quantity}
                                                                onChange={(e) => updateReadyOptionField(row.id, "quantity", e.target.value)}
                                                                placeholder="0"
                                                                type="number"
                                                                min="0"
                                                                className={`${inputCls} pr-6`}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">개</span>
                                                        </div>
                                                    </div>
                                                    {item.needSample === "Y" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">샘플 수량</label>
                                                            <div className="relative">
                                                                <input
                                                                    value={row.sampleQuantity}
                                                                    onChange={(e) => updateReadyOptionField(row.id, "sampleQuantity", e.target.value)}
                                                                    placeholder="0"
                                                                    type="number"
                                                                    min="0"
                                                                    className={`${inputCls} pr-6`}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">개</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {summary && (
                                                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground">
                                                        옵션 요약 <span className="ml-2 font-semibold text-foreground">{summary}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={addReadyOption}
                                    className="mt-3 w-full border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary rounded-lg py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Plus size={13} /> 품목 추가
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    참고 이미지 <span className="text-muted-foreground font-normal text-xs">(선택 · PDF/이미지)</span>
                                </label>
                                <input
                                    ref={imageRef}
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => updateItem(item.id, "refImageFile", e.target.files?.[0] ?? null)}
                                />
                                {item.refImageFile ? (
                                    <div className="flex items-center gap-3 border border-primary/40 bg-primary/5 rounded px-3 py-2">
                                        <FileText size={16} className="text-primary flex-shrink-0" />
                                        <span className="text-sm flex-1 truncate">{item.refImageFile.name}</span>
                                        <button onClick={() => updateItem(item.id, "refImageFile", null)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => imageRef.current?.click()}
                                        className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                                    >
                                        <Upload size={18} className="mx-auto text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                                        <div className="text-xs text-muted-foreground">클릭하여 파일 첨부 <span className="text-primary font-medium">파일 선택</span></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {item.type === "CUSTOM" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                {field("대카테고리", true,
                                    <select
                                        value={item.mainCategory}
                                        onChange={(e) => {
                                            updateItem(item.id, "mainCategory", e.target.value);
                                            updateItem(item.id, "subCategory", "");
                                            updateItem(item.id, "subCategoryId", null);
                                        }}
                                        className={inputCls}
                                    >
                                        <option value="">선택하세요</option>
                                        {MAIN_CATS.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                )}
                                {field("중카테고리", true,
                                    <select
                                        value={item.subCategory}
                                        onChange={(e) => {
                                            updateItem(item.id, "subCategory", e.target.value);
                                            updateItem(item.id, "subCategoryId", 6);
                                        }}
                                        className={inputCls}
                                        disabled={!item.mainCategory}
                                    >
                                        <option value="">선택하세요</option>
                                        {subCats.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                )}
                            </div>

                            {field("전체 예산", true,
                                <div className="relative">
                                    <input
                                        value={item.totalBudget}
                                        onChange={(e) => updateItem(item.id, "totalBudget", e.target.value)}
                                        placeholder="예: 3,000,000"
                                        type="number"
                                        min="0"
                                        className={`${inputCls} pr-8`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
                                </div>
                            )}

                            {field("주소재", false,
                                <input
                                    value={item.mainMaterial}
                                    onChange={(e) => updateItem(item.id, "mainMaterial", e.target.value)}
                                    placeholder="예: 울 혼방, 친환경 소재 선호 등 (작업지시서에 포함 시 생략 가능)"
                                    className={inputCls}
                                />,
                                "(선택)"
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    샘플 필요 여부 <span className="text-primary">*</span>
                                </label>
                                <div className="flex gap-3">
                                    {(["Y", "N"] as const).map((v) => (
                                        <label
                                            key={v}
                                            className={`flex-1 flex items-center justify-center gap-2 border rounded py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                                                item.needSample === v
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="sample"
                                                value={v}
                                                checked={item.needSample === v}
                                                onChange={() => updateItem(item.id, "needSample", v)}
                                                className="accent-primary"
                                            />
                                            {v === "Y" ? "필요" : "불필요"}
                                        </label>
                                    ))}
                                </div>
                                {item.needSample === "Y" && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        샘플비는 바이어 부담이며 환불되지 않습니다.
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-foreground">
                                        옵션별 수량
                                        <span className="text-muted-foreground font-normal text-xs ml-1">(선택)</span>
                                    </label>
                                    {totalCustomQty > 0 && (
                                        <span className="text-xs text-muted-foreground flex gap-3">
                                            <span>총 <strong className="text-foreground">{totalCustomQty.toLocaleString()}</strong>개</span>
                                            {item.needSample === "Y" && totalCustomSampleQty > 0 && (
                                                <span className="text-primary">샘플 <strong>{totalCustomSampleQty.toLocaleString()}</strong>개</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">작업지시서에 포함된 경우 생략 가능합니다.</p>

                                <div className={`grid gap-2 mb-1.5 px-1 ${item.needSample === "Y" ? "grid-cols-[1fr_100px_100px_32px]" : "grid-cols-[1fr_120px_32px]"}`}>
                                    <span className="text-xs text-muted-foreground">옵션명 <span className="font-normal">(예: 소재 A, 패턴1)</span></span>
                                    <span className="text-xs text-muted-foreground">수량</span>
                                    {item.needSample === "Y" && <span className="text-xs text-muted-foreground">샘플 수량</span>}
                                    <span />
                                </div>

                                <div className="space-y-2">
                                    {item.customOptions.map((row) => (
                                        <div key={row.id} className={`grid gap-2 items-center ${item.needSample === "Y" ? "grid-cols-[1fr_100px_100px_32px]" : "grid-cols-[1fr_120px_32px]"}`}>
                                            <input
                                                value={row.optionName}
                                                onChange={(e) => updateCustomOption(row.id, "optionName", e.target.value)}
                                                placeholder="예: 소재 A"
                                                className={inputCls}
                                            />
                                            <div className="relative">
                                                <input
                                                    value={row.quantity}
                                                    onChange={(e) => updateCustomOption(row.id, "quantity", e.target.value)}
                                                    placeholder="0"
                                                    type="number"
                                                    min="0"
                                                    className={`${inputCls} pr-6`}
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">개</span>
                                            </div>
                                            {item.needSample === "Y" && (
                                                <div className="relative">
                                                    <input
                                                        value={row.sampleQuantity}
                                                        onChange={(e) => updateCustomOption(row.id, "sampleQuantity", e.target.value)}
                                                        placeholder="0"
                                                        type="number"
                                                        min="0"
                                                        className={`${inputCls} pr-6`}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">개</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeCustomOption(row.id)}
                                                disabled={item.customOptions.length === 1}
                                                className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={addCustomOption}
                                    className="mt-2 w-full border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary rounded py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Plus size={13} /> 옵션 추가
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    작업지시서 및 참고 파일 <span className="text-primary">*</span>
                                    <span className="text-muted-foreground font-normal text-xs ml-1">(PDF/이미지 · 다중 첨부 가능)</span>
                                </label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    희망 소재·원단, 라벨/택 요구사항은 작업지시서에 포함해 주세요.
                                </p>
                                <input ref={workRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={handleWorkFiles} />
                                {item.workFiles.length > 0 && (
                                    <div className="space-y-1.5 mb-2">
                                        {item.workFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 border border-primary/40 bg-primary/5 rounded px-3 py-2">
                                                <FileText size={14} className="text-primary flex-shrink-0" />
                                                <span className="text-sm flex-1 truncate">{f.name}</span>
                                                <button onClick={() => removeWorkFile(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    onClick={() => workRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer group ${
                                        item.workFiles.length === 0 ? "border-red-300 hover:border-primary/50" : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <Upload size={18} className="mx-auto text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                                    <div className="text-xs text-muted-foreground">클릭하여 파일 추가 <span className="text-primary font-medium">파일 선택</span></div>
                                </div>
                                {item.workFiles.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1.5">작업지시서는 필수 첨부 항목입니다.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    세부 요구사항 <span className="text-muted-foreground font-normal text-xs">(선택)</span>
                                </label>
                                <textarea
                                    value={item.detail}
                                    onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                                    rows={3}
                                    placeholder={CUSTOM_DETAIL_PLACEHOLDER}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {field("희망 납기일", false,
                            <input
                                value={item.deliveryDate}
                                onChange={(e) => updateItem(item.id, "deliveryDate", e.target.value)}
                                type="date"
                                className={inputCls}
                            />
                        )}
                        {field("요청 유효기간", false,
                            <input
                                value={item.expiryDate}
                                onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)}
                                type="date"
                                className={inputCls}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end mt-8 pt-6 border-t border-border">
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-sm transition-colors ${
                        canSubmit ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                >
                    {isLoading ? "제출 중..." : <>제출하기 <ChevronRight size={15} /></>}
                </button>
            </div>
        </div>
    );
}
