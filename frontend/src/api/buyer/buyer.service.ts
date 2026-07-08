import api from "@/api/axios";
import {
    BuyerDispute,
    BuyerNegotiationResponse,
    BuyerOrderResponse,
    BuyerQuoteResponse,
    BuyerSourcingResponse,
    UrgentReceipt
} from "./buyer.type";

export const buyerService = {
    // 1. 소싱 요청 목록 조회 (알맹이 상자가 바로 추론됩니다!)
    getSourcingRequests: async (): Promise<BuyerSourcingResponse> => {
        return await api.get<BuyerSourcingResponse>("dashboard/sourcing-requests/buyer", {
            params: {status: "PENDING,QUOTED,NEGOTIATING"}
        });
    },

    // 2. 받은 견적 내역 조회
    getReceivedQuotes: async (): Promise<BuyerQuoteResponse> => {
        return await api.get<BuyerQuoteResponse>("dashboard/quotes/buyer", {
            params: {status: "SUBMITTED"}
        });
    },

    // 3. 협의 진행중 내역 조회
    getNegotiations: async (): Promise<BuyerNegotiationResponse> => {
        return await api.get<BuyerNegotiationResponse>("dashboard/negotiations/buyer", {
            params: {status: "OPEN"}
        });
    },

    // 4. 결제 대기 중인 주문 목록 조회
    getPendingPayments: async (): Promise<BuyerOrderResponse> => {
        return await api.get<BuyerOrderResponse>("dashboard/orders/buyer", {
            params: {status: "PENDING"}
        });
    },

    // 5. 배송 중인 내역 조회
    getShippingOrders: async (): Promise<BuyerOrderResponse> => {
        return await api.get<BuyerOrderResponse>("dashboard/orders/buyer", {
            params: {status: "SHIPPED"}
        });
    },

    // 6. 이의제기 진행 내역 조회
    getActiveDisputes: async (): Promise<BuyerDispute[]> => {
        return await api.get<BuyerDispute[]>("dashboard/disputes/buyer", {
            params: {status: "RECEIVED,UNDER_REVIEW"}
        });
    },

    // 7. 자동확정 임박 건 조회
    getUrgentReceipts: async (): Promise<UrgentReceipt[]> => {
        return await api.get<UrgentReceipt[]>("dashboard/orders/buyer/urgent-receipts");
    }
};