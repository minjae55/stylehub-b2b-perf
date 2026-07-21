package kr.remerge.stylehub.domain.tosspayment;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
@Primary
@Profile("loadtest")
public class StubTossPaymentsClient extends TossPaymentsClient{

    public StubTossPaymentsClient() {
        super(null);
    }

    @Override
    public PaymentResult confirm(PaymentConfirmRequest request) {

        return new PaymentResult(
                "test_mid",
                "1_0",
                request.paymentKey(),
                request.orderId(),
                "카드",
                request.amount(),
                OffsetDateTime.now().toString(),
                "DONE",
                null
        );

    }

}
