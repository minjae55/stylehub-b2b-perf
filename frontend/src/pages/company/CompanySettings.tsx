import {useState} from "react";
import {AlertTriangle, ChevronRight, ShieldCheck} from "lucide-react";
import type {ActiveTab} from "./types";
import {SIDEBAR_NAV} from "./shared";
import {BankAccountTab} from "./BankAccountTab";
import {CompanyTab} from "./CompanyTab";
import {MembersTab} from "./MembersTab";
import {BrandsTab} from "./BrandsTab";
import {AddressesTab} from "./AddressesTab";
import {useAuthStore} from "@/store/useAuthStore";

// ── Company Card Component ──────────────────────────────
function CompanyCard() {
    const user = useAuthStore((state) => state.user);

    const companyName = user?.companyName || "소속 회사 없음";
    const initials = companyName.slice(0, 2);

    const getSellerBadge = () => {
        const companyStatus = user?.companyStatus?.toUpperCase();
        const sellerStatus = user?.sellerStatus?.toUpperCase();

        if (companyStatus === "SUSPENDED") return {label: "계정 정지", className: "text-red-600 bg-red-50 border-red-200"};
        if (sellerStatus === "PENDING") return {
            label: "승인 대기",
            className: "text-amber-600 bg-amber-50 border-amber-200"
        };
        if (sellerStatus === "APPROVED") return {
            label: "셀러 승인",
            className: "text-emerald-600 bg-emerald-50 border-emerald-200"
        };

        return {label: "미인증", className: "text-muted-foreground bg-muted border-border"};
    };
    const badge = getSellerBadge();

    return (
        <div
            className="bg-white border border-border rounded-xl p-5 mb-5 flex flex-col items-center text-center shadow-sm">
            {/* 회사 로고 영역 */}
            <div
                className="w-38 h-38 rounded-2xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center overflow-hidden mb-4 shadow-sm border border-border/40 flex-shrink-0 select-none">
                {user?.logoUrl ? (
                    <img src={user.logoUrl || ""} alt={companyName} className="w-full h-full object-cover"/>
                ) : (
                    initials
                )}
            </div>

            {/* 회사 이름 및 상태 배지 */}
            <div className="w-full min-w-0 flex flex-col items-center">
                <div className="flex flex-col items-center gap-1.5 w-full px-1">
                    <p className="w-full text-base font-bold text-foreground break-all tracking-tight leading-tight [word-break:break-word] text-center">
                        {companyName}
                    </p>

                    <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border transition-all shrink-0 ${badge.className}`}>
            {user?.companyStatus === "SUSPENDED" ? <AlertTriangle size={9}/> : <ShieldCheck size={9}/>}
                        {badge.label}
          </span>
                </div>
            </div>
        </div>
    );
}

// ── Main Settings Component ───────────────────────────────────────────────────
export function CompanySettings() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("company");

    const currentNav = SIDEBAR_NAV.find((n) => n.key === activeTab) || SIDEBAR_NAV[0];

    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
            <div className="flex gap-6 items-start">

                {/* ── 사이드바 영역 ── */}
                <aside className="w-56 shrink-0">
                    {/* 단순 시각 노출용 회사 프로필 카드 */}
                    <CompanyCard/>

                    <nav className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border bg-muted/[0.03]">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                회사 설정 메뉴
                            </p>
                        </div>

                        <div className="p-2">
                            {SIDEBAR_NAV.map((item) => {
                                const active = activeTab === item.key;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key)}
                                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all mb-0.5 last:mb-0 group ${
                                            active
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                    <span className={`mt-0.5 shrink-0 ${active ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {item.icon}
                    </span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold leading-tight ${active ? "text-white" : ""}`}>
                                                {item.label}
                                            </p>
                                            <p className={`text-[11px] mt-0.5 leading-tight ${active ? "text-white/60" : "text-muted-foreground/60"}`}>
                                                {item.desc}
                                            </p>
                                        </div>
                                        {active &&
                                            <ChevronRight size={14} className="ml-auto mt-0.5 text-white/70 shrink-0"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </aside>

                {/* ── 우측 콘텐츠 영역 ── */}
                <main className="flex-1 min-w-0">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 px-1">
                        <span>회사 관리</span>
                        <ChevronRight size={11}/>
                        <span className="text-foreground font-medium">{currentNav.label}</span>
                    </div>

                    {/* 메인 탭 컴포넌트 출력 패널 */}
                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        {activeTab === "company" && <CompanyTab/>}
                        {activeTab === "members" && <MembersTab/>}
                        {activeTab === "brands" && <BrandsTab/>}
                        {activeTab === "addresses" && <AddressesTab/>}
                        {activeTab === "bank" && <BankAccountTab/>}
                    </div>
                </main>

            </div>
        </div>
    );
}