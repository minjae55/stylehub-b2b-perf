package kr.remerge.stylehub.global.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RedisPublisher redisPublisher;
    private final ObjectMapper objectMapper;

    public void notify(Long targetUserId, String type, String message, Long requestId) {
        try {
            NotificationMessage msg = new NotificationMessage(targetUserId, type, message, requestId);
            String payload = objectMapper.writeValueAsString(msg);
            redisPublisher.publish(payload);
        } catch (Exception e) {
            log.error("Failed to publish notification", e);
        }
    }

    // 사용 예시용 편의 메서드들
    public void notifyQuoteSubmitted(Long buyerId, Long requestId) {
        notify(buyerId, "QUOTE_SUBMITTED", "새로운 견적이 도착했습니다.", requestId);
    }

    public void notifyQuoteApproved(Long supplierId, Long requestId) {
        notify(supplierId, "QUOTE_APPROVED", "견적이 승인되었습니다.", requestId);
    }

    public void notifyQuoteDeclined(Long supplierId, Long requestId) {
        notify(supplierId, "QUOTE_DECLINED", "견적이 거절되었습니다.", requestId);
    }
    public void notifyNewSourcingRequest(Long adminId, String productName, Long requestId) {
        notify(adminId, "NEW_SOURCING_REQUEST", "새 소싱 요청이 들어왔습니다: " + productName, requestId);
    }
}
