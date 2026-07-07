package kr.remerge.stylehub.domain.banktransfer.service;

import kr.remerge.stylehub.domain.banktransfer.entity.BankTransferPayment;
import kr.remerge.stylehub.domain.banktransfer.repository.BankTransferPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BankTransferCancelService {

    private final BankTransferPaymentRepository bankTransferPaymentRepository;

    @Transactional
    public void cancelBankTransfer(Long bankTransferPaymentId, String cancelReason) {
        BankTransferPayment payment = bankTransferPaymentRepository.findById(bankTransferPaymentId)
                .orElseThrow(() -> new IllegalArgumentException("무통장입금 정보를 찾을 수 없습니다."));

        if (payment.isCanceled()) {
            throw new IllegalStateException("이미 취소된 건입니다.");
        }

        // setter 대신 엔티티에 캡슐화된 메서드 사용 (confirm()과 동일한 패턴)
        payment.markAsCanceled(cancelReason);
    }
}