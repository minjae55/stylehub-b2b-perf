/**
 * inquiry.service.ts
 * 1:1 문의 API 통신 서비스 로직
 */

import api from "@/api/axios";
import {
    CompanyResponse,
    CreateInquiryPayload,
    EmployeeResponse,
    InquiryMessageResponse,
    InquiryResponse
} from "./inquiry.types";

// ───────────────────────────────────────────
// 문의 목록 및 단건 조회
// ───────────────────────────────────────────

/**
 * 문의 내역 목록 조회
 * (백엔드 인터셉터가 .data.data를 파싱한다고 가정하여 바로 결과를 리턴합니다.)
 * * 권한별 백엔드 처리 기준:
 * - ADMIN: 전체 회사의 모든 문의
 * - PRESIDENT: 자기 회사 소속 전체 문의
 * - EMPLOYEE: 본인이 생성한 문의만
 */
export const getInquiries = async (): Promise<InquiryResponse[]> => {
    return await api.get<InquiryResponse[]>("support/inquiries");
};

/**
 * 특정 문의 상세 조회
 */
export const getInquiryDetail = async (inquiryId: number): Promise<InquiryResponse> => {
    return await api.get<InquiryResponse>(`support/inquiries/${inquiryId}`);
};

// ───────────────────────────────────────────
// 대화 메시지 내역 및 상태 관리
// ───────────────────────────────────────────

/**
 * 특정 문의의 전체 대화 메시지 목록 조회
 */
export const getInquiryMessages = async (inquiryId: number): Promise<InquiryMessageResponse[]> => {
    return await api.get<InquiryMessageResponse[]>(`support/inquiries/${inquiryId}/messages`);
};

/**
 * 문의 읽음 처리 (채팅방 진입 시 unreadCount 초기화용)
 */
export const readInquiryMessages = async (inquiryId: number): Promise<void> => {
    await api.post<void>(`support/inquiries/${inquiryId}/read`);
};

// ───────────────────────────────────────────
// 문의 생성 및 전송 (HTTP Fallback용)
// ───────────────────────────────────────────

/**
 * 새 문의 작성 시작
 */
export const createInquiry = async (payload: CreateInquiryPayload): Promise<InquiryResponse> => {
    return await api.post<InquiryResponse>("support/inquiries", payload);
};

/**
 * 메시지 전송 (HTTP 통신 필요할 경우 사용)
 * *참고: 웹소켓(STOMP) 연동 시에는 이 API 대신 Socket Publish를 사용합니다.
 */
export const sendInquiryMessage = async (
    inquiryId: number,
    message: string
): Promise<InquiryMessageResponse> => {
    return await api.post<InquiryMessageResponse>(`support/inquiries/${inquiryId}/messages`, {message});
};

/**
 * PRESIDENT 화면의 직원 필터용 — 본인 회사 소속 직원 목록
 */
export const getInquiryEmployees = async (companyId: number): Promise<EmployeeResponse[]> => {
    return await api.get<EmployeeResponse[]>(`company/${companyId}/inquiry-employees`);
};

/**
 * ADMIN 화면의 회사 필터용 — 전체 회사 목록
 */
export const getCompanies = async (): Promise<CompanyResponse[]> => {
    return await api.get<CompanyResponse[]>("company");
};