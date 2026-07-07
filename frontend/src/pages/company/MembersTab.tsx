import {useEffect, useState} from "react";
import {ChevronDown, Clock, Search, ShieldCheck, UserPlus, Users, X,} from "lucide-react";
import {getCompanyMembers, inviteMember, updateMemberRole, updateMemberStatus,} from "@/api/company/company.service";
import type {BusinessRole, CompanyMemberResponse, MemberUserStatus} from "@/api/company/company.types";
import {Avatar, inputCls, PanelCard, StatusDot, Toast} from "./shared";
import {useAuthStore} from "@/store/useAuthStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLastLogin(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR");
}

// ── InvitePanel ───────────────────────────────────────────────────────────────

function InvitePanel({ onClose, onInvite }: {
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const invalid = !email.trim() || !email.includes("@") || loading;

  const submit = async () => {
    if (invalid) return;
    setLoading(true);
    await onInvite(email.trim());
    setLoading(false);
    setEmail("");
  };

  return (
      <div className="border border-primary/25 bg-primary/[0.03] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={14} className="text-primary"/>
            <span className="text-sm font-semibold">직원 초대</span>
          </div>
          <button onClick={onClose}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14}/>
          </button>
        </div>
        <div className="flex gap-2">
          <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="초대할 이메일 주소"
              className={inputCls}
              disabled={loading}
          />
          <button
              onClick={submit}
              disabled={invalid}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "보내는 중..." : "초대 보내기"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-primary/50 shrink-0"/>
          가입 완료 후 이 목록에 자동으로 추가됩니다.
        </p>
      </div>
  );
}

// ── RoleDropdown ──────────────────────────────────────────────────────────────

function RoleDropdown<T extends string>({
                                          value, options, onChange, disabled,
                                        }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
      <div className="relative inline-block">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
            disabled={disabled}
            className="appearance-none pl-2.5 pr-6 py-1 text-[11px] font-semibold border border-border rounded-md bg-white text-foreground outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={10}
                     className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
      </div>
  );
}

// ── MembersTab ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "APPROVED" | "PENDING" | "SUSPENDED";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  {key: "all", label: "전체"},
  {key: "APPROVED", label: "활성"},
  {key: "PENDING", label: "대기"},
  {key: "SUSPENDED", label: "비활성"},
];

const BUSINESS_ROLE_OPTIONS: { value: BusinessRole; label: string }[] = [
  {value: "BUYER", label: "바이어"},
  {value: "SELLER", label: "셀러"},
  {value: "BOTH", label: "바이어 + 셀러"},
];

// 💡 백엔드 Enum 값에 맞춘 계정 상태 드롭다운 옵션
const STATUS_OPTIONS: { value: MemberUserStatus; label: string }[] = [
  {value: "PENDING", label: "가입 대기"},
  {value: "APPROVED", label: "정상 이용"},
  {value: "SUSPENDED", label: "이용 정지"},
  {value: "DELETED", label: "탈퇴 처리"},
];

