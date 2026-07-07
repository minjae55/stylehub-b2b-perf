import api from "@/api/axios";

export type SourcingSupplierStatus = "SUGGESTED" | "RECOMMENDED" | "QUOTED" | "DECLINED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type SourcingStatus = "PENDING" | "QUOTED" | "NEGOTIATING" | "TRADING" | "COMPLETED" | "CANCELLED" | "WITHDRAWN" | "EXPIRED";

// BuyerSourcingList와 동일한 그룹 필터
export type SourcingGroupFilter = "ALL" | "ACTIVE" | "TRADING" | "COMPLETED" | "CLOSED";

// 백엔드 AdminSourcingRequestResponse 기준 (전체 소싱 요청, 회사 무관)
export interface AdminSourcingRequestResponse {
    sourcingRequestId: number;
    sourcingNo: string;
    type: string; // READY / CUSTOM
    status: SourcingStatus;
    productName: string;
    brandName: string | null;
    buyerCompanyId: number;
    buyerCompanyName: string | null;
    needSample: "Y" | "N";
    mainMaterial: string | null;
    unitPrice: number | null;
    totalBudget: number | null;
    refUrl: string | null;
    deliveryDate: string | null;
    expiryDate: string | null;
    categoryId: number | null;
    categoryName: string | null;
    detail: string | null;
    createdAt: string;
    pendingSupplierCount: number;
}

// 백엔드 AdminSourcingStatsResponse 기준 (BuyerSourcingCounts와 동일한 구조)
export interface AdminSourcingStatsResponse {
    all: number;
    active: number;
    trading: number;
    completed: number;
    closed: number;
}

// 백엔드 SourcingSupplierResponse 기준
export interface SourcingSupplierResponse {
    sourcingSupplierId: number;
    sellerCompanyId: number;
    sellerCompanyName: string | null;
    status: SourcingSupplierStatus;
    managerNote: string | null;
}

// 백엔드 AssignableCompanyResponse 기준 (관리자 수동배정 화면 - 회사 검색 결과)
export interface AssignableCompanyResponse {
    companyId: number;
    name: string;
}

// ───────────────────────────────────────────
// 전체 소싱 요청 현황 (회사 무관)
// ───────────────────────────────────────────

// 전체 소싱 요청 목록 — filter: ALL(기본)/ACTIVE/TRADING/COMPLETED/CLOSED
export const getAllSourcingRequests = async (
    filter: SourcingGroupFilter = "ALL"
): Promise<AdminSourcingRequestResponse[]> => {
    const params: Record<string, string> = {};
    if (filter !== "ALL") params.filter = filter;
    return await api.get<AdminSourcingRequestResponse[]>("/admin/sourcing/requests", { params });
};

// 전체 소싱 요청 그룹별 통계
export const getSourcingStats = async (): Promise<AdminSourcingStatsResponse> => {
    return await api.get<AdminSourcingStatsResponse>("/admin/sourcing/stats");
};

// ───────────────────────────────────────────
// 관리자 소싱 승인 대기 큐
// ───────────────────────────────────────────

export const getSuggestedSuppliers = async (
    sourcingRequestId: number
): Promise<SourcingSupplierResponse[]> => {
    return await api.get<SourcingSupplierResponse[]>(
        `/admin/sourcing/${sourcingRequestId}/suppliers/suggested`
    );
};

export const approveSupplier = async (sourcingSupplierId: number): Promise<void> => {
    await api.patch<void>(`/admin/sourcing/suppliers/${sourcingSupplierId}/approve`);
};

export const rejectSupplier = async (
    sourcingSupplierId: number,
    reason: string
): Promise<void> => {
    await api.patch<void>(`/admin/sourcing/suppliers/${sourcingSupplierId}/reject`, { reason });
};

// ───────────────────────────────────────────
// 관리자 수동배정
// ───────────────────────────────────────────

// 배정 가능한 회사 검색 - keyword가 빈 문자열이면 전체(카테고리/승인상태 필터만 적용)
// includeAllCategories=true면 카테고리 매칭 필터를 건너뛰고 전체 검색 (셀러 카테고리 등록 누락 등 예외 상황용)
export const getAssignableCompanies = async (
    sourcingRequestId: number,
    keyword: string,
    includeAllCategories: boolean = false
): Promise<AssignableCompanyResponse[]> => {
    return await api.get<AssignableCompanyResponse[]>(
        `/admin/sourcing/${sourcingRequestId}/assignable-companies`,
        { params: { keyword, includeAllCategories } }
    );
};

// 특정 회사를 해당 소싱 요청에 수동 배정 (SUGGESTED 상태로 생성되어 기존 승인/반려 큐에 들어감)
export const manualAssignSupplier = async (
    sourcingRequestId: number,
    companyId: number
): Promise<void> => {
    await api.post<void>(
        `/admin/sourcing/${sourcingRequestId}/suppliers`,
        null,
        { params: { companyId } }
    );
};