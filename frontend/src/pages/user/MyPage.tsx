import {type JSX, useState} from "react";
import {Ban, Bell, Building2, ChevronRight, Clock, Heart, MapPin, ShieldCheck, User} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {ProfileTab} from "./ProfileTab";
import {SecurityTab} from "./SecurityTab";
import {LoginHistoryTab} from "./LoginHistoryTab";
import {NotificationTab} from "./NotificationTab";
import {BlockTab} from "./BlockTab";
import {ProductActivityTab} from "./ProductActivityTab";
import {AddressesTab} from "@/pages/company/AddressesTab";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TabId =
    | "product-activity"
    | "address"
    | "profile"
    | "company"
    | "security"
    | "login-history"
    | "notifications"
    | "blocks";

interface NavGroup {
    label: string;
    items: { id: TabId; label: string; icon: JSX.Element }[];
}

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
    {
        label: "내 활동",
        items: [
            {id: "product-activity", label: "관심 · 최근 본 상품", icon: <Heart size={15}/>},
            {id: "blocks", label: "숨긴 브랜드", icon: <Ban size={15}/>}, // 브랜드/업체 숨김
        ],
    },
    {
        label: "계정",
        items: [
            {id: "profile", label: "내 프로필", icon: <User size={15}/>},
            {id: "security", label: "보안 설정", icon: <ShieldCheck size={15}/>},
            {id: "address", label: "기본 주소 관리", icon: <MapPin size={15}/>},
            {id: "login-history", label: "접속 기록", icon: <Clock size={15}/>}, // 보안용 모니터링
            {id: "notifications", label: "알림 설정", icon: <Bell size={15}/>},
        ],
    },
];

// ── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard() {
    const user = useAuthStore((state) => state.user);

    const name = user?.name ?? "사용자";
    const email = user?.email ?? "";
    const initials = name.slice(0, 2);

    const roleLabel =
        user?.businessRole === "BUYER" ? "고객사" :
            user?.businessRole === "SELLER" ? "공급사" :
                user?.businessRole === "BOTH" ? "통합" : null;

    return (
        <div className="bg-white border border-border rounded-xl p-5 mb-5 flex flex-col items-center text-center">
            <div
                className="w-38 h-38 rounded-full bg-primary/10 text-primary font-black text-2xl flex items-center justify-center overflow-hidden mb-4 shadow-sm border border-border/40 flex-shrink-0">
                {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={name} className="w-full h-full object-cover"/>
                ) : (
                    initials
                )}
            </div>

            <div className="w-full min-w-0 flex flex-col items-center">
                <div className="flex items-center justify-center gap-1.5 w-full px-1">
                    <p className="text-[16px] font-bold text-foreground truncate">{name}</p>
                    {roleLabel && (
                        <span
                            className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {roleLabel}
                </span>
                    )}
                </div>

                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-medium truncate w-full px-1 mt-1">
                    <Building2 size={12} className="text-muted-foreground/70 flex-shrink-0"/>
                    <span className="truncate">{(user as any).companyName ?? "소속 회사"}</span>
                </p>
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MyPage() {
    const [activeTab, setActiveTab] = useState<TabId>("profile");

    const handleWithdraw = () => {
        if (confirm("정말 탈퇴하시겠습니까? 소속된 회사 정보 및 내역이 모두 삭제됩니다.")) {
            console.log("회원 탈퇴 프로세스 진행");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex gap-6 items-start">
                {/* ── Sidebar ── */}
                <nav className="w-52 shrink-0 flex flex-col justify-between min-h-[640px]">
                    <div>
                        <ProfileCard/>

                        <div className="space-y-5">
                            {NAV_GROUPS.map((group) => (
                                <div key={group.label}>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                                        {group.label}
                                    </p>
                                    <div className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const active = activeTab === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveTab(item.id)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                        active
                                                            ? "bg-primary text-white"
                                                            : "text-foreground hover:bg-muted/50"
                                                    }`}
                                                >
                                <span className={active ? "text-white" : "text-muted-foreground"}>
                                  {item.icon}
                                </span>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {!active && (
                                                        <ChevronRight size={13} className="text-muted-foreground/40"/>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* ── Content ── */}
                <div className="flex-1 min-w-0 bg-white border border-border rounded-xl p-6">
                    {activeTab === "product-activity" && <ProductActivityTab/>}
                    {activeTab === "address" && <AddressesTab/>}
                    {activeTab === "profile" && <ProfileTab/>}
                    {activeTab === "security" && <SecurityTab/>}
                    {activeTab === "login-history" && <LoginHistoryTab/>}
                    {activeTab === "notifications" && <NotificationTab/>}
                    {activeTab === "blocks" && <BlockTab/>}
                </div>
            </div>
        </div>
    );
}