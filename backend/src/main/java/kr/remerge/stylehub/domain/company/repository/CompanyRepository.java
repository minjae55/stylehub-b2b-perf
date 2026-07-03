package kr.remerge.stylehub.domain.company.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
    boolean existsByBusinessNumber(String businessNumber);

    Optional<Company> findByBusinessNumber(String s); // 직원 가입용

    // 기본 반품 주소지
    @Query("select c from Company c left join fetch c.defaultReturnAddress where c.companyId = :companyId")
    Optional<Company> findByIdWithReturnAddress(@Param("companyId") Integer companyId);
}