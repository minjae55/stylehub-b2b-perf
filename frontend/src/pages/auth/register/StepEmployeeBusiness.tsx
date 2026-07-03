/**
 * StepEmployeeBusiness.tsx
 * Step 2-B — 소속 회사 확인 (직원 전용)
 *
 * 플로우
 * 1) 사업자등록번호 입력
 * 2) [조회] 버튼 → DB에서 등록된 회사 검색 및 검증
 * - 셀러 직원: 회사의 sellerStatus가 'APPROVED' 일 때만 가입 가능
 * - 바이어 직원: 회사의 sellerStatus가 'NONE'(최초상태) 또는 'APPROVED' 일 때 가입 가능
 * 3) 인증 완료 시 필드 잠금 + 다음 단계 활성화
 * - 가입 완료 후 직원의 계정 상태는 PENDING이며, 대표가 마이페이지에서 활성화해야 함
 */

import {useState} from "react";
import {AlertCircle, Building2, CheckCircle2} from "lucide-react";
import {Field, formatBusinessNumber, inputCls, readonlyCls, type RegisterFormData} from "./shared";
import {toast} from "sonner";
import {lookupCompany} from "@/api/auth/auth.service";
import {useParams} from "react-router";

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepEmployeeBusinessProps {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    isCompanyVerified: boolean;
    setIsCompanyVerified: (v: boolean) => void;
    isCompanyNotFound: boolean;
    setIsCompanyNotFound: (v: boolean) => void;
    fieldErrors?: Record<string, string>;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function StepEmployeeBusiness({
                                         form, set,
                                         isCompanyVerified, setIsCompanyVerified,
                                         isCompanyNotFound, setIsCompanyNotFound, fieldErrors
                                     }: StepEmployeeBusinessProps) {
    const [loading, setLoading] = useState(false);
    const [statusError, setStatusError] = useState(""); // 회사 승인 상태 제한 에러 문구
    const {role} = useParams<{ role: string }>();
    const currentRole = (role?.toUpperCase() || "BUYER") as "SELLER" | "BUYER";

    /**
     * DB 조회 및 비즈니스 룰 기반 승인 상태(sellerStatus) 필터링
     */
    const handleLookup = async () => {
        if (!form.businessNumber) return;

        setLoading(true);
        setIsCompanyNotFound(false);
        setIsCompanyVerified(false);
        setStatusError("");

        // 하이픈 제거
        const cleanBusinessNumber = form.businessNumber.replace(/-/g, "");

        try {
            // 회사 조회 API 호출
            const companyData = await lookupCompany(cleanBusinessNumber, currentRole);

            const {companyName, representativeName, sellerStatus} = companyData;

            if (currentRole === "SELLER") {
                // 셀러 직원은 무조건 회사가 정식 승인(APPROVED) 상태여야만 함
                if (sellerStatus !== "APPROVED" && sellerStatus !== "PENDING") {
                    setStatusError("해당 셀러 회사는 가입 승인 대기 중이거나 반려 상태입니다. 대표자의 가입 승인이 완료된 후 직원 가입이 가능합니다.");
                    toast.error("가입 불가 회사", {description: "승인 완료된 셀러 회사만 직원 등록이 가능합니다."});
                    return;
                }
            } else if (currentRole === "BUYER") {
                // 바이어 직원은 회사가 NONE(기본)이거나 APPROVED(정식승인) 상태여야 함 (PENDING 등 비정상 상태 차단)
                if (sellerStatus !== "NONE" && sellerStatus !== "APPROVED" && sellerStatus !== "PENDING") {
                    setStatusError("가입할 수 없는 승인 상태의 바이어 회사입니다. 회사의 상태를 확인해 주세요.");
                    toast.error("가입 불가 회사", {description: "정상 상태의 바이어 회사만 직원 등록이 가능합니다."});
                    return;
                }
            }

            // 모든 비즈니스 조건 통과 시 폼 데이터 세팅 및 잠금
            set({
                employeeCompanyName: companyName,
                employeeRepresentativeName: representativeName
            });
            setIsCompanyVerified(true);
            toast.success("회사 확인 완료", {
                description: "소속 회사 정보가 확인되었습니다. 가입 후 대표자 승인이 필요합니다.",
            });

        } catch (error: any) {
            setIsCompanyNotFound(true);
            const errorMsg = error?.response?.data?.message || "대표자가 먼저 가입해야 직원 가입이 가능합니다.";
            toast.error("회사를 찾을 수 없습니다.", {description: errorMsg});
            set({employeeCompanyName: "", employeeRepresentativeName: ""});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary"/> 소속 회사 확인
            </div>

            {/* 역할군(가입 경로)에 맞춰 유동적으로 변경되는 안내 문구 */}
            <p className="text-xs text-muted-foreground bg-muted/40 rounded p-3 -mt-1 leading-relaxed">
                소속 회사의 사업자등록번호를 입력하면 회사 정보가 자동으로 확인됩니다.
                {currentRole === "SELLER"
                    ? " ⚠️ 회사의 셀러 신청이 승인되었거나 가입 대기 중인 경우 신청이 가능합니다."
                    : " ⚠️ 회사가 정상 등록되었거나 가입 대기 중인 경우 신청이 가능합니다."}
                <br/>
                <span className="text-primary font-medium mt-1 block">※ 가입 완료 후, 소속 회사 대표가 직접 승인해야 계정이 활성화됩니다.</span>
            </p>

            {/* 사업자번호 + 조회 버튼 */}
            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={form.businessNumber}
                        onChange={(e) => {
                            set({
                                businessNumber: formatBusinessNumber(e.target.value),
                            });

                            setIsCompanyVerified(false);
                            setIsCompanyNotFound(false);
                            setStatusError("");
                        }}
                        placeholder="000-00-00000"
                        maxLength={12}
                        className={inputCls}
                        disabled={isCompanyVerified}
                    />
                    <button
                        type="button"
                        onClick={handleLookup}
                        disabled={loading || !form.businessNumber || isCompanyVerified}
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                    >
                        {loading ? "조회 중..." : isCompanyVerified ? "확인됨" : "조회"}
                    </button>
                </div>

                {isCompanyVerified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 사업자 정보와 가입 권한이 확인되었습니다.
                    </p>
                )}
                {isCompanyNotFound && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12}/> 등록된 회사를 찾을 수 없습니다. 번호를 다시 확인해 주세요.
                    </p>
                )}
                {/* 💡 비즈니스 제약 조건 미달 시 노출되는 경고 블록 */}
                {statusError && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1 bg-amber-50 p-2.5 rounded border border-amber-200 leading-normal">
                        <AlertCircle size={12} className="shrink-0 mt-0.5"/>
                        <span>{statusError}</span>
                    </p>
                )}
                {fieldErrors?.businessNumber && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.businessNumber}</p>
                )}
            </Field>

            {/* 조회 성공 시: 회사 정보 표시 + 입력 내용 요약 */}
            {isCompanyVerified && (
                <>
                    <Field label="상호명">
                        <input type="text" value={form.employeeCompanyName} readOnly className={readonlyCls}/>
                        {fieldErrors?.employeeCompanyName && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.employeeCompanyName}</p>
                        )}
                    </Field>
                    <Field label="대표자명">
                        <input type="text" value={form.employeeRepresentativeName} readOnly className={readonlyCls}/>
                        {fieldErrors?.employeeRepresentativeName && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.employeeRepresentativeName}</p>
                        )}
                    </Field>

                    {/* 입력 내용 요약 카드 */}
                    <div className="bg-muted/40 border border-border rounded p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-foreground mb-2">지금까지 입력한 정보</p>
                        {([
                            ["가입 유형", currentRole === "SELLER" ? "공급사 직원" : "고객사 직원"],
                            ["이메일", form.email || "–"],
                            ["이름", form.name || "–"],
                            ["연락처", form.phone || "–"],
                            ["사업자번호", form.businessNumber || "–"],
                            ["소속 회사", form.employeeCompanyName || "–"],
                        ] as [string, string][]).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="text-foreground font-medium truncate max-w-[55%] text-right">{v}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}