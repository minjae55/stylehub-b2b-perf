package kr.remerge.stylehub.domain.quote.repository;

import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteItemRepository extends JpaRepository<QuoteItem, Integer> {

    List<QuoteItem> findByQuote_QuoteId(Integer quoteId);

    List<QuoteItem> findByQuote_QuoteIdAndIsSampleTrue(Integer quoteId);
}
