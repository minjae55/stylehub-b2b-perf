package kr.remerge.stylehub.domain.sourcing.service;


import kr.remerge.stylehub.domain.sourcing.entity.SupplierProfile;
import kr.remerge.stylehub.domain.sourcing.entity.SupplierStatistics;
import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import kr.remerge.stylehub.domain.sourcing.repository.SupplierProfileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SupplierStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierStatisticsService {

    private final SupplierProfileRepository profileRepository;
    private final SupplierStatisticsRepository statisticsRepository;

    /**
     * 배치 스케줄러에서 호출
     * companyId별 요청/응답 수를 받아서 response_rate 재계산
     * key: companyId, value: [totalRequests, totalResponses]
     */
    @Transactional
    public void recalculateAll(Map<Integer, int[]> countMap) {
        List<SupplierStatistics> statsList = statisticsRepository.findAllById(countMap.keySet());

        for (SupplierStatistics stats : statsList) {
            int[] counts = countMap.get(stats.getCompanyId());
            if (counts != null) {
                stats.recalculate(counts[0], counts[1]);
            }
        }

        statisticsRepository.saveAll(statsList);
        log.info("[SupplierStatistics] {}개 공급사 통계 재계산 완료", statsList.size());
    }

    /**
     * 자동 배정 알고리즘
     * 1. auto_assign_enabled = true 인 공급사 조회
     * 2. 요청 타입(READY/CUSTOM)과 호환되는 공급사 필터
     * 3. 응답률 높은 순으로 정렬
     * 4. 상위 N개 반환
     */
    @Transactional(readOnly = true)
    public List<Integer> getAutoAssignCandidates(String requestType, int topN) {
        // 요청 타입에 맞는 sourcing_type 목록 (BOTH 항상 포함)
        List<SupplierSourcingType> compatibleTypes = resolveCompatibleTypes(requestType);

        // 자동 배정 활성화 + 타입 호환 공급사
        List<SupplierProfile> profiles = profileRepository
                .findAllByAutoAssignEnabledTrueAndSourcingTypeIn(compatibleTypes);

        if (profiles.isEmpty()) {
            log.warn("[AutoAssign] 배정 가능한 공급사 없음 - requestType: {}", requestType);
            return List.of();
        }

        List<Integer> companyIds = profiles.stream()
                .map(SupplierProfile::getCompanyId)
                .collect(Collectors.toList());

        // 응답률 높은 순 정렬 후 topN 추출
        return statisticsRepository
                .findAllByCompanyIdInOrderByResponseRateDesc(companyIds)
                .stream()
                .map(SupplierStatistics::getCompanyId)
                .limit(topN)
                .collect(Collectors.toList());
    }

    private List<SupplierSourcingType> resolveCompatibleTypes(String requestType) {
        return switch (requestType) {
            case "READY"  -> List.of(SupplierSourcingType.READY,  SupplierSourcingType.BOTH);
            case "CUSTOM" -> List.of(SupplierSourcingType.CUSTOM, SupplierSourcingType.BOTH);
            default -> {
                log.warn("[AutoAssign] 알 수 없는 requestType: {}", requestType);
                yield List.of();
            }
        };
    }
}
