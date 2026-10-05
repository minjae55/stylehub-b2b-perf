package kr.remerge.stylehub.domain.negotiation.repository;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NegotiationRepository extends JpaRepository<Negotiation, Integer> {

    @Query(value = """
            (SELECT * FROM negotiations WHERE buyer_id = :userId ORDER BY updated_at DESC
            LIMIT :fetchLimit)
            UNION
            (SELECT * FROM negotiations WHERE seller_id = :userId ORDER BY updated_at DESC
            LIMIT :fetchLimit)
            ORDER BY updated_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Negotiation> findByBuyerOrSellerPaged(
            @Param("userId") Integer userId,
            @Param("fetchLimit") int fetchLimit,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyerIdOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId
    );

    Optional<Negotiation>
    findFirstByContract_ContractIdAndBuyerIdOrderByOpenedAtDesc(
            Integer contractId,
            Integer buyerId
    );

    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyerIdAndSellerIdAndNegotiationTypeOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId,
            Integer sellerId,
            String negotiationType
    );

    @Query("""
            SELECT n FROM Negotiation n
            LEFT JOIN FETCH n.quote q
            JOIN User b ON b.userId = n.buyerId
            WHERE b.company.companyId = :buyerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
            ORDER BY n.updatedAt DESC
            """)
    List<Negotiation> findTop5BuyerNegotiations(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(n) FROM Negotiation n
            JOIN User b ON b.userId = n.buyerId
            WHERE b.company.companyId = :buyerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR b.userId = :userId)
            """)
    long countAllBuyerNegotiations(
            @Param("buyerCompanyId") Integer buyerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("userId") Integer userId,
            @Param("role") String role
    );

    @Query("""
            SELECT n FROM Negotiation n
            LEFT JOIN FETCH n.quote q
            JOIN User s ON s.userId = n.sellerId
            WHERE s.company.companyId = :sellerCompanyId
              AND n.status IN :statuses
              AND (:role = 'PRESIDENT' OR s.userId = :sellerUserId)
            ORDER BY n.updatedAt DESC
            """)
    List<Negotiation> findTop5SellerNegotiations(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("statuses") Collection<String> statuses,
            @Param("sellerUserId") Integer sellerUserId,
            @Param("role") String role,
            Pageable pageable
    );
}