export function MembersTab() {
  const [members, setMembers] = useState<CompanyMemberResponse[]>([]);
  const [filterTab, setFilterTab]   = useState<FilterTab>("all");
  const [search, setSearch]         = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((state) => state.user);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadMembers = async () => {
    if (!user?.companyId) return;
    try {
      setLoading(true);
      const data = await getCompanyMembers(user.companyId);
      setMembers(data);
    } catch {
      showToast("직원 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (email: string) => {
    try {
      await inviteMember({email});
      showToast(`${email}로 초대 메일을 발송했습니다.`);
      setShowInvite(false);
      loadMembers();
    } catch {
      showToast("초대 메일 발송에 실패했습니다.");
    }
  };

  // 💡 상태 변경용 핸들러 (드롭다운 바뀔 때 실행)
  const handleStatusChange = async (userId: number, status: MemberUserStatus) => {
    try {
      await updateMemberStatus(userId, {status});
      setMembers((prev) => prev.map((m) => m.userId === userId ? {...m, status} : m));

      const matched = STATUS_OPTIONS.find(o => o.value === status);
      showToast(`계정 상태를 [${matched?.label || status}]로 변경했습니다.`);
    } catch {
      showToast("상태 변경에 실패했습니다.");
    }
  };

  const handleRoleChange = async (
      userId: number,
      fields: { businessRole?: BusinessRole }
  ) => {
    try {
      await updateMemberRole(userId, fields);
      setMembers((prev) => prev.map((m) => m.userId === userId ? {...m, ...fields} : m));
      showToast("거래 유형을 수정했습니다.");
    } catch {
      showToast("거래 유형 수정에 실패했습니다.");
    }
  };

  const stats = {
    total: members.length,
    APPROVED: members.filter((m) => m.status === "APPROVED").length,
    PENDING: members.filter((m) => m.status === "PENDING").length,
    SUSPENDED: members.filter((m) => m.status === "SUSPENDED").length,
  };

  const filtered = members.filter((m) => {
    const matchTab    = filterTab === "all" || m.status === filterTab;
    const q           = search.trim().toLowerCase();
    const matchSearch = !q || (m.name ?? "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  if (loading) return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        데이터를 불러오는 중입니다...
      </div>
  );

  return (
      <div className="space-y-4">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">직원을 초대하고 계정 상태를 관리하세요.</p>
          <button
              onClick={() => setShowInvite((v) => !v)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <UserPlus size={13}/> 직원 초대
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {label: "전체 인원", value: stats.total, cls: "text-foreground"},
            {label: "활성", value: stats.APPROVED, cls: "text-emerald-600"},
            {label: "대기", value: stats.PENDING, cls: "text-amber-500"},
            {label: "비활성", value: stats.SUSPENDED, cls: "text-slate-400"},
          ].map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-xl px-4 py-3.5">
                <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
          ))}
        </div>

        {/* Invite panel */}
        {showInvite && (
            <InvitePanel onClose={() => setShowInvite(false)} onInvite={handleInvite}/>
        )}

        {/* Pending notice */}
        {stats.PENDING > 0 && !showInvite && (
            <div
                className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
              <Clock size={13} className="shrink-0 text-amber-500"/>
              초대 수락을 기다리는 직원이 <strong>{stats.PENDING}명</strong> 있습니다.
            </div>
        )}

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-60">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 이메일"
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden text-xs ml-auto">
            {FILTER_TABS.map((t) => (
                <button
                    key={t.key}
                    onClick={() => setFilterTab(t.key)}
                    className={`px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
                        filterTab === t.key
                            ? "bg-primary text-white"
                            : "bg-white text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    }`}
                >
                  {t.label}
                  {t.key !== "all" && (
                      <span className={`ml-1 ${filterTab === t.key ? "opacity-70" : ""}`}>
                  ({stats[t.key as keyof typeof stats]})
                </span>
                  )}
                </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <PanelCard title={`직원 ${filtered.length}명`} icon={<Users size={13}/>} noPad>
          {/* 💡 기존 레이아웃을 그대로 살린 컬럼명 변경 (상태 및 계정 제어를 직관적으로 정렬) */}
          <div
              className="grid grid-cols-[minmax(0,3fr)_135px_120px_145px_105px] gap-3 px-5 py-2.5 bg-muted/30 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>이름 / 이메일</span>
            <span>거래 유형</span>
            <span>상태 표시</span>
            <span>최근 로그인</span>
            <span>계정 제어</span>
          </div>

          {filtered.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                해당하는 직원이 없습니다.
              </div>
          ) : (
              <div className="divide-y divide-border">
                {filtered.map((m) => {
                  const isPresident = m.role === "PRESIDENT";
                  return (
                      <div
                          key={m.userId}
                          className={`grid grid-cols-[minmax(0,3fr)_140px_120px_140px_110px] gap-3 px-5 py-3.5 items-center hover:bg-muted/[0.03] transition-colors ${
                              m.status === "SUSPENDED" ? "opacity-50" : m.status === "DELETED" ? "opacity-40" : ""
                          }`}
                      >
                        {/* 이름 / 이메일 */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={m.name ?? ""} email={m.email}/>
                          <div className="min-w-0">
                            {m.name ? (
                                <>
                                  <p className="text-sm font-semibold truncate leading-tight">{m.name}</p>
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{m.email}</p>
                                </>
                            ) : (
                                <>
                                  <p className="text-sm text-muted-foreground truncate leading-tight">{m.email}</p>
                                  <p className="text-[11px] text-amber-500 mt-0.5">가입 전</p>
                                </>
                            )}
                          </div>
                        </div>

                        {/* 거래 유형 (BusinessRole) */}
                        <div>
                          <RoleDropdown
                              value={m.businessRole}
                              options={BUSINESS_ROLE_OPTIONS}
                              onChange={(v) => handleRoleChange(m.userId, {businessRole: v})}
                              disabled={isPresident || m.status === "SUSPENDED" || m.status === "DELETED"}
                          />
                        </div>

                        {/* 상태 표시 (StatusDot 시각적 요소 그대로 유지) */}
                        <div>
                          <StatusDot
                              status={
                                m.status === "APPROVED" ? "active" :
                                    m.status === "PENDING" ? "pending" : "inactive"
                              }
                          />
                        </div>

                        {/* 최근 로그인 */}
                        <div className="text-xs text-muted-foreground">
                          {m.lastLoginAt
                              ? formatLastLogin(m.lastLoginAt)
                              : <span className="text-amber-500 font-medium">미접속</span>
                          }
                        </div>

                        <div>
                          {isPresident ? (
                              <span className="text-xs text-muted-foreground/30">–</span>
                          ) : (
                              <RoleDropdown
                                  value={m.status}
                                  options={STATUS_OPTIONS}
                                  onChange={(v) => handleStatusChange(m.userId, v)}
                                  disabled={m.status === "DELETED"} // 이미 탈퇴한 계정은 수정 불가 처리
                              />
                          )}
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </PanelCard>

        {toast && <Toast message={toast}/>}
      </div>
  );
}