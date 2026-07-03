package kr.remerge.stylehub.domain.contract.repository;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Integer> {

    boolean existsByQuote_QuoteId(Integer quoteId);

    Optional<Contract> findByQuote_QuoteId(Integer quoteId);

    Optional<Contract> findByContractIdAndQuote_Buyer_UserId(Integer contractId, Integer buyerId);
}
