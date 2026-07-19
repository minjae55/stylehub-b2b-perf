package kr.remerge.stylehub.domain.quote.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Integer> {

    List<Quote> findBySourcingRequest_SourcingRequestIdAndQuoteIdNot(
            Integer sourcingRequestId, Integer quoteId);

    List<Quote> findByCompany_CompanyIdOrderBySubmittedAtDesc(Integer companyId);

    List<Quote> findBySeller_UserIdOrderBySubmittedAtDesc(Integer userId);

    List<Quote> findByBuyer_UserIdOrderBySubmittedAtDesc(Integer userId);

    Optional<Quote> findByQuoteIdAndBuyer_UserId(Integer quoteId, Integer userId);

    List<Quote> findBySourcingRequest_SourcingRequestId(Integer sourcingRequestSourcingRequestId);

    @Query(value = """
            WITH RECURSIVE quote_chain AS (
            SELECT * FROM quotes WHERE quote_id = :quoteId
            UNION ALL
            SELECT q.* FROM quotes q
            JOIN quote_chain qc ON q.quote_id = qc.parent_quote_id
            )
            SELECT * FROM quote_chain WHERE parent_quote_id IS NULL
            """, nativeQuery = true)
    Optional<Quote> findRootQuote(@Param("quoteId") Integer quoteId);
}
