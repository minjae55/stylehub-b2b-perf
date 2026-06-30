import {Link} from "react-router";
import {ArrowRight, CheckCircle} from "lucide-react";

export function RegisterSuccess() {
    return (
        <div className="text-center py-4 px-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">가입 신청이 완료되었습니다</h2>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                가입 상태가 <strong>검토 중(PENDING)</strong>으로 처리되었습니다.<br />
                담당자 확인 후 승인 완료 이메일을 발송해 드립니다.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
                승인 완료 후 모든 서비스를 이용하실 수 있습니다. (영업일 기준 1~2일 소요)
            </p>
            <Link
                to="/"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold text-sm transition-colors inline-flex items-center gap-2"
            >
                홈으로 돌아가기 <ArrowRight size={16} />
            </Link>
        </div>
    );
}