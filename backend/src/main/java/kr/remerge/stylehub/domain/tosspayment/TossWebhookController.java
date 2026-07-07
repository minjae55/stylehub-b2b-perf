package kr.remerge.stylehub.domain.tosspayment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/webhook")
@RequiredArgsConstructor
@Slf4j
public class TossWebhookController {

    private final TossWebhookService tossWebhookService;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(@RequestBody TossWebhookPayload payload) {
        log.info("Toss 웹훅 수신: eventType={}, paymentKey={}", payload.eventType(), payload.data().paymentKey());
        tossWebhookService.handle(payload);
        return ResponseEntity.ok().build();
    }
}
