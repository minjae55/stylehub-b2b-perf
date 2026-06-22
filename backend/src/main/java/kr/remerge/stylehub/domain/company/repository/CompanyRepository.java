package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
    boolean existsByBusinessNumber(String businessNumber);

    Optional<Company> findByBusinessNumber(String s); // 직원 가입용
}