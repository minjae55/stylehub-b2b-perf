package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.company.entity.CompanyBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyBankAccountRepository extends JpaRepository<CompanyBankAccount, Integer> {
}
