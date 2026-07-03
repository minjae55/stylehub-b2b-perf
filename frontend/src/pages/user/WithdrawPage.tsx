/**
 * WithdrawPage.tsx
 * 회원 탈퇴 전용 페이지 — /mypage/withdraw
 *
 * 3단계 플로우
 *   Step 1: 사전 검증 — 진행 중 주문/정산/ADMIN 여부 체크
 *   Step 2: 탈퇴 사유 선택 (Radio + 상세 Textarea)
 *   Step 3: 확인 문구 타이핑 + 비밀번호 재확인 → 최종 탈퇴 API
 */

import {useState} from "react";
import {useNavigate} from "react-router";
import {AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldAlert, XCircle} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {toast} from "sonner";

// ── 상수 ──────────────────────────────────────────────────────────────────────

const WITHDRAW_REASONS = [
    {value: "LOW_USAGE", label: "구입/판매 물량이 생각보다 적음 (플랫폼 효용성 부족)"},
    {value: "COMPETITOR", label: "타사 B2B 플랫폼으로 이전"},
    {value: "BUSINESS_CLOSED", label: "사업 종결 / 폐업"},
    {value: "FEE_BURDEN", label: "수수료 및 이용 금액 부담"},
    {value: "UX_DIFFICULT", label: "시스템 사용 방법이 너무 어렵고 불편함"},
    {value: "OTHER", label: "기타"},
] as const;

type WithdrawReason = typeof WITHDRAW_REASONS[number]["value"];

const CONFIRM_PHRASE = "모든 데이터 삭제에 동의합니다";

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-foreground";

// ── Step 1: 사전 검증 ────────────────────────────────────────────────────────

interface PreCheckResult {
    hasActiveOrders: boolean;    // 진행 중인 주문/발주
    hasUnpaidSettlement: boolean; // 미정산 대금
    isAdmin: boolean;            // 최고 관리자 여부
}

