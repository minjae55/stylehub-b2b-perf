package kr.remerge.stylehub.global.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import kr.remerge.stylehub.global.notification.NotificationMessage;
import kr.remerge.stylehub.global.notification.RedisPublisher;
import kr.remerge.stylehub.global.notification.dto.NotificationPageResult;
import kr.remerge.stylehub.global.notification.entity.Notification;
import kr.remerge.stylehub.global.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String REDIS_CHANNEL = "notification";

    // 알림 저장 + Redis 발행 (SSE로 실시간 전송)
    @Transactional
    public void send(NotificationMessage message) {
        // DB 저장
        Notification notification = Notification.builder()
                .type(message.getType())
                .message(message.getMessage())
                .referenceId(message.getReferenceId())
                .referenceType(message.getReferenceType())
                .targetUserId(message.getTargetUserId())
                .targetCompanyId(message.getTargetCompanyId())
                .targetRole(message.getTargetRole())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        // Redis 발행 → SSE 브로드캐스트
        try {
            String payload = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(REDIS_CHANNEL, payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification message", e);
        }
    }

    // hasNext 판단 위해 size+1개 요청 → 실제 반환은 size개로 자름
    @Transactional(readOnly = true)
    public NotificationPageResult getNotifications(
            Integer userId, Integer companyId, String role,
            Integer cursor, int size
    ) {
        List<Notification> fetched = notificationRepository.findByTargetWithCursor(
                userId, companyId, role, cursor, PageRequest.of(0, size + 1)
        );

        boolean hasNext = fetched.size() > size;
        List<Notification> items = hasNext ? fetched.subList(0, size) : fetched;
        Integer nextCursor = hasNext ? items.get(items.size() - 1).getNotificationId() : null;

        return new NotificationPageResult(items, nextCursor, hasNext);
    }

    // 읽지 않은 알림 수
    @Transactional(readOnly = true)
    public long countUnread(Integer userId, Integer companyId, String role) {
        return notificationRepository.countUnread(userId, companyId, role);
    }

    // 단건 읽음 처리
    @Transactional
    public void markAsRead(Integer notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(Notification::markAsRead);
    }

    // 전체 읽음 처리
    @Transactional
    public void markAllAsRead(Integer userId, Integer companyId, String role) {
        notificationRepository.findByTarget(userId, companyId, role)
                .stream()
                .filter(n -> !n.getIsRead())
                .forEach(Notification::markAsRead);
    }


}