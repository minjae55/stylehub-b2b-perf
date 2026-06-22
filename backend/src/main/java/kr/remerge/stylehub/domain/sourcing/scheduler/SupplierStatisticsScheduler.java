package kr.remerge.stylehub.domain.sourcing.scheduler;

import kr.remerge.stylehub.domain.sourcing.service.SupplierStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SupplierStatisticsScheduler {

    private final SupplierStatisticsService statisticsService;

    /**
     * 매일 새벽 3시에 응답률 재계산
     * 추후 sourcing_suppliers 테이블에서 실제 집계 쿼리로 교체 예정
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void recalculateStatistics() {
        log.info("[Scheduler] 공급사 통계 재계산 시작");

        // TODO: sourcing_suppliers 테이블에서 실제 집계로 교체
        // 지금은 더미 데이터로 동작 확인용
        Map<Integer, int[]> countMap = Map.of(
                1, new int[]{100, 95},
                2, new int[]{50, 40},
                3, new int[]{30, 18},
                4, new int[]{20, 8},
                5, new int[]{0, 0}
        );

        statisticsService.recalculateAll(countMap);
        log.info("[Scheduler] 공급사 통계 재계산 완료");
    }
}
