import {JSX, useState} from "react";
import {
  UserPlus, MoreVertical, Mail, ShieldCheck, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronDown, X, Search, Crown, Ban
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "president" | "employee";
type Status = "active" | "pending" | "inactive";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin: string | null;
  joinedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string; }> = {
  president:     { label: "대표",     color: "bg-amber-100 text-amber-700 border-amber-200" },
  employee:   { label: "직원",   color: "bg-primary/10 text-primary border-primary/20" }
};

const STATUS_META: Record<Status, { label: string; icon: JSX.Element; color: string }> = {
  active:   { label: "활성",     icon: <CheckCircle size={13} />, color: "text-emerald-600" },
  pending:  { label: "초대 대기", icon: <Clock size={13} />,       color: "text-amber-500" },
  inactive: { label: "비활성",   icon: <XCircle size={13} />,     color: "text-muted-foreground" },
};

const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "홍길동",   email: "hong@fashionco.kr",    role: "president",     status: "active",   lastLogin: "방금 전",     joinedAt: "2024.01.15" },
  { id: "2", name: "이영희",   email: "lee@fashionco.kr",     role: "employee",   status: "active",   lastLogin: "2시간 전",    joinedAt: "2024.03.02" },
  { id: "3", name: "김철수",   email: "kim@fashionco.kr",     role: "employee",     status: "active",   lastLogin: "어제",        joinedAt: "2024.05.11" },
  { id: "4", name: "박지원",   email: "park@fashionco.kr",    role: "employee", status: "active",   lastLogin: "3일 전",      joinedAt: "2024.06.20" },
  { id: "5", name: "최민준",   email: "choi@fashionco.kr",    role: "employee",   status: "inactive", lastLogin: "2024.11.01", joinedAt: "2024.04.08" },
  { id: "6", name: "",         email: "new1@partner.kr",      role: "employee",     status: "pending",  lastLogin: null,          joinedAt: "2025.01.10" },
  { id: "7", name: "",         email: "new2@partner.kr",      role: "employee", status: "pending",  lastLogin: null,          joinedAt: "2025.01.12" },
];

