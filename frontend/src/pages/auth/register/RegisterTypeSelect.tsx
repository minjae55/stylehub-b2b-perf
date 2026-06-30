import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {ArrowRight, Building2, User} from "lucide-react";

type Role = "buyer" | "seller";
type MemberType = "president" | "employee";

export function RegisterTypeSelect() {
    const navigate = useNavigate();
    const [role, setRole] = useState<Role | null>(null);
    const [memberType, setMemberType] = useState<MemberType | null>(null);

    const handleNext = () => {
        if (!role || !memberType) return;
        navigate(`/auth/register/${role}/${memberType}`);
    };

    const handleRoleSelect = (selectedRole: Role) => {
        if (role === selectedRole) {
            setRole(null); // 이미 선택된 걸 누르면 접기 (null로 초기화)
            setMemberType(null); // 하위 메뉴도 같이 초기화하는 것을 추천합니다.
        } else {
            setRole(selectedRole); // 아니면 선택
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-2">회원가입</h2>
            <p className="text-sm text-muted-foreground mb-6">
                가입 후 담당자 확인을 거쳐 계정이 활성화됩니다.
            </p>

            {/* 역할 선택 */}
            <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-2.5">어떤 회원으로 가입하시나요?</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleRoleSelect("buyer")}
                        className={`border-2 rounded p-4 text-left transition-all ${
                            role === "buyer"
                                ? "border-primary bg-secondary"
                                : "border-border hover:border-primary/40"
                        }`}
                    >
                        <User size={22}
                              className={`mb-2 ${role === "buyer" ? "text-primary" : "text-muted-foreground"}`}/>
                        <div
                            className={`font-semibold text-sm ${role === "buyer" ? "text-primary" : "text-foreground"}`}>
                            바이어
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">의류를 도매로 구매하는 소매 사업자</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleSelect("seller")}
                        className={`border-2 rounded p-4 text-left transition-all ${
                            role === "seller"
                                ? "border-primary bg-secondary"
                                : "border-border hover:border-primary/40"
                        }`}
                    >
                        <Building2 size={22}
                                   className={`mb-2 ${role === "seller" ? "text-primary" : "text-muted-foreground"}`}/>
                        <div
                            className={`font-semibold text-sm ${role === "seller" ? "text-primary" : "text-foreground"}`}>
                            셀러 (공급업체)
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">의류를 도매로 공급하는 셀러·브랜드</div>
                    </button>
                </div>
            </div>

            {/* 회원 유형 선택 - 역할 선택 후 노출 */}
            <div
                className={`transition-all duration-300 overflow-hidden ${
                    role ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="mb-5">
                    <p className="text-sm font-semibold text-foreground mb-2.5">가입자 유형을 선택해 주세요.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setMemberType("president")}
                            className={`border-2 rounded p-4 text-left transition-all ${
                                memberType === "president"
                                    ? "border-primary bg-secondary"
                                    : "border-border hover:border-primary/40"
                            }`}
                        >
                            <User size={18}
                                  className={`mb-2 ${memberType === "president" ? "text-primary" : "text-muted-foreground"}`}/>
                            <div
                                className={`font-semibold text-sm ${memberType === "president" ? "text-primary" : "text-foreground"}`}>
                                대표자
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">사업자 대표로 직접 가입</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMemberType("employee")}
                            className={`border-2 rounded p-4 text-left transition-all ${
                                memberType === "employee"
                                    ? "border-primary bg-secondary"
                                    : "border-border hover:border-primary/40"
                            }`}
                        >
                            <User size={18}
                                  className={`mb-2 ${memberType === "employee" ? "text-primary" : "text-muted-foreground"}`}/>
                            <div
                                className={`font-semibold text-sm ${memberType === "employee" ? "text-primary" : "text-foreground"}`}>
                                직원
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">대표자 위임을 받아 가입</div>
                        </button>
                    </div>

                    {memberType === "employee" && (
                        <div
                            className="mt-3 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700 leading-relaxed">
                            직원으로 가입 시 <strong>대표자 위임장 및 재직증명서</strong>가 추가로 필요합니다.
                            다음 단계에서 업로드할 수 있습니다.
                        </div>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={handleNext}
                disabled={!role || !memberType}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                다음 <ArrowRight size={16}/>
            </button>

            <div className="mt-5 text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link to="/auth" className="text-primary font-semibold hover:underline">
                    로그인
                </Link>
            </div>
        </div>
    );
}