package kr.remerge.stylehub.domain.company.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.company.entity.CompanyHandledCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CompanyHandledCategoryRepository extends JpaRepository<CompanyHandledCategory, Integer> {
    // 특정 카테고리를 취급하는 company_id 목록
    @Query("SELECT c.companyId FROM CompanyHandledCategory c WHERE c.categoryId = :categoryId")
    List<Integer> findCompanyIdsByCategoryId(@Param("categoryId") Integer categoryId);
}
