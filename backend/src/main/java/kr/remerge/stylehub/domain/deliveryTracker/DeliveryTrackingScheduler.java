package kr.remerge.stylehub.domain.deliveryTracker;

import kr.remerge.stylehub.domain.deliveryTracker.service.DeliveryTrackingStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeliveryTrackingScheduler {

    private final DeliveryTrackingStatusService deliveryTrackingStatusService;

    @Scheduled(cron = "0 */30 * * * *")
    public void syncDeliveryStatus() {
        log.info("[Scheduler] 배송 상태 자동 동기화 시작");
        deliveryTrackingStatusService.syncActiveDeliveries();
        log.info("[Scheduler] 배송 상태 자동 동기화 종료");
    }
}
