// ── 공통 탭/필터 타입 ──────────────────────────────────────────────────────────

export type Role         = "president" | "employee";
export type MemberStatus = "active" | "pending" | "inactive";
export type SellerStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
export type ActiveTab    = "members" | "addresses" | "company" | "brands" | "bank";
export type FilterTab    = "all" | "active" | "pending" | "inactive";
export type DefaultType  = "return" | "shipping" | "receiving";

// ── Member ────────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  last_login_at: string | null;
  joinedAt: string;
}

// ── Address (AddressesTab은 유저에서도 공유하므로 여기선 제외) ───────────────────
// AddressesTab 전용 타입은 AddressesTab.tsx 내부에 유지합니다.

// ── Company ───────────────────────────────────────────────────────────────────

/**
 * CompanyTab 폼 상태 타입.
 * CompanyTab.tsx가 mock 데이터에서 쓰던 로컬 interface와 통합.
 * (기존 types.ts의 CompanyForm과 필드명을 camelCase로 통일)
 */
export interface CompanyForm {
  name: string;
  businessNumber: string;         // 읽기 전용 (사업자등록번호)
  representativeName: string;
  representativePhone: string;
  websiteUrl: string;
  description: string;
  address: string;
  addressDetail: string;
  logoUrl: string | null;
  logoFile: File | null;
  businessLicenseUrl: string | null;
  businessLicenseFile: File | null;
}

// ── Bank Account ──────────────────────────────────────────────────────────────

/**
 * BankAccountTab.tsx + CompanyTab.tsx 둘 다 쓰던 로컬 interface 통합.
 */
export interface BankAccount {
  bankAccountId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  isVerified: boolean;
}

// ── Brand ─────────────────────────────────────────────────────────────────────

/** DB: brands 테이블 */
export interface Brand {
  brand_id: number;
  company_id: number;
  brand_name: string;
  brand_logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandForm {
  brand_name: string;
  brand_logo_url: string | null;
  logoFile: File | null;
}