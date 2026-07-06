package kr.remerge.stylehub.domain.banktransfer.repository;

import kr.remerge.stylehub.domain.banktransfer.entity.DepositAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepositAccountRepository extends JpaRepository<DepositAccount, Long> {
    List<DepositAccount> findByActiveTrue();
}