type TabKey = "all" | "active" | "pending" | "inactive";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "전체" },
  { key: "active",   label: "활성" },
  { key: "pending",  label: "초대 대기" },
  { key: "inactive", label: "비활성" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${m.color}`}>
      {role === "president" && <Crown size={10} />}
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name ? name.slice(0, 2) : email.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

// ─── Invite Panel ─────────────────────────────────────────────────────────────

function InvitePanel({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onInvite(email.trim(), role);
    setEmail("");
  };

  return (
    <div className="border border-primary/30 bg-primary/[0.03] rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">팀원 초대</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="초대할 이메일 주소"
          className="flex-1 border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white transition-colors"
        >
          {(Object.entries(ROLE_META) as [Role, typeof ROLE_META[Role]][])
            .filter(([r]) => r !== "president")
            .map(([r, m]) => (
              <option key={r} value={r}>{m.label}</option>
            ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={!email.trim()}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
        >
          초대 보내기
        </button>
      </div>

      {/* Role preview */}
      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-primary/50" />
      </div>
    </div>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
function ActionButton({
                        member,
                        onStatusChange,
                        onResendInvite,
                      }: {
  member: Member;
  onStatusChange: (id: string, status: Status) => void;
  onResendInvite: (id: string) => void;
}) {
  const BUTTON_CONFIG = {
    pending: {
      label: "재발송",
      icon: <Mail size={12} />,
      className: "text-primary border-primary/20 hover:bg-primary/5",
      onClick: () => onResendInvite(member.id),
    },
    active: {
      label: "비활성화",
      icon: <Ban size={12} />,
      className: "text-red-600 border-red-200 hover:bg-red-50",
      onClick: () => onStatusChange(member.id, "inactive"),
    },
    inactive: {
      label: "활성화",
      icon: <CheckCircle size={12} />,
      className: "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
      onClick: () => onStatusChange(member.id, "active"),
    },
  };

  const btn = BUTTON_CONFIG[member.status];

  if (member.role === "president") return <div className="w-16" />;

  return (
      <button
          onClick={btn.onClick}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border text-[11px] font-medium transition-colors whitespace-nowrap ${btn.className}`}
      >
        {btn.icon}
        {btn.label}
      </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EmployeeManagement() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = (email: string, role: Role) => {
    const newMember: Member = {
      id: String(Date.now()),
      name: "",
      email,
      role,
      status: "pending",
      lastLogin: null,
      joinedAt: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(".", ""),
    };
    setMembers((prev) => [...prev, newMember]);
    setShowInvite(false);
    showToast(`${email}로 초대 메일을 발송했습니다.`);
  };

  const handleRoleChange = (id: string, role: Role) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
    showToast("역할을 변경했습니다.");
  };

  const handleStatusChange = (id: string, status: Status) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    showToast(status === "active" ? "계정을 활성화했습니다." : "계정을 비활성화했습니다.");
  };

  const handleResendInvite = (id: string) => {
    const m = members.find((m) => m.id === id);
    if (m) showToast(`${m.email}로 초대 메일을 재발송했습니다.`);
  };

  const filtered = members.filter((m) => {
    const matchTab = tab === "all" || m.status === tab;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || m.name.includes(q) || m.email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const stats = {
    total:    members.length,
    active:   members.filter((m) => m.status === "active").length,
    pending:  members.filter((m) => m.status === "pending").length,
    inactive: members.filter((m) => m.status === "inactive").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">직원 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            직원을 초대하고 계정을 관리하세요.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <UserPlus size={16} />
          팀원 초대
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "전체 인원",  value: stats.total,    color: "text-foreground" },
          { label: "활성",       value: stats.active,   color: "text-emerald-600" },
          { label: "초대 대기",  value: stats.pending,  color: "text-amber-500" },
          { label: "비활성",     value: stats.inactive, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-lg px-4 py-3 bg-white">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Invite Panel */}
      {showInvite && (
        <InvitePanel onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}

      {/* Pending notice */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-amber-700">
          <AlertCircle size={15} className="shrink-0" />
          초대 수락을 기다리는 팀원이 <strong>{stats.pending}명</strong> 있습니다.
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex items-center justify-between mb-3">

        {/* 좌측: 검색창 */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 이메일 검색"
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* 우측: 탭 버튼 그룹 */}
        <div className="flex border border-border rounded-lg overflow-hidden text-xs">
          {TABS.map((t) => (
              <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 font-semibold transition-colors whitespace-nowrap ${
                      tab === t.key ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-primary"
                  }`}
              >
                {t.label}
                {t.key !== "all" && (
                    <span className={`ml-1 ${tab === t.key ? "text-white/70" : "text-muted-foreground"}`}>
            ({stats[t.key as keyof typeof stats]})
          </span>
                )}
              </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-4 py-2.5 bg-muted/30 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          <span>이름 / 이메일</span>
          <span>역할</span>
          <span>상태</span>
          <span>최근 로그인</span>
          <span>상태</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            해당하는 팀원이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((member) => (
              <div
                key={member.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-4 py-3.5 items-center transition-colors hover:bg-muted/20 ${
                  member.status === "inactive" ? "opacity-50" : ""
                }`}
              >
                {/* Name / Email */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.name} email={member.email} />
                  <div className="min-w-0">
                    {member.name ? (
                      <>
                        <div className="text-sm font-semibold text-foreground truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                        <div className="text-xs text-amber-500">가입 전</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div><RoleBadge role={member.role} /></div>

                {/* Status */}
                <div><StatusBadge status={member.status} /></div>

                {/* Last Login */}
                <div className="text-xs text-muted-foreground">
                  {member.lastLogin ?? <span className="text-amber-500">미접속</span>}
                </div>

                {/* Actions */}
                <ActionButton
                  member={member}
                  onStatusChange={handleStatusChange}
                  onResendInvite={handleResendInvite}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle size={15} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
