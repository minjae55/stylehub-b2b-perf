package kr.remerge.stylehub.domain.adminuser.repository;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminUserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.company WHERE u.status != :status")
    List<User> findAllExceptDeleted(@Param("status") UserStatus status);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.status = :status WHERE u.userId = :userId")
    int updateUserStatus(@Param("userId") Integer userId, @Param("status") UserStatus status);
}