import api from "@/api/axios";
import {BuyerDispute, BuyerNegotiation, BuyerOrder, BuyerQuote, BuyerSourcing, UrgentReceipt} from "./buyer.type";

export const buyerService = {
    // 소싱 요청 목록 조회
    getSourcingRequests: async (): Promise<BuyerSourcing[]> => {
        return await api.get<BuyerSourcing[]>("dashboard/sourcing-requests/buyer", {
            params: {status: "PENDING,QUOTED,NEGOTIATING"}
        });
    },

    // 받은 견적 내역 조회
    getReceivedQuotes: async (): Promise<BuyerQuote[]> => {
        return await api.get<BuyerQuote[]>("dashboard/quotes/buyer", {
            params: {status: "SUBMITTED"}
        });
    },

    // 협의 진행중 내역 조회
    getNegotiations: async (): Promise<BuyerNegotiation[]> => {
        return await api.get<BuyerNegotiation[]>("dashboard/negotiations/buyer", {
            params: {status: "OPEN"}
        });
    },

    // 결제 대기 중인 주문 목록 조회
    getPendingPayments: async (): Promise<BuyerOrder[]> => {
        return await api.get<BuyerOrder[]>("dashboard/orders/buyer", {
            params: {status: "PENDING"}
        });
    },

    // 배송 중인 내역 조회
    getShippingOrders: async (): Promise<BuyerOrder[]> => {
        return await api.get<BuyerOrder[]>("dashboard/orders/buyer", {
            params: {status: "SHIPPED"}
        });
    },

    // 이의제기 진행 내역 조회
    getActiveDisputes: async (): Promise<BuyerDispute[]> => {
        return await api.get<BuyerDispute[]>("dashboard/disputes/buyer", {
            params: {status: "RECEIVED,UNDER_REVIEW"}
        });
    },

    // 자동확정 임박 건 조회
    getUrgentReceipts: async (): Promise<UrgentReceipt[]> => {
        return await api.get<UrgentReceipt[]>("dashboard/orders/buyer/urgent-receipts");
    }
};