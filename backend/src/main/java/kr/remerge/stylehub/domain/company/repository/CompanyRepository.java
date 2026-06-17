package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
    boolean existsByBusinessNumber(String businessNumber);
}