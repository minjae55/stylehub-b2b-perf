import api from "@/api/axios";
import {
    QuoteDraft,
    SellerDispute,
    SellerNegotiation,
    SellerSettlement,
    SellerShipment,
    SellerSourcingRequest,
    SellerTransit
} from "./seller.type";

export const sellerService = {
    // 신규 소싱 요청 피드 조회
    getNewSourcingRequests: async (): Promise<SellerSourcingRequest[]> => {
        return await api.get<SellerSourcingRequest[]>("dashboard/sourcing-requests/seller", {
            params: {status: "PENDING"}
        });
    },

    // 작성 중이거나 마감 임박인 견적서 조회
    getQuoteDrafts: async (): Promise<QuoteDraft[]> => {
        return await api.get<QuoteDraft[]>("dashboard/quotes/seller", {
            params: {status: "DRAFT"}
        });
    },

    // 대화 및 협의 목록 조회
    getNegotiations: async (): Promise<SellerNegotiation[]> => {
        return await api.get<SellerNegotiation[]>("dashboard/negotiations/seller", {
            params: {status: "OPEN"}
        });
    },

    // 출고 대기 주문 목록 조회
    getPendingShipments: async (): Promise<SellerShipment[]> => {
        return await api.get<SellerShipment[]>("dashboard/orders/seller", {
            params: {status: "PREPARING"}
        });
    },

    // 배송 흐름 또는 확정 대기 목록 조회
    getTransits: async (): Promise<SellerTransit[]> => {
        return await api.get<SellerTransit[]>("dashboard/orders/seller", {
            params: {status: "SHIPPED,DELIVERED"}
        });
    },

    // 구매자가 제기한 클레임 분쟁 건 조회
    getActiveDisputes: async (): Promise<SellerDispute[]> => {
        return await api.get<SellerDispute[]>("dashboard/disputes/seller", {
            params: {status: "RECEIVED"}
        });
    },

    // 정산 예정 내역 조회
    getPendingSettlements: async (): Promise<SellerSettlement[]> => {
        return await api.get<SellerSettlement[]>("dashboard/settlements/seller", {
            params: {status: "PENDING"}
        });
    }
};