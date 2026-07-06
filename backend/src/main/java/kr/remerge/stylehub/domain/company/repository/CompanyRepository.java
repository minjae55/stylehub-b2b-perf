package kr.remerge.stylehub.domain.company.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
    boolean existsByBusinessNumber(String businessNumber);

    Optional<Company> findByBusinessNumber(String s); // 직원 가입용

    // 기본 반품 주소지
    @Query("select c from Company c left join fetch c.defaultReturnAddress where c.companyId = :companyId")
    Optional<Company> findByIdWithReturnAddress(@Param("companyId") Integer companyId);

    // 자동배정 후보 필터링용: 회사 상태 + 셀러 심사 상태가 모두 승인된 회사만
    @Query("select c.companyId from Company c " +
            "where c.companyId in :companyIds " +
            "and c.status = :status " +
            "and c.sellerStatus = :sellerStatus")
    List<Integer> findIdsByIdInAndStatusAndSellerStatus(
            @Param("companyIds") Collection<Integer> companyIds,
            @Param("status") CompanyStatus status,
            @Param("sellerStatus") SellerStatus sellerStatus
    );
}