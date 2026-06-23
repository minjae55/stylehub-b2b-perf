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

    public PaymentResult confirm(PaymentConfirmRequest dto) {
        return tossWebClient.post()
                .uri("/v1/payments/confirm")
                .bodyValue(dto)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new RuntimeException("결제 승인 실패(4xx): " + errorBody)))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        Mono.error(new RuntimeException("토스페이먼츠 서버 에러(5xx)가 발생했습니다."))
                )
                .bodyToMono(PaymentResult.class)
                .block();
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
}