import React, { useState, useRef, type JSX } from "react";
import {
  UserPlus, Mail, Clock, CheckCircle, XCircle, AlertCircle,
  X, Search, Crown, Ban, Building2, Globe, Camera, Lock,
  Upload, ShieldCheck, Users, Save, MapPin,
} from "lucide-react";
import { AddressManagement } from "@/app/components/ui/AddressManagement";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role          = "president" | "employee";
type MemberStatus  = "active" | "pending" | "inactive";
type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED";
type ActiveTab     = "members" | "addresses" | "company";
type FilterTab     = "all" | "active" | "pending" | "inactive";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  lastLogin: string | null;
  joinedAt: string;
}

interface CompanyForm {
  name: string;
  logoFile: File | null;
  businessNumber: string;
  businessLicenseFile: File | null;
  representativeName: string;
  address: string;
  addressDetail: string;
  websiteUrl: string;
  description: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string }> = {
  president: { label: "대표", color: "bg-amber-100 text-amber-700 border-amber-200" },
  employee:  { label: "직원", color: "bg-primary/10 text-primary border-primary/20" },
};

const MEMBER_STATUS_META: Record<MemberStatus, { label: string; icon: JSX.Element; color: string }> = {
  active:   { label: "활성",     icon: <CheckCircle size={13} />, color: "text-emerald-600" },
  pending:  { label: "초대 대기", icon: <Clock size={13} />,       color: "text-amber-500"  },
  inactive: { label: "비활성",   icon: <XCircle size={13} />,     color: "text-muted-foreground" },
};

const COMPANY_STATUS_META: Record<CompanyStatus, {
  label: string; color: string; bg: string; border: string; desc: string;
}> = {
  PENDING:  {
    label: "심사 중", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",
    desc: "제출된 서류를 검토 중입니다. 보통 1~2 영업일 내 완료됩니다.",
  },
  APPROVED: {
    label: "승인됨",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
    desc: "회사 정보가 검증되었습니다. 정보 변경 시 재심사가 진행될 수 있습니다.",
  },
  REJECTED: {
    label: "반려됨",  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",
    desc: "서류 반려 사유를 확인하고 사업자등록증을 재업로드해 주세요.",
  },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "전체" },
  { key: "active",   label: "활성" },
  { key: "pending",  label: "초대 대기" },
  { key: "inactive", label: "비활성" },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "홍길동",  email: "hong@fashionco.kr",  role: "president", status: "active",   lastLogin: "방금 전",     joinedAt: "2024.01.15" },
  { id: "2", name: "이영희",  email: "lee@fashionco.kr",   role: "employee",  status: "active",   lastLogin: "2시간 전",    joinedAt: "2024.03.02" },
  { id: "3", name: "김철수",  email: "kim@fashionco.kr",   role: "employee",  status: "active",   lastLogin: "어제",        joinedAt: "2024.05.11" },
  { id: "4", name: "박지원",  email: "park@fashionco.kr",  role: "employee",  status: "active",   lastLogin: "3일 전",      joinedAt: "2024.06.20" },
  { id: "5", name: "최민준",  email: "choi@fashionco.kr",  role: "employee",  status: "inactive", lastLogin: "2024.11.01",  joinedAt: "2024.04.08" },
  { id: "6", name: "",        email: "new1@partner.kr",    role: "employee",  status: "pending",  lastLogin: null,          joinedAt: "2025.01.10" },
  { id: "7", name: "",        email: "new2@partner.kr",    role: "employee",  status: "pending",  lastLogin: null,          joinedAt: "2025.01.12" },
];

const MOCK_COMPANY: CompanyForm = {
  name: "(주)패션코리아",
  logoFile: null,
  businessNumber: "123-45-67890",
  businessLicenseFile: null,
  representativeName: "홍길동",
  address: "서울특별시 중구 을지로 123",
  addressDetail: "패션빌딩 5층",
  websiteUrl: "https://fashionkorea.kr",
  description:
      "동대문 기반 의류 도매 전문 업체입니다. 티셔츠, 니트, 아우터 등 다양한 카테고리를 취급하며 소량 MOQ 가능합니다.",
};

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";
const readonlyCls =
    "w-full border border-border rounded px-3 py-2.5 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed";

