import {useEffect, useState} from "react";
import {AlertCircle, CheckCircle2, Search, Tag} from "lucide-react";
// ── 공통 API 인스턴스 및 타입 규칙 적용 ──────────────────────────────
import api from "@/api/axios";

export type Category = { id: number; name: string; group: string };

// 규칙 변경: 최소/최대 기준 명학화
const MAX_CATEGORIES = 5;

// ── 실제 백엔드 대분류 카테고리 조회 API 연동 ───────────────────────────
async function fetchCategories(): Promise<Category[]> {
    return await api.get<Category[]>("/categories/main");
}

/**
 * 백엔드 스펙 매칭: 카테고리 개수 유효성 검증 함수
 */
export function isValidCategoryCount(count: number, required: boolean): boolean {
    // 1. 필수인데 0개 고른 경우 탈락
    if (required && count === 0) return false;
    // 2. 언제든 5개를 초과하면 탈락
    if (count > MAX_CATEGORIES) return false;
    // 3. 그 외는 통과 (선택 사항일 때 0개 포함)
    return true;
}

// ── CategoryPicker ────────────────────────────────────────────────────────────
export function CategoryPicker({
                                   selected,
                                   onChange,
                                   title,
                                   description,
                                   required = false, // 💡 기본값을 false(선택 사항)로 변경하여 유연성 확보
                               }: {
    selected: number[];
    onChange: (ids: number[]) => void;
    title: string;
    description: string;
    required?: boolean;
}) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchCategories().then((data) => {
            setCategories(data);
            setLoading(false);
        });
    }, []);

    const toggle = (id: number) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            if (selected.length >= MAX_CATEGORIES) return; // 최대 5개 제한
            onChange([...selected, id]);
        }
    };

    const groups = categories.reduce<Record<string, Category[]>>((acc, cat) => {
        const q = search.trim().toLowerCase();
        if (q && !cat.name.includes(q) && !cat.group.includes(q)) return acc;
        (acc[cat.group] ??= []).push(cat);
        return acc;
    }, {});

    const count = selected.length;

    // 💡 백엔드 조건식 연동
    const isValid = isValidCategoryCount(count, required);

    /**
     * 💡 경고(Warning) 조건 정밀 수정
     * - 필수인데 0개이거나
     * - 선택된 개수가 5개를 초과했을 때 (toggle 막아둬서 초과할 일은 거의 없지만 방어벽)
     */
    const showCountWarning = (required && count === 0) || count > MAX_CATEGORIES;

    return (
        <div className="space-y-3">
            <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Tag size={14} className="text-primary"/> {title}
                </div>
                {/* 💡 안내 문구를 필수/선택에 따라 명확히 표시 */}
                <p className="text-xs text-muted-foreground mt-1">
                    {description} {required ? `(최소 1개, 최대 ${MAX_CATEGORIES}개)` : `(선택 사항, 최대 ${MAX_CATEGORIES}개)`}
                </p>
            </div>

            {/* 검색 */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="카테고리 검색..."
                    className="w-full border border-border rounded pl-8 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* 카테고리 목록 */}
            {loading ? (
                <div className="py-8 text-center space-y-2">
                    <div
                        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
                    <p className="text-xs text-muted-foreground">카테고리 불러오는 중...</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 -mr-1">
                    {Object.entries(groups).map(([group, cats]) => (
                        <div key={group}>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                {group}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {cats.map((cat) => {
                                    const active = selected.includes(cat.id);
                                    const disabled = !active && count >= MAX_CATEGORIES;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggle(cat.id)}
                                            disabled={disabled}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                active
                                                    ? "bg-primary text-white border-primary"
                                                    : disabled
                                                        ? "bg-muted/40 text-muted-foreground/40 border-border cursor-not-allowed"
                                                        : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {Object.keys(groups).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">검색 결과가 없습니다.</p>
                    )}
                </div>
            )}

            {/* 선택 현황 / 카운트 검증 */}
            <div className={`rounded p-3 border ${
                showCountWarning
                    ? "bg-amber-50 border-amber-200"
                    : count > 0
                        ? "bg-secondary border-primary/20"
                        : "bg-muted/30 border-border"
            }`}>
                <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-semibold ${showCountWarning ? "text-amber-700" : count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        선택됨 {count}개
                    </p>
                    {/* 💡 유효 표시 조건: 유효하면서 동시에 '선택지가 들어있거나 선택사항인 경우'만 */}
                    {isValid && (count > 0 || !required) && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12}/> 유효
                        </span>
                    )}
                    {/* 💡 경고 메시지 문맥에 맞게 동적 분기 */}
                    {showCountWarning && (
                        <span className="text-xs text-amber-700 flex items-center gap-1">
                            <AlertCircle size={12}/>
                            {count === 0 ? "최소 1개 이상의 카테고리를 선택해 주세요." : `최대 ${MAX_CATEGORIES}개까지만 선택 가능합니다.`}
                        </span>
                    )}
                </div>
                {count > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selected.map((id) => {
                            const cat = categories.find((c) => c.id === id);
                            return cat ? (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggle(id)}
                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                                >
                                    {cat.name} ×
                                </button>
                            ) : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── AgreementCheckbox ─────────────────────────────────────────────────────────
export function AgreementCheckbox({
                                      agreed,
                                      onAgreedChange,
                                  }: {
    agreed: boolean;
    onAgreedChange: (v: boolean) => void;
}) {
    return (
        <>
            <hr className="border-border"/>
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => onAgreedChange(e.target.checked)}
                    className="mt-0.5 shrink-0"
                />
                <span>
          <a href="#" className="text-primary underline">이용약관</a> 및{" "}
                    <a href="#" className="text-primary underline">개인정보 처리방침</a>에 동의합니다.
                </span>
            </label>
        </>
    );
}

// ── CategoryStep ──────────────────────────────────────────────────────────────
export function CategoryStep({
                                 selected,
                                 onChange,
                                 agreed,
                                 onAgreedChange,
                                 role,
                                 required = false,
                             }: {
    selected: number[];
    onChange: (ids: number[]) => void;
    agreed: boolean;
    onAgreedChange: (v: boolean) => void;
    role: "buyer" | "seller";
    required?: boolean;
}) {
    return (
        <div className="space-y-4">
            <CategoryPicker
                selected={selected}
                onChange={onChange}
                required={required}
                title="선호 카테고리"
                description={
                    role === "buyer"
                        ? "주로 구매하는 카테고리를 선택하면 맞춤 상품을 우선 노출해 드립니다."
                        : "주로 취급하는 카테고리를 선택하면 맞춤 바이어를 우선 매칭해 드립니다."
                }
            />
            <AgreementCheckbox agreed={agreed} onAgreedChange={onAgreedChange}/>
        </div>
    );
}