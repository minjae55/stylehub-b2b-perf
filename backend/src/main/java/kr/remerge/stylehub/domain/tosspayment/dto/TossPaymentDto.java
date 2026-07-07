package kr.remerge.stylehub.domain.tosspayment.dto;

public class TossPaymentDto {

    // 결제 승인 요청
    public record ConfirmRequest(
            String paymentKey,
            Long integrationPaymentId,
            Long amount,
            String orderNo
    ) {}

    // 결제 취소 요청
    public record CancelRequest(
            String cancelReason
    ) {}

    // 결제 응답 공통
    public record Response(
            String paymentKey,
            Long orderId,
            String status,
            String orderNo
    ) {}

    // 결제 취소 결과 응답
    public record CancelResult(
            String paymentKey,
            String status,
            java.time.LocalDateTime canceledAt,
            String cancelReason
    ) {}
}