function StepPreCheck({
                          onPass,
                      }: {
    onPass: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PreCheckResult | null>(null);
    const [checked, setChecked] = useState(false);

    const handleCheck = async () => {
        setLoading(true);
        try {
            // TODO: GET /api/users/me/withdraw-check
            // 응답: { hasActiveOrders, hasUnpaidSettlement, isAdmin }
            await new Promise((r) => setTimeout(r, 1000)); // mock

            // mock 결과 — 실제 연동 시 API 응답으로 교체
            const mockResult: PreCheckResult = {
                hasActiveOrders: false,
                hasUnpaidSettlement: false,
                isAdmin: false,
            };
            setResult(mockResult);
            setChecked(true);
        } catch (error: any) {
            toast.error("검증 실패", {description: error.message || "잠시 후 다시 시도해 주세요."});
        } finally {
            setLoading(false);
        }
    };

    const canProceed = checked &&
        result &&
        !result.hasActiveOrders &&
        !result.hasUnpaidSettlement &&
        !result.isAdmin;

    return (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <ShieldAlert size={18}/> 탈퇴 전 꼭 확인하세요
                </div>
                <ul className="text-xs text-red-600/90 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li>탈퇴 시 모든 거래 내역, 소싱 요청, 계약 데이터가 비활성화됩니다.</li>
                    <li>진행 중인 주문·발주 또는 미정산 대금이 있으면 탈퇴가 불가능합니다.</li>
                    <li>최고 관리자(ADMIN)는 권한을 위임한 후 탈퇴할 수 있습니다.</li>
                    <li>탈퇴 후 동일 이메일로 재가입은 30일 이후 가능합니다.</li>
                </ul>
            </div>

            {/* 사전 검증 버튼 */}
            {!checked && (
                <button
                    type="button"
                    onClick={handleCheck}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <><Loader2 size={15} className="animate-spin"/> 탈퇴 가능 여부 확인 중...</>
                    ) : (
                        "탈퇴 가능 여부 확인하기"
                    )}
                </button>
            )}

            {/* 검증 결과 */}
            {checked && result && (
                <div className="space-y-2">
                    {[
                        {label: "진행 중인 주문·발주", blocked: result.hasActiveOrders},
                        {label: "미정산 대금", blocked: result.hasUnpaidSettlement},
                        {label: "최고 관리자(ADMIN) 권한", blocked: result.isAdmin},
                    ].map(({label, blocked}) => (
                        <div key={label}
                             className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm border ${
                                 blocked
                                     ? "bg-red-50 border-red-200 text-red-700"
                                     : "bg-emerald-50 border-emerald-200 text-emerald-700"
                             }`}>
                            <span className="font-medium">{label}</span>
                            {blocked
                                ? <XCircle size={16}/>
                                : <CheckCircle2 size={16}/>}
                        </div>
                    ))}

                    {/* 블로킹 사유 안내 */}
                    {result.hasActiveOrders && (
                        <p className="text-xs text-red-600 px-1">
                            ⚠ 진행 중인 주문·발주를 모두 완료한 후 탈퇴하실 수 있습니다.
                        </p>
                    )}
                    {result.hasUnpaidSettlement && (
                        <p className="text-xs text-red-600 px-1">
                            ⚠ 미정산 대금을 모두 처리한 후 탈퇴하실 수 있습니다.
                        </p>
                    )}
                    {result.isAdmin && (
                        <p className="text-xs text-red-600 px-1">
                            ⚠ 최고 관리자는 다른 멤버에게 권한을 위임하거나 기업 전체 해지 절차를 통해 탈퇴하실 수 있습니다.
                        </p>
                    )}

                    {/* 재확인 버튼 */}
                    {!canProceed && (
                        <button
                            type="button"
                            onClick={() => {
                                setChecked(false);
                                setResult(null);
                            }}
                            className="text-xs text-muted-foreground hover:text-primary underline mt-1"
                        >
                            다시 확인하기
                        </button>
                    )}
                </div>
            )}

            {canProceed && (
                <button
                    type="button"
                    onClick={onPass}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                    탈퇴 사유 입력하기 →
                </button>
            )}
        </div>
    );
}

// ── Step 2: 탈퇴 사유 선택 ───────────────────────────────────────────────────

function StepReason({
                        reason,
                        setReason,
                        detail,
                        setDetail,
                        onNext,
                        onBack,
                    }: {
    reason: WithdrawReason | "";
    setReason: (v: WithdrawReason) => void;
    detail: string;
    setDetail: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
                탈퇴 사유를 선택해 주세요. 소중한 의견은 서비스 개선에 반영됩니다.
            </p>

            {/* 사유 선택 */}
            <div className="space-y-2">
                {WITHDRAW_REASONS.map((r) => (
                    <label
                        key={r.value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            reason === r.value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary/30 text-foreground"
                        }`}
                    >
                        <input
                            type="radio"
                            name="reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            className="accent-primary"
                        />
                        <span className="text-sm font-medium">{r.label}</span>
                    </label>
                ))}
            </div>

            {/* 상세 사유 */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                    상세 사유 <span className="font-normal">(선택)</span>
                </label>
                <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="불편했던 점이나 개선사항을 자유롭게 남겨주세요."
                    rows={4}
                    className={`${inputCls} resize-none`}
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 border border-border hover:border-primary/40 text-foreground py-3 rounded-xl text-sm font-semibold transition-all"
                >
                    이전
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!reason}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                    다음 →
                </button>
            </div>
        </div>
    );
}

// ── Step 3: 최종 확인 + 비밀번호 재확인 ─────────────────────────────────────

