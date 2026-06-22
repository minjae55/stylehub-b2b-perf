import {useEffect, useState} from "react";
import {AlertCircle, CheckCircle2, Search, Tag} from "lucide-react";
// ── 공통 API 인스턴스 및 타입 규칙 적용 ──────────────────────────────
import api from "@/api/axios";
import type {ApiResponse} from "@/api/types";

export type Category = { id: number; name: string; group: string };

const MIN_CATEGORIES = 3;
const MAX_CATEGORIES = 5;

// ── [수정] 실제 백엔드 대분류 카테고리 조회 API 연동 ───────────────────────────
async function fetchCategories(): Promise<Category[]> {
    // 프로젝트 규칙 4번 준수: api.get<ApiResponse<T>> 사용
    // TODO: 실제 백엔드의 카테고리 대분류 목록 조회 엔드포인트 경로로 맞춰주세요.
    const {data} = await api.get<ApiResponse<Category[]>>("/categories/main");
    return data.data; // 백엔드에서 받아온 대분류 리스트 [ {id: 1, name: "상의", group: "의류"}, ... ] 반환
}

// 카테고리 개수가 유효한 범위인지 (선택사항이면 0개도 허용)
export function isValidCategoryCount(count: number, required: boolean): boolean {
    if (!required && count === 0) return true;
    return count >= MIN_CATEGORIES && count <= MAX_CATEGORIES;
}

// ── CategoryPicker ────────────────────────────────────────────────────────────
// 카테고리 선택 위젯 단독 (검색 + 칩 선택 + 선택현황). 1회만 필요하면 이것만 쓰면 됨.

export function CategoryPicker({
  selected,
  onChange,
                                   title,
                                   description,
                                   required = true,
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
    fetchCategories().then((data) => { setCategories(data); setLoading(false); });
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
    const isValid = isValidCategoryCount(count, required);
    const showCountWarning = count > 0 && !isValid;

  return (
      <div className="space-y-3">
          <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Tag size={14} className="text-primary"/> {title}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                  {description} {required ? `(최소 ${MIN_CATEGORIES}개, 최대 ${MAX_CATEGORIES}개)` : `(선택 시 ${MIN_CATEGORIES}~${MAX_CATEGORIES}개)`}
              </p>
          </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
                  {isValid && count > 0 && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={12}/> 유효
            </span>
                  )}
                  {showCountWarning && (
                      <span className="text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle
                  size={12}/> {count < MIN_CATEGORIES ? `${MIN_CATEGORIES - count}개 더 선택` : `${MAX_CATEGORIES}개까지만`}
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
// 이용약관 / 개인정보 처리방침 동의 체크박스 (모든 가입 플로우 공통)

export function AgreementCheckbox({
                                      agreed,
                                      onAgreedChange,
                                  }: {
    agreed: boolean;
    onAgreedChange: (v: boolean) => void;
}) {
    return (
        <>
      <hr className="border-border" />
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

// ── CategoryStep (하위호환 — 단일 카테고리 + 약관 동의 묶음) ──────────────────
// 바이어/직원처럼 카테고리 선택이 1번만 필요한 플로우에서 사용

export function CategoryStep({
                                 selected,
                                 onChange,
                                 agreed,
                                 onAgreedChange,
                                 role,
                                 required = true,
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
