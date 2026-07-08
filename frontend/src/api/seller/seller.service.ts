import api from "@/api/axios";
import {
    QuoteDraftResponse,
    SellerDisputeResponse,
    SellerNegotiationResponse,
    SellerSettlementResponse,
    SellerShipmentResponse,
    SellerSourcingRequestResponse,
    SellerTransitResponse
} from "./seller.type";

export const sellerService = {
    // 1. 신규 소싱 요청 피드 조회
    getNewSourcingRequests: async (): Promise<SellerSourcingRequestResponse> => {
        return await api.get<SellerSourcingRequestResponse>("dashboard/sourcing-requests/seller", {
            params: {status: "PENDING"}
        });
    },

    // 2. 작성 중이거나 마감 임박인 견적서 조회
    getQuoteDrafts: async (): Promise<QuoteDraftResponse> => {
        return await api.get<QuoteDraftResponse>("dashboard/quotes/seller", {
            params: {status: "DRAFT"}
        });
    },

    // 3. 대화 및 협의 목록 조회
    getNegotiations: async (): Promise<SellerNegotiationResponse> => {
        return await api.get<SellerNegotiationResponse>("dashboard/negotiations/seller", {
            params: {status: "OPEN"}
        });
    },

    // 4. 출고 대기 주문 목록 조회
    getPendingShipments: async (): Promise<SellerShipmentResponse> => {
        return await api.get<SellerShipmentResponse>("dashboard/orders/seller", {
            params: {status: "PREPARING"}
        });
    },

    // 5. 배송 흐름 또는 확정 대기 목록 조회
    getTransits: async (): Promise<SellerTransitResponse> => {
        return await api.get<SellerTransitResponse>("dashboard/orders/seller", {
            params: {status: "SHIPPED,DELIVERED"}
        });
    },

    // 6. 구매자가 제기한 클레임 분쟁 건 조회
    getActiveDisputes: async (): Promise<SellerDisputeResponse> => {
        return await api.get<SellerDisputeResponse>("dashboard/disputes/seller", {
            params: {status: "RECEIVED"}
        });
    },

    // 7. 정산 예정 내역 조회
    getPendingSettlements: async (): Promise<SellerSettlementResponse> => {
        return await api.get<SellerSettlementResponse>("dashboard/settlements/seller", {
            params: {status: "PENDING"}
        });
    }
};