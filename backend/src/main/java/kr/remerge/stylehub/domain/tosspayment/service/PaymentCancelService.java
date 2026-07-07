package kr.remerge.stylehub.domain.tosspayment.service;

import kr.remerge.stylehub.domain.tosspayment.dto.TossCancelResponseDto;
import kr.remerge.stylehub.domain.tosspayment.dto.TossPaymentDto;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.tosspayment.exception.PaymentCancelException;
import kr.remerge.stylehub.domain.tosspayment.TossPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentCancelService {

    private final TossPaymentRepository paymentRepository;
    private final RestTemplate restTemplate;

    @Value("${toss.secret-key}")
    private String secretKey;

    @Transactional
    public TossPaymentDto.CancelResult cancelCardPayment(String paymentKey, String cancelReason) {
        TossPayments payment = paymentRepository.findById(paymentKey)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        if (payment.isCanceled()) {
            throw new IllegalStateException("이미 취소된 결제입니다.");
        }
        if (!payment.isDone()) {
            throw new IllegalStateException("완료된 결제만 취소할 수 있습니다.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(secretKey, "");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of("cancelReason", cancelReason);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        String url = "https://api.tosspayments.com/v1/payments/" + payment.getTossPaymentId() + "/cancel";

        try {
            ResponseEntity<TossCancelResponseDto> response =
                    restTemplate.postForEntity(url, request, TossCancelResponseDto.class);

            // 토스가 내려준 status 기준으로 최종 확정 (안전하게 확인)
            TossCancelResponseDto result = response.getBody();
            if (result == null || !"CANCELED".equals(result.status())) {
                throw new PaymentCancelException("토스 응답 상태가 CANCELED가 아닙니다: "
                        + (result != null ? result.status() : "응답 없음"));
            }

            payment.markAsCanceled(cancelReason);

            return new TossPaymentDto.CancelResult(
                    payment.getTossPaymentId(),
                    payment.getStatus(),
                    payment.getCanceledAt(),
                    payment.getCancelReason()
            );

        } catch (HttpClientErrorException e) {
            // 토스 쪽에서 이미 취소된 건 등 에러코드 내려줄 때 (ALREADY_CANCELED_PAYMENT 등)
            log.error("토스 결제 취소 실패: {}", e.getResponseBodyAsString());
            throw new PaymentCancelException("결제 취소 실패: " + e.getResponseBodyAsString());
        }
    }
}