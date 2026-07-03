package kr.remerge.stylehub.domain.tosspayment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class TossPaymentsClient {
    private final WebClient tossWebClient;

    public PaymentResult confirm(PaymentConfirmRequest request) {

        TossConfirmRequest tossRequest = new TossConfirmRequest(
                request.paymentKey(),
                request.orderId(),
                request.amount()
        );

        return tossWebClient.post()
                .uri("/v1/payments/confirm")
                .bodyValue(tossRequest)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    if (errorBody.contains(
                                            "ALREADY_PROCESSED_PAYMENT"
                                    )) {
                                        return Mono.error(
                                                new AlreadyProcessedPaymentException()
                                        );
                                    }

                                    return Mono.error(
                                            new RuntimeException(
                                                    "결제 승인에 실패했습니다: "
                                                            + errorBody
                                            )
                                    );
                                })
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        Mono.error(new RuntimeException(
                                "토스페이먼츠 서버 오류가 발생했습니다."
                        ))
                )
                .bodyToMono(PaymentResult.class)
                .block();
    }

    private record TossConfirmRequest(
            String paymentKey,
            String orderId,
            Long amount
    ) {
    }

    public PaymentResult cancel(String paymentKey, PaymentCancelRequest request) {
        return tossWebClient.post()
                .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new RuntimeException("결제 취소 실패: " + errorBody)))
                )
                .bodyToMono(PaymentResult.class)
                .block();
    }

    // 커스텀 예외 클래스 하나 추가
    public class AlreadyProcessedPaymentException extends RuntimeException {
        public AlreadyProcessedPaymentException() {
            super("ALREADY_PROCESSED_PAYMENT");
        }
    }
}