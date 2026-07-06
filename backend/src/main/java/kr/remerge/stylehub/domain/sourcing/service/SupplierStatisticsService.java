package kr.remerge.stylehub.domain.sourcing.service;


import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
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
    private final CompanyRepository companyRepository;

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
     * 3. 요청을 올린 바이어 회사 본인은 후보에서 제외 (같은 카테고리를 취급하는 셀러라도 자기 요청에 자기가 배정되면 안 됨)
     * 4. 회사 상태(APPROVED) + 셀러 심사 상태(APPROVED)를 모두 통과한 회사만 후보로 남김
     * 5. 응답률 높은 순으로 정렬
     * 6. 상위 N개 반환 (베테랑/콜드스타트 슬롯이 한쪽에서 부족하면 다른 쪽으로 백필해서 최대한 topN을 채움)
     */
    private static final int TOP_N = 5;
    private static final int COLD_START_THRESHOLD = 5; // 요청 수 이하면 신규로 봄
    private static final int COLD_START_SLOT = 1;      // 신규 공급사 기본 배정 슬롯 수

    @Transactional(readOnly = true)
    public List<Integer> getAutoAssignCandidates(
            String requestType, Integer categoryId, Integer buyerCompanyId, int topN) {
        List<SupplierSourcingType> compatibleTypes = resolveCompatibleTypes(requestType);

        List<SupplierProfile> profiles = profileRepository
                .findAllByAutoAssignEnabledTrueAndSourcingTypeIn(compatibleTypes);

        if (profiles.isEmpty()) {
            log.warn("[AutoAssign] 배정 가능한 공급사 없음 - requestType: {}", requestType);
            return List.of();
        }

        List<Integer> companyIds = profiles.stream()
                .map(SupplierProfile::getCompanyId)
                .filter(id -> !id.equals(buyerCompanyId)) // 요청한 바이어 본인 회사는 후보에서 제외
                .collect(Collectors.toList());

        List<Integer> categoryMatchIds = companyHandledCategoryRepository
                .findCompanyIdsByCategoryId(categoryId);
        companyIds = companyIds.stream()
                .filter(categoryMatchIds::contains)
                .collect(Collectors.toList());

        if (companyIds.isEmpty()) {
            log.warn("[AutoAssign] 카테고리 매칭 공급사 없음 - CategoryId: {}", categoryId);
            return List.of();
        }

        // 회사 상태(APPROVED) + 셀러 심사 상태(APPROVED) 둘 다 통과한 회사만 후보로 남김
        // (정지/삭제/미승인 회사가 auto_assign_enabled=true로 남아있어도 여기서 걸러짐)
        List<Integer> approvedIds = companyRepository.findIdsByIdInAndStatusAndSellerStatus(
                companyIds, CompanyStatus.APPROVED, SellerStatus.APPROVED
        );
        companyIds = companyIds.stream()
                .filter(approvedIds::contains)
                .collect(Collectors.toList());

        if (companyIds.isEmpty()) {
            log.warn("[AutoAssign] 승인 상태(APPROVED) 공급사 없음 - CategoryId: {}", categoryId);
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

        Collections.shuffle(coldStartIds);

        // 1. 베테랑 상위 (topN - coldStartSlot)명 우선 채움
        int veteranSlot = topN - COLD_START_SLOT;
        List<Integer> result = new ArrayList<>(
                veteranIds.stream().limit(veteranSlot).collect(Collectors.toList())
        );

        // 2. 콜드스타트 슬롯 채움 - 베테랑이 부족해서 자리가 남았으면 콜드스타트로 더 채움
        //    (니치 카테고리처럼 베테랑이 적고 신규 공급사가 여러 명인 경우, 슬롯 하나만 쓰고 나머지를 비워두지 않도록)
        int remainingAfterVeteran = topN - result.size();
        result.addAll(coldStartIds.stream().limit(remainingAfterVeteran).collect(Collectors.toList()));

        // 3. 그래도 안 채워졌으면(콜드스타트도 부족) 남은 베테랑으로 마저 채움
        if (result.size() < topN) {
            List<Integer> extraVeterans = veteranIds.stream()
                    .skip(veteranSlot)
                    .filter(id -> !result.contains(id))
                    .limit(topN - result.size())
                    .collect(Collectors.toList());
            result.addAll(extraVeterans);
        }

        long coldStartCount = result.stream().filter(coldStartIds::contains).count();
        log.info("[AutoAssign] 배정 완료 - 총 {}명 (veteran: {}, coldStart: {})",
                result.size(), result.size() - coldStartCount, coldStartCount);

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