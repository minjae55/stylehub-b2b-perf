package kr.remerge.stylehub.domain.banktransfer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record WaitingDepositResponse(
        Long bankTransferPaymentId,   // 이제 이 값으로 입금확인 요청
        List<Integer> orderIds,
        String depositorName,
        String bankName,
        String accountNumber,
        LocalDateTime depositDeadline,
        BigDecimal orderAmount        // orderIds 전체 합산 금액
) {
}
