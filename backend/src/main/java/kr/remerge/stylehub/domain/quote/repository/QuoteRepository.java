package kr.remerge.stylehub.domain.quote.repository;

import kr.remerge.stylehub.domain.quote.dto.QuoteBuyerListResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Integer> {

    List<Quote> findBySeller_UserIdAndSourcingRequest_SourcingRequestId(
            Integer sellerId, Integer sourcingRequestId);

    List<Quote> findByStatusAndValidUntilBefore(String status, LocalDateTime now);

    List<Quote> findBySourcingRequest_SourcingRequestIdAndQuoteIdNot(
            Integer sourcingRequestId, Integer quoteId);

    List<Quote> findByCompany_CompanyIdOrderBySubmittedAtDesc(Integer companyId);

    List<Quote> findBySeller_UserIdOrderBySubmittedAtDesc(Integer userId);

    List<Quote> findByBuyer_UserIdOrderBySubmittedAtDesc(Integer userId);

    Optional<Quote> findByQuoteIdAndBuyer_UserId(Integer quoteId, Integer userId);
}