function StepConfirm({
                         onBack,
                         onWithdraw,
                         isSubmitting,
                     }: {
    onBack: () => void;
    onWithdraw: (password: string) => void;
    isSubmitting: boolean;
}) {
    const [confirmText, setConfirmText] = useState("");
    const [password, setPassword] = useState("");

    const isConfirmMatch = confirmText === CONFIRM_PHRASE;
    const canSubmit = isConfirmMatch && password.length > 0 && !isSubmitting;

    return (
        <div className="space-y-5">
            <div
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 leading-relaxed space-y-1">
                <p className="font-bold text-sm">⚠ 탈퇴 후에는 복구가 불가능합니다.</p>
                <p>계정 및 모든 데이터는 즉시 비활성화되며, 30일 이후 완전히 삭제됩니다.</p>
            </div>

            {/* 확인 문구 타이핑 */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                    아래 문구를 정확히 입력해 주세요.
                </label>
                <div
                    className="px-4 py-2.5 bg-muted/50 rounded-xl text-sm font-mono text-foreground border border-border select-none">
                    {CONFIRM_PHRASE}
                </div>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="위 문구를 그대로 입력해 주세요"
                    className={`${inputCls} ${
                        confirmText && !isConfirmMatch ? "border-red-400" : ""
                    } ${isConfirmMatch ? "border-emerald-400 bg-emerald-50/30" : ""}`}
                />
                {confirmText && !isConfirmMatch && (
                    <p className="text-xs text-red-500">문구가 일치하지 않습니다.</p>
                )}
                {isConfirmMatch && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 문구가 일치합니다.
                    </p>
                )}
            </div>

            {/* 비밀번호 재확인 */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                    현재 비밀번호 재확인
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력해 주세요"
                    className={inputCls}
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex-1 border border-border hover:border-primary/40 text-foreground py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                    이전
                </button>
                <button
                    type="button"
                    onClick={() => onWithdraw(password)}
                    disabled={!canSubmit}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <><Loader2 size={14} className="animate-spin"/> 탈퇴 처리 중...</>
                    ) : (
                        "최종 탈퇴 신청"
                    )}
                </button>
            </div>
        </div>
    );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const STEP_LABELS = ["탈퇴 가능 확인", "탈퇴 사유", "최종 확인"];

export function WithdrawPage() {
    const navigate = useNavigate();
    const {user, clearUser} = useAuthStore();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [reason, setReason] = useState<WithdrawReason | "">("");
    const [detail, setDetail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWithdraw = async (password: string) => {
        try {
            setIsSubmitting(true);
            // TODO: DELETE /api/users/me
            // body: { password, reason, detail }
            await new Promise((r) => setTimeout(r, 1200)); // mock

            toast.success("탈퇴가 완료되었습니다.", {
                description: "그동안 이용해 주셔서 감사합니다.",
            });
            clearUser();
            navigate("/auth");
        } catch (error: any) {
            toast.error("탈퇴 실패", {
                description: error.message || "탈퇴 처리 중 오류가 발생했습니다.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-lg mx-auto py-12 px-4">

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    type="button"
                    onClick={() => step === 1 ? navigate("/mypage") : setStep((s) => (s - 1) as 1 | 2 | 3)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={20}/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500"/> 회원 탈퇴
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        탈퇴 후 복구는 불가능합니다. 신중하게 진행해 주세요.
                    </p>
                </div>
            </div>

            {/* 스텝 인디케이터 */}
            <div className="flex items-center mb-8">
                {STEP_LABELS.map((label, idx) => {
                    const num = idx + 1;
                    const isActive = step === num;
                    const isDone = step > num;
                    return (
                        <div key={label} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                        isActive ? "bg-red-600 text-white"
                                            : isDone ? "bg-red-100 text-red-600"
                                                : "bg-muted text-muted-foreground"
                                    }`}>
                                    {isDone ? "✓" : num}
                                </div>
                                <span className={`text-[10px] whitespace-nowrap ${
                                    isActive ? "text-red-600 font-semibold" : "text-muted-foreground"
                                }`}>
                                    {label}
                                </span>
                            </div>
                            {idx < STEP_LABELS.length - 1 && (
                                <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                                    isDone ? "bg-red-200" : "bg-border"
                                }`}/>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 스텝 렌더링 */}
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                {step === 1 && (
                    <StepPreCheck onPass={() => setStep(2)}/>
                )}
                {step === 2 && (
                    <StepReason
                        reason={reason}
                        setReason={setReason}
                        detail={detail}
                        setDetail={setDetail}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}
                {step === 3 && (
                    <StepConfirm
                        onBack={() => setStep(2)}
                        onWithdraw={handleWithdraw}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    );
}
