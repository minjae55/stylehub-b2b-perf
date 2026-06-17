package kr.remerge.stylehub.domain.user.repository;

import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferredCategoryRepository extends JpaRepository<UserPreferredCategory, Integer> {
}
