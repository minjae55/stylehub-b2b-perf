package kr.remerge.stylehub.domain.contract.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import org.apache.logging.log4j.simple.internal.SimpleProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Integer> {

    boolean existsByQuote_QuoteId(Integer quoteId);

    Optional<Contract> findFirstByQuote_QuoteIdOrderByVersionDesc(Integer quoteId);

    Optional<Contract> findByContractIdAndQuote_Buyer_UserId(Integer contractId, Integer buyerId);

    List<Contract> findByQuote_QuoteIdIn(List<Integer> quoteIds);

    List<Contract> findByQuote_Buyer_UserIdOrderByCreatedAtDesc(
            Integer buyerId
    );

    @Query(value = """
            WITH RECURSIVE contract_chain AS (
                SELECT * FROM contracts WHERE contract_id = :contractId
                UNION ALL
                SELECT c.* FROM contracts c
                JOIN contract_chain cc ON c.contract_id = cc.parent_contract_id
            )
            SELECT * FROM contract_chain WHERE parent_contract_id IS NULL
            """, nativeQuery = true)
    Optional<Contract> findRootContract(@Param("contractId") Integer contractId);
}
