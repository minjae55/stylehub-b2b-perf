package kr.remerge.stylehub.domain.quote.repository;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface QuoteItemRepository extends JpaRepository<QuoteItem, Integer> {

    List<QuoteItem> findByQuote_QuoteId(Integer quoteId);

    List<QuoteItem> findByQuote_QuoteIdAndIsSampleTrue(Integer quoteId);

    // 여러 견적 ID들을 인자로 받아, 각 견적서별 아이템 수량(quantity)의 합계를 한방에 조회
    @Query("""
            SELECT qi.quote.quoteId AS quoteId, 
                   SUM(COALESCE(qi.quantity, 0)) AS sum 
            FROM QuoteItem qi
            WHERE qi.quote.quoteId IN :quoteIds
            GROUP BY qi.quote.quoteId
            """)
    List<Tuple> sumQuantityGroupedByQuoteId(@Param("quoteIds") Collection<Integer> quoteIds);
}
