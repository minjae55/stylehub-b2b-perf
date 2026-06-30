/**
 * StepPresidentBusiness.tsx
 * Step 2-A — 사업자 정보 (대표자 전용)
 *
 * 플로우
 *   1) 사업자등록증 이미지 업로드 → 네이버 클라우드 OCR 자동 인식
 *   2) 인식 결과 검토 후 필요시 직접 수정
 *   3) [정보 조회] 버튼 → 국세청 4종 진위확인 API
 *   4) 인증 완료 시 필드 잠금 + 다음 단계 활성화
 *
 * 사업장 주소
 *   - [주소 검색] 버튼 → 다음(Daum) 우편번호 서비스 모달 오픈
 *   - 도로명 주소 선택 시 address 필드 자동 채움 + 상세주소 입력창에 자동 포커스
 *   - 주소 필드는 검색으로만 채우도록 readOnly 처리 (직접 타이핑 X, 정확도 보장)
 *
 * 참고
 *   - 셀러 전용: 가입 불가 업종 안내 배너 노출
 *   - 대표자가 이미 등록된 사업자번호로 가입 시도하면 백엔드가 에러 반환
 */

import {useRef, useState} from "react";
import {AlertCircle, Building2, MapPin, XCircle} from "lucide-react";
import {Link} from "react-router";
import {
    AddressSearchModal,
    type DaumAddressResult,
    Field,
    FileUpload,
    formatPhoneNumber,
    inputCls,
    type RegisterFormData,
    type Role
} from "./shared";
import {uploadBusinessLicenseOcr, verifyBusinessInvoice} from "@/api/auth/auth.service";
import {toast} from "sonner";

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepPresidentBusinessProps {
    form: RegisterFormData;
    set: (partial: Partial<RegisterFormData>) => void;
    /** 국세청 인증 완료 여부 — canProceed 판단용 */
    isBusinessVerified: boolean;
    setIsBusinessVerified: (v: boolean) => void;
    role: Role;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function StepPresidentBusiness({
                                          form, set, isBusinessVerified, setIsBusinessVerified, role,
                                      }: StepPresidentBusinessProps) {
    const [ocrLoading, setOcrLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    // 주소 선택 후 상세주소 입력창으로 자동 포커스 이동시키기 위한 ref
    const addressDetailRef = useRef<HTMLInputElement>(null);

    /**
     * 사업자등록증 업로드 → OCR 자동 인식
     * 인식 실패 시 toast 에러, 직접 입력 유도
     */
    const handleFileChange = async (file: File) => {
        set({businessLicenseFile: file});
        setErrorMessage(""); // 파일 새로 올리면 에러 초기화
        try {
            setOcrLoading(true);
            const data = await uploadBusinessLicenseOcr(file);
            set({
                businessNumber: data.businessNumber || "",
                companyName: data.companyName || "",
                representativeName: data.representativeName || "",
                openDate: data.openDate || "",
            });
            toast.success("사업자 정보가 자동으로 인식되었습니다.", {
                description: "잘못 인식된 부분이 있다면 직접 수정해 주세요.",
                duration: 5000,
            });
        } catch (error: any) {
            toast.error(error.message || "글자를 인식하지 못했습니다. 직접 입력해 주세요.");
        } finally {
            setOcrLoading(false);
        }
    };

    /**
     * 국세청 4종 진위확인 (사업자번호 · 회사명 · 대표자명 · 개업일)
     * 성공 시 모든 필드 잠금
     * 실패 시 중복 or 업종 제한 메시지 표시
     */
    const handleLookup = async () => {
        setErrorMessage(""); // 조회 시작 시 에러 리셋

        if (!form.businessNumber || !form.companyName || !form.representativeName || !form.openDate) {
            const msg = "사업자번호, 회사명, 대표자명, 개업일자를 모두 입력해야 조회가 가능합니다.";
            setErrorMessage(msg);
            toast.warning("정보 부족", {description: msg});
            return;
        }
        try {
            setLookupLoading(true);
            await verifyBusinessInvoice({
                businessNumber: form.businessNumber,
                companyName: form.companyName,
                representativeName: form.representativeName,
                openDate: form.openDate,
            });
            setIsBusinessVerified(true);
            toast.success("검증 완료", {
                description: "국세청 사업자 정보 검증 및 계속사업자 확인이 완료되었습니다.",
            });
        } catch (error: any) {
            setIsBusinessVerified(false);
            //  서버에서 내려준 에러 문구 혹은 기본 실패 문구를 에러 상태에 저장
            const failedMsg = error.message || "국세청 등록 정보와 일치하지 않거나 가입 불가 업종입니다.";
            setErrorMessage(failedMsg);

            toast.error("사업자 인증 실패", {description: failedMsg});
        } finally {
            setLookupLoading(false);
        }
    };

    // 값이 바뀌면 인증 실패했었던 에러 상태를 리셋해주는 함수
    const handleInputChange = (partial: Partial<RegisterFormData>) => {
        set(partial);
        if (errorMessage) setErrorMessage("");
    };

    /**
     * 다음 우편번호 모달에서 주소를 선택했을 때
     * - 도로명 주소가 있으면 우선 사용, 없으면 지번 주소로 폴백
     * - 채운 직후 상세주소 입력창으로 자동 포커스 (사용자가 바로 이어서 입력 가능)
     */
    const handleAddressComplete = (result: DaumAddressResult) => {
        const fullAddress = result.roadAddress || result.jibunAddress;
        set({
            zipcode: result.zonecode,
            address: fullAddress,
            addressDetail: ""
        });
        // 모달이 닫히는 애니메이션과 겹치지 않도록 한 틱 뒤에 포커스
        setTimeout(() => addressDetailRef.current?.focus(), 50);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Building2 size={14} className="text-primary"/> 사업자 정보
            </div>

            {/* 사업자등록증 업로드 (OCR 분석 중 레이블 변경) */}
            <FileUpload
                label={ocrLoading ? "📄 사업자등록증 이미지 분석 중..." : "사업자등록증 이미지"}
                file={form.businessLicenseFile}
                onChange={handleFileChange}
            />

            {/* OCR 인식 결과 — 수정 가능 (인증 완료 후 잠금) */}
            <Field label="회사명 (법인명)" required hint="국세청에 등록된 정확한 상호를 입력해주세요.">
                <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => handleInputChange({companyName: e.target.value})}
                    placeholder="(주)스타일허브"
                    className={`${inputCls} ${errorMessage ? "border-red-400 focus:ring-red-200" : ""}`}
                    disabled={isBusinessVerified}
                />
            </Field>

            <Field label="대표자명" required>
                <input
                    type="text"
                    value={form.representativeName}
                    onChange={(e) => handleInputChange({representativeName: e.target.value})}
                    placeholder="홍길동"
                    className={`${inputCls} ${errorMessage ? "border-red-400 focus:ring-red-200" : ""}`}
                    disabled={isBusinessVerified}
                />
            </Field>

            <Field label="개업일자" required hint="사업자등록증에 기재된 개업연월일을 선택해주세요.">
                <input
                    type="date"
                    value={form.openDate || ""}
                    onChange={(e) => handleInputChange({openDate: e.target.value})}
                    className={`${inputCls} ${errorMessage ? "border-red-400 focus:ring-red-200" : ""}`}
                    disabled={isBusinessVerified}
                />
            </Field>

            {/* 사업자번호 + 국세청 조회 버튼 */}
            <Field label="사업자등록번호" required>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={form.businessNumber}
                        onChange={(e) => handleInputChange({businessNumber: e.target.value})}
                        placeholder="000-00-00000"
                        maxLength={12}
                        className={`${inputCls} ${
                            isBusinessVerified ? "border-emerald-400 bg-emerald-50/40"
                                : errorMessage ? "border-red-400 focus:ring-red-200"
                                    : ""
                        }`}
                        disabled={isBusinessVerified}
                    />
                    <button
                        type="button"
                        onClick={handleLookup}
                        disabled={
                            lookupLoading || isBusinessVerified ||
                            !form.businessNumber || !form.companyName ||
                            !form.representativeName || !form.openDate
                        }
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                    >
                        {lookupLoading ? "조회 중..." : isBusinessVerified ? "인증 완료" : "정보 조회"}
                    </button>
                </div>

                {errorMessage && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-fadeIn">
                        <XCircle size={12}/> {errorMessage}
                    </p>
                )}

                {isBusinessVerified && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <Building2 size={12}/> 국세청 및 업종 검증이 완료되었습니다. 이제 다음 단계로 갈 수 있습니다.
                    </p>
                )}
            </Field>

            {/* 사업장 주소 — 다음 우편번호 검색 모달로 채움 (직접 타이핑 X) */}
            <Field label="사업장 주소" required>
                {/* 우편번호 */}
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={form.zipcode || ""}
                        readOnly
                        placeholder="우편번호"
                        onClick={() => setAddressModalOpen(true)}
                        className={`${inputCls} w-40 cursor-pointer bg-muted/20`}
                    />

                    <button
                        type="button"
                        onClick={() => setAddressModalOpen(true)}
                        className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap flex items-center gap-1.5"
                    >
                        <MapPin size={14}/>
                        주소 검색
                    </button>
                </div>

                {/* 기본주소 */}
                <input
                    type="text"
                    value={form.address || ""}
                    readOnly
                    placeholder="주소 검색 버튼을 눌러주세요."
                    onClick={() => setAddressModalOpen(true)}
                    className={`${inputCls} mb-2 cursor-pointer bg-muted/20`}
                />

                {/* 상세주소 */}
                <input
                    ref={addressDetailRef}
                    type="text"
                    value={form.addressDetail || ""}
                    onChange={(e) => set({addressDetail: e.target.value})}
                    placeholder="상세 주소 (동/호수 등)"
                    disabled={!form.address}
                    className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            </Field>

            {/* 회사 대표전화 */}
            <Field
                label="회사 대표전화"
                required
                hint="고객센터 또는 회사 대표번호를 입력해주세요."
            >
                <input
                    type="tel"
                    value={form.representativePhone || ""}
                    onChange={(e) =>
                        set({
                            representativePhone: formatPhoneNumber(e.target.value),
                        })
                    }
                    placeholder="02-1234-5678"
                    maxLength={13}
                    className={inputCls}
                />
            </Field>

            {/* 다음 우편번호 검색 모달 */}
            <AddressSearchModal
                open={addressModalOpen}
                onClose={() => setAddressModalOpen(false)}
                onComplete={handleAddressComplete}
            />

            {/* 셀러 전용: 가입 불가 업종 안내 */}
            {role === "seller" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        일부 업태·업종은 셀러 가입이 제한됩니다.{" "}
                        <Link to="/restricted-businesses" className="text-amber-800 font-semibold underline">
                            가입 불가 업태/업종 확인하기 →
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}