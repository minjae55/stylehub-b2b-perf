package kr.remerge.stylehub.global.notification.repository;

import kr.remerge.stylehub.global.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    @Query("""
            SELECT n FROM Notification n
            WHERE (n.targetUserId = :userId
               OR n.targetCompanyId = :companyId
               OR n.targetRole = :role)
              AND (:cursor IS NULL OR n.notificationId < :cursor)
            ORDER BY n.notificationId DESC
            """)
    List<Notification> findByTargetWithCursor(
            @Param("userId") Integer userId,
            @Param("companyId") Integer companyId,
            @Param("role") String role,
            @Param("cursor") Integer cursor,
            Pageable pageable
    );

    // 기존 findByTarget, countUnread는 그대로 유지 (markAllAsRead 등에서 계속 사용)
    @Query("""
            SELECT n FROM Notification n
            WHERE n.targetUserId = :userId
               OR n.targetCompanyId = :companyId
               OR n.targetRole = :role
            ORDER BY n.createdAt DESC
            """)
    List<Notification> findByTarget(
            @Param("userId") Integer userId,
            @Param("companyId") Integer companyId,
            @Param("role") String role
    );

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE (n.targetUserId = :userId
               OR n.targetCompanyId = :companyId
               OR n.targetRole = :role)
              AND n.isRead = false
            """)
    long countUnread(
            @Param("userId") Integer userId,
            @Param("companyId") Integer companyId,
            @Param("role") String role
    );
}