function Field({
                 label, required, hint, children,
               }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
      <div>
        <label className="block text-sm font-medium text-[#333] mb-1.5">
          {label}
          {required && <span className="text-primary ml-1 text-xs">(필수)</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${m.color}`}>
      {role === "president" && <Crown size={10} />}
        {m.label}
    </span>
  );
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const m = MEMBER_STATUS_META[status];
  return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name ? name.slice(0, 2) : email.slice(0, 2).toUpperCase();
  return (
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
        {initials}
      </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle size={15} className="text-emerald-400" />
        {message}
      </div>
  );
}

// ── Invite Panel ──────────────────────────────────────────────────────────────

function InvitePanel({
                       onClose, onInvite,
                     }: {
  onClose: () => void;
  onInvite: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!email.trim()) return;
    onInvite(email.trim());
    setEmail("");
  };

  return (
      <div className="border border-primary/30 bg-primary/[0.03] rounded-lg p-5 mb-5">
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
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="초대할 이메일 주소"
              className="flex-1 border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
          />
          <button
              onClick={submit}
              disabled={!email.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
          >
            초대 보내기
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-primary/50 shrink-0" />
          초대받은 직원은 가입 완료 후 이 페이지에서 계정을 활성화할 수 있습니다.
        </p>
      </div>
  );
}

// ── Action Button ─────────────────────────────────────────────────────────────

function ActionButton({
                        member, onStatusChange, onResendInvite,
                      }: {
  member: Member;
  onStatusChange: (id: string, status: MemberStatus) => void;
  onResendInvite: (id: string) => void;
}) {
  if (member.role === "president") {
    return <span className="text-xs text-muted-foreground/50">–</span>;
  }

  const config: Record<MemberStatus, {
    label: string; icon: JSX.Element; cls: string; action: () => void;
  }> = {
    pending:  {
      label: "재발송",   icon: <Mail size={12} />,
      cls: "text-primary border-primary/20 hover:bg-primary/5",
      action: () => onResendInvite(member.id),
    },
    active:   {
      label: "비활성화", icon: <Ban size={12} />,
      cls: "text-red-600 border-red-200 hover:bg-red-50",
      action: () => onStatusChange(member.id, "inactive"),
    },
    inactive: {
      label: "활성화",   icon: <CheckCircle size={12} />,
      cls: "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
      action: () => onStatusChange(member.id, "active"),
    },
  };

  const c = config[member.status];
  return (
      <button
          onClick={c.action}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-[11px] font-medium transition-colors whitespace-nowrap ${c.cls}`}
      >
        {c.icon}{c.label}
      </button>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab() {
  const [members, setMembers]       = useState<Member[]>(MOCK_MEMBERS);
  const [filterTab, setFilterTab]   = useState<FilterTab>("all");
  const [search, setSearch]         = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = (email: string) => {
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()), name: "", email,
        role: "employee", status: "pending",
        lastLogin: null,
        joinedAt: new Date()
            .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
            .replace(/\. /g, ".").replace(/\.$/, ""),
      },
    ]);
    setShowInvite(false);
    showToast(`${email}로 초대 메일을 발송했습니다.`);
  };

  const handleStatusChange = (id: string, status: MemberStatus) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    showToast(status === "active" ? "계정을 활성화했습니다." : "계정을 비활성화했습니다.");
  };

  const handleResendInvite = (id: string) => {
    const m = members.find((m) => m.id === id);
    if (m) showToast(`${m.email}로 초대 메일을 재발송했습니다.`);
  };

  const stats = {
    total:    members.length,
    active:   members.filter((m) => m.status === "active").length,
    pending:  members.filter((m) => m.status === "pending").length,
    inactive: members.filter((m) => m.status === "inactive").length,
  };

  const filtered = members.filter((m) => {
    const matchTab    = filterTab === "all" || m.status === filterTab;
    const q           = search.trim().toLowerCase();
    const matchSearch = !q || m.name.includes(q) || m.email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
      <>
        {/* Sub-header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            직원을 초대하고 계정 상태를 관리하세요.
          </p>
          <button
              onClick={() => setShowInvite((v) => !v)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <UserPlus size={15} /> 팀원 초대
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "전체 인원", value: stats.total,    color: "text-foreground" },
            { label: "활성",      value: stats.active,   color: "text-emerald-600" },
            { label: "초대 대기", value: stats.pending,  color: "text-amber-500" },
            { label: "비활성",    value: stats.inactive, color: "text-muted-foreground" },
          ].map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-lg px-4 py-3">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
          ))}
        </div>

        {/* Invite panel */}
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

        {/* Search + filter */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 이메일 검색"
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden text-xs shrink-0">
            {FILTER_TABS.map((t) => (
                <button
                    key={t.key}
                    onClick={() => setFilterTab(t.key)}
                    className={`px-3 py-2 font-semibold transition-colors whitespace-nowrap ${
                        filterTab === t.key
                            ? "bg-primary text-white"
                            : "bg-white text-muted-foreground hover:text-primary"
                    }`}
                >
                  {t.label}
                  {t.key !== "all" && (
                      <span className={`ml-1 tabular-nums ${filterTab === t.key ? "text-white/70" : "text-muted-foreground"}`}>
                  ({stats[t.key as keyof typeof stats]})
                </span>
                  )}
                </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[minmax(0,2fr)_100px_120px_130px_80px] gap-4 px-5 py-2.5 bg-muted/30 border-b border-border">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">이름 / 이메일</span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">역할</span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">상태</span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">최근 로그인</span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">관리</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                해당하는 팀원이 없습니다.
              </div>
          ) : (
              <div className="divide-y divide-border">
                {filtered.map((member) => (
                    <div
                        key={member.id}
                        className={`grid grid-cols-[minmax(0,2fr)_100px_120px_130px_80px] gap-4 px-5 py-4 items-center hover:bg-muted/[0.04] transition-colors ${
                            member.status === "inactive" ? "opacity-50" : ""
                        }`}
                    >
                      {/* Name / email */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={member.name} email={member.email} />
                        <div className="min-w-0">
                          {member.name ? (
                              <>
                                <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </>
                          ) : (
                              <>
                                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                <p className="text-xs text-amber-500">가입 전</p>
                              </>
                          )}
                        </div>
                      </div>

                      {/* Role */}
                      <div><RoleBadge role={member.role} /></div>

                      {/* Status */}
                      <div><MemberStatusBadge status={member.status} /></div>

                      {/* Last login */}
                      <div className="text-xs text-muted-foreground">
                        {member.lastLogin ?? <span className="text-amber-500">미접속</span>}
                      </div>

                      {/* Action */}
                      <div>
                        <ActionButton
                            member={member}
                            onStatusChange={handleStatusChange}
                            onResendInvite={handleResendInvite}
                        />
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>

        {toast && <Toast message={toast} />}
      </>
  );
}

// ── Company Tab ───────────────────────────────────────────────────────────────

function CompanyTab() {
  const [form, setForm]               = useState<CompanyForm>(MOCK_COMPANY);
  const [companyStatus]               = useState<CompanyStatus>("APPROVED");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const logoInputRef                  = useRef<HTMLInputElement>(null);
  const licenseInputRef               = useRef<HTMLInputElement>(null);

  const set = (partial: Partial<CompanyForm>) => setForm((f) => ({ ...f, ...partial }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set({ logoFile: file });
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    // TODO: replace with real API call
    setTimeout(() => {
      setSaving(false);
      setToast("회사 정보가 저장되었습니다.");
      setTimeout(() => setToast(null), 3000);
    }, 900);
  };

  const sm       = COMPANY_STATUS_META[companyStatus];
  const logoSrc  = logoPreview ?? null;
  const initials = form.name.replace(/[\(\)주식회사㈜]/g, "").trim().slice(0, 2) || "FA";

  return (
      <>
        {/* Approval status banner */}
        <div className={`flex items-start gap-3 rounded-lg px-4 py-3.5 border mb-6 ${sm.bg} ${sm.border}`}>
          <ShieldCheck size={16} className={`${sm.color} shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-semibold ${sm.color}`}>
              플랫폼 승인 상태: {sm.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{sm.desc}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Section 1: 브랜드 & 소개 ── */}
          <section className="bg-white border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users size={14} className="text-primary" /> 브랜드 & 소개
            </h3>

            {/* Logo upload */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div
                    onClick={() => logoInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                >
                  {logoSrc ? (
                      <img src={logoSrc} alt="로고" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-xl font-black text-primary/30">{initials}</span>
                  )}
                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>
                <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">회사 로고</p>
                <p className="text-xs text-muted-foreground">JPG, PNG · 최대 2MB · 1:1 비율 권장</p>
                <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="mt-2 text-xs text-primary hover:underline"
                >
                  {logoSrc ? "로고 변경" : "로고 업로드"}
                </button>
              </div>
            </div>

            {/* Company name */}
            <Field label="상호명" required>
              <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="(주)패션코리아"
                  className={inputCls}
              />
            </Field>

            {/* Description */}
            <Field label="회사 소개" hint={`${form.description.length} / 500자`}>
            <textarea
                value={form.description}
                onChange={(e) =>
                    e.target.value.length <= 500 && set({ description: e.target.value })
                }
                placeholder="회사 소개, 취급 카테고리, 강점 등을 자유롭게 입력해 주세요."
                rows={4}
                className={`${inputCls} resize-none`}
            />
            </Field>
          </section>

          {/* ── Section 2: 사업자 정보 ── */}
          <section className="bg-white border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Building2 size={14} className="text-primary" /> 사업자 정보
            </h3>

            {/* Business number — read-only */}
            <Field
                label="사업자등록번호"
                hint="가입 시 등록된 번호입니다. 변경이 필요하면 고객센터에 문의해 주세요."
            >
              <div className="relative">
                <input
                    type="text"
                    value={form.businessNumber}
                    readOnly
                    className={`${readonlyCls} pr-9`}
                />
                <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              </div>
            </Field>

            {/* Representative name */}
            <Field label="대표자명" required>
              <input
                  type="text"
                  value={form.representativeName}
                  onChange={(e) => set({ representativeName: e.target.value })}
                  placeholder="홍길동"
                  className={inputCls}
              />
            </Field>

            {/* Business license re-upload */}
            <Field label="사업자등록증" hint="재발급 등 갱신이 있을 경우 새 파일을 업로드해 주세요.">
              <label className="block border-2 border-dashed border-border rounded p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                    ref={licenseInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) =>
                        e.target.files?.[0] && set({ businessLicenseFile: e.target.files[0] })
                    }
                />
                {form.businessLicenseFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                      <Upload size={15} />
                      {form.businessLicenseFile.name}
                    </div>
                ) : (
                    <>
                      <Upload size={18} className="mx-auto text-muted-foreground mb-1.5" />
                      <p className="text-sm text-muted-foreground">클릭하여 업로드</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF · 최대 10MB</p>
                    </>
                )}
              </label>
            </Field>
          </section>

          {/* ── Section 3: 연락처 & 위치 ── */}
          <section className="bg-white border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" /> 연락처 & 위치
            </h3>

            {/* Address */}
            <Field label="사업장 주소" required>
              <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="시/도 및 도로명 주소"
                  className={`${inputCls} mb-2`}
              />
              <input
                  type="text"
                  value={form.addressDetail}
                  onChange={(e) => set({ addressDetail: e.target.value })}
                  placeholder="상세 주소 (동/호수 등)"
                  className={inputCls}
              />
            </Field>

            {/* Website */}
            <Field label="홈페이지 URL">
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => set({ websiteUrl: e.target.value })}
                    placeholder="https://yourcompany.kr"
                    className={`${inputCls} pl-8`}
                />
              </div>
            </Field>
          </section>

          {/* Save button */}
          <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.name || !form.representativeName || !form.address}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm transition-colors"
          >
            {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
            ) : (
                <>
                  <Save size={15} /> 변경 사항 저장
                </>
            )}
          </button>
        </div>

        {toast && <Toast message={toast} />}
      </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

const PAGE_TABS: { key: ActiveTab; label: string; icon: JSX.Element }[] = [
  { key: "members",   label: "직원 관리", icon: <Users size={14} /> },
  { key: "addresses", label: "주소 관리", icon: <MapPin size={14} /> },
  { key: "company",   label: "회사 정보", icon: <Building2 size={14} /> },
];

export function CompanySettings() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("members");

  return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">회사 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            직원 초대 및 계정 관리, 회사 정보 수정을 여기서 할 수 있습니다.
          </p>
        </div>

        {/* Underline tab bar */}
        <div className="flex border-b border-border mb-6">
          {PAGE_TABS.map((t) => (
              <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                      activeTab === t.key
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t.icon}
                {t.label}
              </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "members"   && <MembersTab />}
        {activeTab === "addresses" && <AddressManagement />}
        {activeTab === "company"   && <CompanyTab />}
      </div>
  );
}