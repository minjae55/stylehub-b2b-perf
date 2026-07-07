import { X } from "lucide-react";

/**
 * alert() 대체용 공용 모달 - 확인 버튼 하나만 있음
 */
export function AlertModal({
                               message,
                               onClose,
                           }: {
    message: string;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-lg leading-none">!</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-foreground font-medium mb-6 leading-relaxed whitespace-pre-line">
                    {message}
                </p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded text-sm font-semibold transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * window.confirm() 대체용 공용 모달 - 확인/취소 버튼
 * confirmLabel/cancelLabel로 버튼 문구 커스텀 가능 (예: "삭제" / "취소")
 */
export function ConfirmModal({
                                 message,
                                 onConfirm,
                                 onCancel,
                                 confirmLabel = "확인",
                                 cancelLabel = "취소",
                                 danger = false,
                             }: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean; // true면 확인 버튼을 빨간색(삭제 등 위험 동작)으로 표시
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-sm text-foreground font-medium mb-6 text-center leading-relaxed whitespace-pre-line">
                    {message}
                </p>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={onCancel}
                        className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2 rounded text-sm font-medium transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded text-sm font-semibold transition-colors text-white ${
                            danger ? "bg-red-400 hover:bg-red-500" : "bg-primary hover:bg-primary/90"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
