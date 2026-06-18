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
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    // 에러 발생 시 처리 (예: 결제 정보 불일치 등)
                    return Mono.error(new RuntimeException("결제 승인 실패: 입력값이 올바르지 않습니다."));
                })
                .bodyToMono(PaymentResult.class)
                .block(); // 비동기 호출 결과를 동기적으로 반환
    }
    public PaymentResult cancel(String paymentKey, PaymentCancelRequest request) {
        return tossWebClient.post()
                .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PaymentResult.class)
                .block();
    }
}
