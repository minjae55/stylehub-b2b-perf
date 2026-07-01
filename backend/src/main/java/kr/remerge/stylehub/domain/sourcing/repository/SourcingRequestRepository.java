package kr.remerge.stylehub.domain.sourcing.repository;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourcingRequestRepository extends JpaRepository<SourcingRequest, Integer> {
    List<SourcingRequest> findByBuyer_UserIdAndTypeOrderByCreatedAtDesc(Integer buyerId, String type);

    // 회사 단위 조회 (대표/직원 구분 없이 같은 회사 buyer면 전체 조회)
    List<SourcingRequest> findByBuyerCompanyIdAndTypeOrderByCreatedAtDesc(Integer buyerCompanyId, String type);
}