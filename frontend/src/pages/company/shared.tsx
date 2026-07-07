import React, {type JSX} from "react";
import {
  Building2,
  CheckCircle,
  Clock,
  Crown,
  Layers,
  MapPin,
  Package,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Star,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type {
  ActiveTab,
  BankAccount,
  Brand,
  CompanyForm,
  DefaultType,
  Member,
  MemberStatus,
  Role,
  SellerStatus,
} from "./types";

// ── CSS class 상수 ────────────────────────────────────────────────────────────

export const inputCls =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white placeholder:text-muted-foreground/40";

export const readonlyCls =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed";

export const textareaCls =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-none";

// ── 은행 목록 (BankAccountTab + CompanyTab 공용) ──────────────────────────────

export const BANK_OPTIONS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "기업은행",
  "농협은행", "SC제일은행", "씨티은행", "카카오뱅크", "토스뱅크",
  "케이뱅크", "수협은행", "대구은행", "부산은행",
];

// ── Meta 상수 ─────────────────────────────────────────────────────────────────

export const ROLE_META: Record<Role, { label: string; color: string }> = {
  president: { label: "대표", color: "bg-amber-50 text-amber-700 border-amber-200" },
  employee:  { label: "직원", color: "bg-blue-50 text-blue-700 border-blue-200"   },
};

export const MEMBER_STATUS_META: Record<MemberStatus, {
  label: string; icon: JSX.Element; color: string; dot: string;
}> = {
  active:   { label: "활성",     icon: <CheckCircle size={12} />, color: "text-emerald-600", dot: "bg-emerald-400" },
  pending: {label: "대기", icon: <Clock size={12}/>, color: "text-amber-500", dot: "bg-amber-400"},
  inactive: { label: "비활성",   icon: <XCircle size={12} />,     color: "text-slate-400",  dot: "bg-slate-300"  },
};

export const SELLER_STATUS_META: Record<SellerStatus, {
  label: string; desc: string; color: string; bg: string; border: string;
  icon: JSX.Element; pill: string;
}> = {
  NONE: {
    label: "미신청", desc: "셀러 승인을 신청하면 플랫폼에서 상품을 판매할 수 있습니다.",
    color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200",
    icon: <ShieldOff size={15} />, pill: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PENDING: {
    label: "심사 중", desc: "제출된 서류를 검토 중입니다. 보통 1~2 영업일 내 완료됩니다.",
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
    icon: <Shield size={15} />, pill: "bg-amber-100 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "승인됨", desc: "셀러 인증이 완료되었습니다. 정보 변경 시 재심사가 진행될 수 있습니다.",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
    icon: <ShieldCheck size={15} />, pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "반려됨", desc: "서류 반려 사유를 확인하고 사업자등록증을 재업로드해 주세요.",
    color: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    icon: <ShieldAlert size={15} />, pill: "bg-red-100 text-red-700 border-red-200",
  },
};

export const DEFAULT_META: Record<DefaultType, {
  label: string; icon: JSX.Element; color: string; bg: string; border: string; desc: string;
}> = {
  return: {
    label: "기본 반품지",
    desc: "회사 공통 반품지 (셀러 대표 전용)",
    icon: <RotateCcw size={11}/>,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  shipping: {
    label: "내 기본 출고지",
    desc: "내 출고 기본값 (셀러/BOTH 전용)",
    icon: <Package size={11}/>,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200"
  },
  receiving: {
    label: "내 기본 수령지",
    desc: "내 수령 기본값 (바이어/BOTH 전용)",
    icon: <Star size={11}/>,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20"
  },
};

export const SIDEBAR_NAV: { key: ActiveTab; label: string; icon: JSX.Element; desc: string }[] = [
  {key: "company", label: "회사 정보", icon: <Building2 size={15}/>, desc: "사업자 정보 및 소개"},
  {key: "members", label: "직원 관리", icon: <Users size={15}/>, desc: "직원 초대 및 권한 관리"},
  {key: "addresses", label: "주소 관리", icon: <MapPin size={15}/>, desc: "출고지 · 반품지 설정"},
  {key: "brands", label: "브랜드 관리", icon: <Layers size={15}/>, desc: "브랜드 등록"},
  {key: "bank", label: "계좌 관리", icon: <Wallet size={15}/>, desc: "계좌 등록 · 해제"},
];

// ── Mock 데이터 ───────────────────────────────────────────────────────────────

export const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "홍길동", email: "hong@fashionco.kr", role: "president", status: "active",   last_login_at: "방금 전",    joinedAt: "2024.01.15" },
  { id: "2", name: "이영희", email: "lee@fashionco.kr",  role: "employee",  status: "active",   last_login_at: "2시간 전",   joinedAt: "2024.03.02" },
  { id: "3", name: "김철수", email: "kim@fashionco.kr",  role: "employee",  status: "active",   last_login_at: "어제",       joinedAt: "2024.05.11" },
  { id: "4", name: "박지원", email: "park@fashionco.kr", role: "employee",  status: "active",   last_login_at: "3일 전",     joinedAt: "2024.06.20" },
  { id: "5", name: "최민준", email: "choi@fashionco.kr", role: "employee",  status: "inactive", last_login_at: "2024.11.01", joinedAt: "2024.04.08" },
  { id: "6", name: "",       email: "new1@partner.kr",   role: "employee",  status: "pending",  last_login_at: null,         joinedAt: "2025.01.10" },
  { id: "7", name: "",       email: "new2@partner.kr",   role: "employee",  status: "pending",  last_login_at: null,         joinedAt: "2025.01.12" },
];

