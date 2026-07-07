package kr.remerge.stylehub.domain.dashboard.dto.seller;

import java.time.LocalDateTime;

public record SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName,
                                                 String buyerName, Integer qty, String lastMessage,
                                                 String lastMessageAt, Boolean hasNewMessage) {
    public SellerNegotiationDashboardResponse(Integer negotiationId, String title, String productName, String buyerName,
                                              Integer qty, String lastMessage, LocalDateTime lastMessageAt, Boolean hasNewMessage) {
        //  이미 정상적으로 표준 생성자를 위임 호출하고 있습니다. 수정할 필요가 없습니다.
        this(negotiationId, title, productName, buyerName, qty, lastMessage, lastMessageAt != null ? lastMessageAt.toString() : null, hasNewMessage != null ? hasNewMessage : false);
    }
}