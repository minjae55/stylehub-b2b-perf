package kr.remerge.stylehub.domain.tosspayment;

public record TossWebhookPayload(
        String eventType,   // "PAYMENT_STATUS_CHANGED" 등
        Data data
) {
    public record Data(String paymentKey, String status, String orderId) {}
}
