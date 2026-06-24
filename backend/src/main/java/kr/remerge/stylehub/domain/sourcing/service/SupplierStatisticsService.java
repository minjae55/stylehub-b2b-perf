package kr.remerge.stylehub.domain.sourcing.service;


import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SupplierProfile;
import kr.remerge.stylehub.domain.sourcing.entity.SupplierStatistics;
import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import kr.remerge.stylehub.domain.sourcing.repository.SupplierProfileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SupplierStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierStatisticsService {

    private final SupplierProfileRepository profileRepository;
    private final SupplierStatisticsRepository statisticsRepository;
    private final CompanyHandledCategoryRepository companyHandledCategoryRepository;

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
    private static final int TOP_N = 5;
    private static final int COLD_START_THRESHOLD = 5; // 요청 수 이하면 신규로 봄
    private static final int COLD_START_SLOT = 1;      // 신규 공급사 배정 슬롯 수

    @Transactional(readOnly = true)
    public List<Integer> getAutoAssignCandidates(String requestType, Integer subCategoryId, int topN) {
        List<SupplierSourcingType> compatibleTypes = resolveCompatibleTypes(requestType);

        List<SupplierProfile> profiles = profileRepository
                .findAllByAutoAssignEnabledTrueAndSourcingTypeIn(compatibleTypes);

        if (profiles.isEmpty()) {
            log.warn("[AutoAssign] 배정 가능한 공급사 없음 - requestType: {}", requestType);
            return List.of();
        }

        List<Integer> companyIds = profiles.stream()
                .map(SupplierProfile::getCompanyId)
                .collect(Collectors.toList());

        List<Integer> categoryMatchIds = companyHandledCategoryRepository
                .findCompanyIdsByCategoryId(subCategoryId);
        companyIds = companyIds.stream()
                .filter(categoryMatchIds::contains)
                .collect(Collectors.toList());

        if (companyIds.isEmpty()) {
            log.warn("[AutoAssign] 카테고리 매칭 공급사 없음 - subCategoryId: {}", subCategoryId);
            return List.of();
        }

        // statistics 조회
        List<SupplierStatistics> statsList = statisticsRepository
                .findAllByCompanyIdInOrderByResponseRateDesc(companyIds);

// statistics에 있는 company_id 목록
        List<Integer> statsCompanyIds = statsList.stream()
                .map(SupplierStatistics::getCompanyId)
                .collect(Collectors.toList());

// statistics 없는 company_id → 자동으로 cold start 취급
        List<Integer> noStatsIds = companyIds.stream()
                .filter(id -> !statsCompanyIds.contains(id))
                .collect(Collectors.toList());

// cold start / 기존 분리
        List<Integer> coldStartIds = new ArrayList<>(noStatsIds); // statistics 없는 것 먼저
        statsList.stream()
                .filter(s -> s.getTotalRequests() < COLD_START_THRESHOLD)
                .map(SupplierStatistics::getCompanyId)
                .forEach(coldStartIds::add);

        List<Integer> veteranIds = statsList.stream()
                .filter(s -> s.getTotalRequests() >= COLD_START_THRESHOLD)
                .map(SupplierStatistics::getCompanyId)
                .collect(Collectors.toList());

        // 기존 공급사 상위 (topN - 1)개
        List<Integer> result = new ArrayList<>(
                veteranIds.stream().limit(topN - COLD_START_SLOT).collect(Collectors.toList())
        );

        // cold start 랜덤 1개 추가
        if (!coldStartIds.isEmpty()) {
            Collections.shuffle(coldStartIds);
            result.add(coldStartIds.get(0));
        } else {
            // cold start 없으면 기존 공급사로 채움
            veteranIds.stream().skip(topN - COLD_START_SLOT).limit(COLD_START_SLOT)
                    .forEach(result::add);
        }

        log.info("[AutoAssign] 배정 완료 - veteran: {}, coldStart: {}",
                result.size() - (coldStartIds.isEmpty() ? 0 : 1),
                coldStartIds.isEmpty() ? 0 : 1);

        return result;
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
