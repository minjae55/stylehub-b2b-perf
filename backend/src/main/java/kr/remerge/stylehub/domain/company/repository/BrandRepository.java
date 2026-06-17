package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.company.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand,Integer> {
}
