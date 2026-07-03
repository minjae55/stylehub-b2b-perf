/**
 * StepStore.tsx      — Step 3: 매장 정보 (셀러 대표 전용)
 * StepBankAccount.tsx — Step 4: 정산 계좌 (셀러 대표 전용)
 * StepCategory.tsx   — 마지막 스텝: 카테고리 (역할별 분기)
 *
 * 세 컴포넌트 모두 셀러 대표 or 공통 마지막 스텝이라 한 파일로 묶어 관리
 */

import {type ReactNode} from "react";
import {CreditCard, Globe, Store, Tag} from "lucide-react";
import {AgreementCheckbox, CategoryPicker} from "./Category";
import {BANKS, Field, inputCls, type MemberType, type RegisterFormData, type Role, type StoreType,} from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
// StepStore — 매장 정보
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 셀러 대표 Step 3
 * - 브랜드명 (선택)
 * - 매장 타입: 오프라인 / 온라인 / 온·오프라인
 * - 온라인 포함 시 쇼핑몰 URL 필수
 */
export function StepStore({
                              form, set, fieldErrors
                          }: {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    fieldErrors?: Record<string, string>;
}) {
    const storeOpts: { value: StoreType; label: string; icon: ReactNode }[] = [
        {value: "offline", label: "오프라인", icon: <Store size={16}/>},
        {value: "online", label: "온라인", icon: <Globe size={16}/>},
        {value: "both", label: "온·오프라인", icon: <><Store size={13}/><Globe size={13}/></>},
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Store size={14} className="text-primary"/> 매장 정보
            </div>

            {/* 브랜드명 (선택) */}
            <Field label="브랜드명">
                <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => set({brandName: e.target.value})}
                    placeholder="대표 브랜드 (선택)"
                    className={inputCls}
                />
                {fieldErrors?.brandName && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.brandName}</p>
                )}
            </Field>

            {/* 매장 타입 토글 */}
            <Field label="매장 타입" required>
                <div className="grid grid-cols-3 gap-2">
                    {storeOpts.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => set({storeType: opt.value})}
                            className={`flex flex-col items-center gap-2 border-2 rounded px-2 py-3 text-xs font-medium transition-all ${
                                form.storeType === opt.value
                                    ? "border-primary bg-secondary text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                        >
                            <span className="flex gap-0.5">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
                {fieldErrors?.storeType && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.storeType}</p>
                )}
            </Field>

            {/* 쇼핑몰 URL — 온라인 포함 타입만 표시 */}
            {(form.storeType === "online" || form.storeType === "both") && (
                <Field label="쇼핑몰 URL" required hint="네이버 스마트스토어, 쿠팡, 자체몰 URL 등">
                    <input
                        type="url"
                        value={form.websiteUrl}
                        onChange={(e) => set({websiteUrl: e.target.value})}
                        placeholder="https://smartstore.naver.com/mystore"
                        className={inputCls}
                    />
                    {fieldErrors?.websiteUrl && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.websiteUrl}</p>
                    )}
                </Field>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StepBankAccount — 정산 계좌
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 셀러 대표 Step 4
 * 바이어 결제 대금 정산 계좌 입력
 * 가입 후에도 마이페이지에서 변경 가능
 */
export function StepBankAccount({
                                    form, set, fieldErrors
                                }: {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    fieldErrors?: Record<string, string>;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CreditCard size={14} className="text-primary"/> 정산 계좌 정보
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
                바이어 결제 대금 정산을 위한 계좌입니다. 가입 후에도 변경할 수 있습니다.
            </p>

            {/* 은행 선택 */}
            <Field label="은행명" required>
                <select
                    value={form.bankName}
                    onChange={(e) => set({bankName: e.target.value})}
                    className={inputCls}
                >
                    <option value="">은행 선택</option>
                    {BANKS.map((b) => (
                        <option key={b} value={b}>{b}은행</option>
                    ))}
                </select>
                {fieldErrors?.bankName && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.bankName}</p>
                )}
            </Field>

            <Field label="계좌번호" required>
                <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => set({accountNumber: e.target.value})}
                    placeholder="숫자만 입력"
                    className={inputCls}
                />
                {fieldErrors?.accountNumber && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.accountNumber}</p>
                )}
            </Field>

            <Field label="예금주명" required>
                <input
                    type="text"
                    value={form.accountHolder}
                    onChange={(e) => set({accountHolder: e.target.value})}
                    placeholder="예금주 이름"
                    className={inputCls}
                />
                {fieldErrors?.accountHolder && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.accountHolder}</p>
                )}
            </Field>

            {/* 이전 스텝 입력 요약 카드 */}
            <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                {([
                    ["사업자번호", form.businessNumber || "–"],
                    ["회사명", form.companyName || "–"],
                    ["브랜드명", form.brandName || "–"],
                    ["매장 타입",
                        form.storeType === "offline" ? "오프라인"
                            : form.storeType === "online" ? "온라인"
                                : "온·오프라인"],
                    ["정산계좌",
                        form.bankName && form.accountNumber
                            ? `${form.bankName}은행 ${form.accountNumber}`
                            : "–"],
                ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-foreground font-medium truncate max-w-[55%] text-right">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StepCategory — 카테고리 선택 (마지막 스텝)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 💡 역할/유형별 카테고리 분기 리팩토링 및 동기화
 *
 * - 선호 카테고리 (모든 역할 공통): 이제 전부 선택 사항 (required=false / 0~5개 허용)
 * - 회사 취급 카테고리 (셀러 대표 전용): 무조건 최소 1개 필수 (required=true / 1~5개 허용)
 */
export function StepCategory({
                                 form, set, role, memberType, fieldErrors
                             }: {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    role: Role;
    memberType: MemberType;
    fieldErrors?: Record<string, string>
}) {
    const isEmployee = memberType === "employee";
    const isSellerPresident = role === "seller" && memberType === "president";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Tag size={14} className="text-primary"/> 카테고리 선택
            </div>

            <CategoryPicker
                selected={form.preferredCategoryIds}
                onChange={(ids) => set({preferredCategoryIds: ids})}
                title="선호 카테고리"
                description={
                    role === "buyer"
                        ? "주로 구매하는 카테고리를 선택하시면 맞춤 상품을 우선 노출해 드립니다."
                        : "평소 관심 있는 카테고리를 선택하시면 맞춤 소싱 요청을 우선 받아보실 수 있습니다."
                }
                required={false}
            />
            {fieldErrors?.preferredCategoryIds && (
                <p className="text-xs text-red-500 -mt-2">{fieldErrors.preferredCategoryIds}</p>
            )}

            <p className="text-xs text-muted-foreground -mt-2">
                * 선호 카테고리는 선택 사항이며 지정하지 않아도 가입이 가능합니다. (최대 5개)
            </p>

            {/* 취급 카테고리 — 셀러 대표만 노출 */}
            {isSellerPresident && (
                <>
                    <hr className="border-border"/>
                    <CategoryPicker
                        selected={form.handledCategoryIds}
                        onChange={(ids) => set({handledCategoryIds: ids})}
                        title="회사 취급 카테고리"
                        description="우리 회사가 실제로 공급하는 카테고리를 선택해 주세요. 최소 1개는 무조건 지정하셔야 가입이 진행됩니다."
                        required={true}
                    />
                    {fieldErrors?.handledCategoryIds && (
                        <p className="text-xs text-red-500 -mt-2">{fieldErrors.handledCategoryIds}</p>
                    )}
                </>
            )}

            {/* 약관 동의 */}
            <AgreementCheckbox
                agreed={form.agreed}
                onAgreedChange={(v) => set({agreed: v})}
            />
        </div>
    );
}