package kr.remerge.stylehub.domain.dispute.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.dispute.entity.Dispute;
import kr.remerge.stylehub.domain.dispute.enumtype.DisputeStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface DisputeRepository extends JpaRepository<Dispute, Integer> {

    boolean existsByOrder_OrderIdAndStatusIn(Integer orderId, List<DisputeStatus> disputeStatuses);

    List<Dispute> findByBuyer_UserIdOrderByReceivedAtDesc(Integer buyerId);

    List<Dispute> findBySellerCompany_CompanyIdOrderByReceivedAtDesc(Integer companyId);

    @Query("""
            SELECT d FROM Dispute d
            JOIN FETCH d.order o
            LEFT JOIN FETCH d.sellerCompany c
            WHERE d.buyer.userId = :buyerId
              AND d.status IN :statuses
            ORDER BY d.createdAt DESC
            """)
    List<Dispute> findTop5BuyerDisputes(
            @Param("buyerId") Integer buyerId,
            @Param("statuses") Collection<DisputeStatus> statuses,
            Pageable pageable
    );

    // [셀러 6] 클레임 분쟁 내역 조회 (회사 ID 기준)
    @Query("""
            SELECT d FROM Dispute d
            JOIN FETCH d.order o
            WHERE d.sellerCompany.companyId = :sellerCompanyId
              AND d.status IN :statuses
            ORDER BY d.createdAt DESC
            """)
    List<Dispute> findTop5SellerDisputes(
            @Param("sellerCompanyId") Integer sellerCompanyId,
            @Param("statuses") Collection<DisputeStatus> statuses,
            Pageable pageable
    );
}
