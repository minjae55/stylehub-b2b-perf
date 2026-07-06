package kr.remerge.stylehub.domain.banktransfer.service;

import kr.remerge.stylehub.domain.banktransfer.dto.DepositAccountRequest;
import kr.remerge.stylehub.domain.banktransfer.dto.DepositAccountResponse;
import kr.remerge.stylehub.domain.banktransfer.entity.DepositAccount;
import kr.remerge.stylehub.domain.banktransfer.repository.DepositAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepositAccountService {

    private final DepositAccountRepository depositAccountRepository;

    @Transactional(readOnly = true)
    public List<DepositAccountResponse> getActiveAccounts() {
        return depositAccountRepository.findByActiveTrue().stream()
                .map(DepositAccountResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DepositAccountResponse> getAllAccounts() {
        return depositAccountRepository.findAll().stream()
                .map(DepositAccountResponse::from)
                .toList();
    }

    @Transactional
    public DepositAccountResponse create(DepositAccountRequest request) {
        DepositAccount account = new DepositAccount();
        account.setBankName(request.bankName());
        account.setAccountNumber(request.accountNumber());
        account.setAccountHolder(request.accountHolder());
        account.setActive(true);

        return DepositAccountResponse.from(depositAccountRepository.save(account));
    }

    @Transactional
    public void toggleActive(Long id, boolean active) {
        DepositAccount account = depositAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다."));
        account.setActive(active);
    }
}