export const MOCK_COMPANY: CompanyForm = {
  name: "(주)패션코리아",
  businessNumber: "123-45-67890",
  representativeName: "홍길동",
  representativePhone: "02-1234-5678",
  websiteUrl: "https://fashionkorea.kr",
  description: "동대문 기반 의류 도매 전문 업체입니다. 티셔츠, 니트, 아우터 등 다양한 카테고리를 취급하며 소량 MOQ 가능합니다.",
  address: "서울특별시 중구 을지로 123",
  addressDetail: "패션빌딩 5층",
  logoUrl: null,
  logoFile: null,
  businessLicenseUrl: "사업자등록증_패션코리아.pdf",
  businessLicenseFile: null,
};

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    bankAccountId: 1,
    bankName: "국민은행",
    accountNumber: "123-456-789012",
    accountHolder: "패션코 주식회사",
    isDefault: true,
    isVerified: true
  },
  {
    bankAccountId: 2,
    bankName: "신한은행",
    accountNumber: "110-123-456789",
    accountHolder: "패션코 주식회사",
    isDefault: false,
    isVerified: false
  },
];

export const MOCK_BRANDS: Brand[] = [
  {
    brand_id: 1,
    company_id: 1,
    brand_name: "르솔레이유",
    brand_logo_url: null,
    created_at: "2024.01.15",
    updated_at: "2024.01.15"
  },
  {
    brand_id: 2,
    company_id: 1,
    brand_name: "모아패션",
    brand_logo_url: null,
    created_at: "2024.03.02",
    updated_at: "2024.06.10"
  },
];

// ── 공통 UI 컴포넌트 ──────────────────────────────────────────────────────────

export function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-primary ml-1 text-[11px] font-normal opacity-70">(필수)</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
      </div>
  );
}

export function SectionHeader({icon, title, subtitle}: {
  icon: React.ReactNode; title: string; subtitle?: string;
}) {
  return (
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 ml-6">{subtitle}</p>}
      </div>
  );
}

/** 대시보드 패널 — 흰 카드 + 헤더 바 */
export function PanelCard({ title, icon, badge, children, noPad }: {
  title: string; icon?: React.ReactNode; badge?: React.ReactNode;
  children: React.ReactNode; noPad?: boolean;
}) {
  return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border bg-muted/[0.03]">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          {badge}
        </div>
        <div className={noPad ? "" : "p-5 space-y-4"}>{children}</div>
      </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return (
      <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${m.color}`}>
      {role === "president" && <Crown size={9} />}{m.label}
    </span>
  );
}

export function StatusDot({ status }: { status: MemberStatus }) {
  const m = MEMBER_STATUS_META[status];
  return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`} />{m.label}
    </span>
  );
}

export function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name ? name.slice(0, 2) : email.slice(0, 2).toUpperCase();
  return (
      <div
          className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
        {initials}
      </div>
  );
}

export function DefaultBadge({ type }: { type: DefaultType }) {
  const m = DEFAULT_META[type];
  return (
      <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
      {m.icon}{m.label}
    </span>
  );
}

export function Toast({ message }: { message: string }) {
  return (
      <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
        <CheckCircle size={14} className="text-emerald-400"/>{message}
      </div>
  );
}