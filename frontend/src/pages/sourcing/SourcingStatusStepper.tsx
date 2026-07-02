import { Check, Ban, FlaskConical, MessageSquareText } from "lucide-react";

// ── 타입 ────────────────────────────────────────────────────────────────────
type SourcingStatus =
    | "PENDING"
    | "QUOTED"
    | "NEGOTIATING"
    | "TRADING"
    | "COMPLETED"
    | "CANCELLED"
    | "WITHDRAWN"
    | "EXPIRED";

interface SourcingStatusStepperProps {
    status: SourcingStatus;
    needSample?: "Y" | "N";
    className?: string;
}

// ── 항상 고정된 4개 핵심 단계. 협의(NEGOTIATING)는 모든 요청에 끼는 게 아니라
//    "견적수신 → 거래진행" 사이에 선택적으로 발생하는 구간이므로 고정 번호를 주지 않고,
//    그 사이 연결선 위에 별도 마커로 표시한다. ─────────────────────────────────
const CORE_STEPS: { key: "PENDING" | "QUOTED" | "TRADING" | "COMPLETED"; label: string; desc: string }[] = [
    { key: "PENDING",   label: "요청 접수", desc: "공급사 배정 후 대기 중" },
    { key: "QUOTED",    label: "견적 수신", desc: "공급사가 견적을 제출함" },
    { key: "TRADING",   label: "거래 진행", desc: "승인 후 거래가 진행됨" },
    { key: "COMPLETED", label: "완료",     desc: "거래가 종료됨" },
];

const CORE_INDEX: Record<string, number> = {
    PENDING: 0,
    QUOTED: 1,
    TRADING: 2,
    COMPLETED: 3,
};

// ── 중단 상태 배너 (취소/반려/만료는 정상 흐름의 '단계'가 아니라 이탈이므로 스테퍼 대신 배너로 표시) ──
function TerminatedBanner({ status }: { status: "CANCELLED" | "WITHDRAWN" | "EXPIRED" }) {
    const style =
        status === "CANCELLED"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-border bg-secondary text-muted-foreground";
    const message =
        status === "CANCELLED"
            ? "모든 공급사가 거절하여 요청이 자동으로 반려되었습니다."
            : status === "WITHDRAWN"
                ? "바이어가 이 소싱 요청을 직접 취소했습니다."
                : "견적 마감 기한이 지나 요청이 자동으로 만료되었습니다.";

    return (
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${style}`}>
            <Ban size={16} className="flex-shrink-0" />
            {message}
        </div>
    );
}

// ── 메인 스테퍼 ───────────────────────────────────────────────────────────────
export function SourcingStatusStepper({ status, needSample = "N", className = "" }: SourcingStatusStepperProps) {
    if (status === "CANCELLED" || status === "WITHDRAWN" || status === "EXPIRED") {
        return (
            <div className={className}>
                <TerminatedBanner status={status} />
            </div>
        );
    }

    const isNegotiating = status === "NEGOTIATING";
    // 협의 중일 땐 "견적수신"까지는 확정 완료로 보고, 다음 노드(거래진행)는 아직 미도달로 취급
    const effectiveIndex = isNegotiating ? CORE_INDEX.QUOTED : (CORE_INDEX[status] ?? 0);

    return (
        <div className={className}>
            <div className="flex items-start">
                {CORE_STEPS.map((step, i) => {
                    const isDone = i < effectiveIndex;
                    const isCurrent = i === effectiveIndex && !isNegotiating;
                    const isLast = i === CORE_STEPS.length - 1;
                    // 견적수신 → 거래진행 사이 연결선 = 협의가 낄 수도, 안 낄 수도 있는 구간
                    const connectorAfterThis = !isLast && step.key === "QUOTED";
                    const showSampleNote = needSample === "Y" && step.key === "QUOTED";

                    return (
                        <div key={step.key} className={`flex items-start ${isLast ? "" : "flex-1"}`}>
                            <div className="flex flex-col items-center" style={{ width: 88 }}>
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                                        isDone
                                            ? "border-primary bg-primary text-white"
                                            : isCurrent
                                                ? "border-primary bg-white text-primary"
                                                : "border-border bg-white text-muted-foreground"
                                    }`}
                                >
                                    {isDone ? <Check size={15} /> : i + 1}
                                </div>
                                <div className={`mt-2 text-center text-xs font-semibold ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                                    {step.label}
                                </div>
                                <div className="mt-0.5 text-center text-[10px] leading-tight text-muted-foreground">
                                    {step.desc}
                                </div>
                                {showSampleNote && (
                                    <div className="mt-1.5 flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                        <FlaskConical size={9} /> 샘플 확인 후 진행
                                    </div>
                                )}
                            </div>

                            {!isLast && (
                                <div className="relative mt-4 flex-1">
                                    <div className={`h-0.5 w-full transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
                                    {connectorAfterThis && isNegotiating && (
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                            <MessageSquareText size={10} /> 협의 중
                                        </div>
                                    )}
                                    {connectorAfterThis && !isNegotiating && (
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-white px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                            협의 (선택)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
