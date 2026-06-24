package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;

import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SourcingAutoAssignService {

    private final SupplierStatisticsService supplierStatisticsService;
    private final SourcingSupplierRepository sourcingSupplierRepository;

    private static final int TOP_N = 5; // 추천 공급사 최대 수

    /**
     * 소싱요청서 저장 직후 호출
     * 응답률 기반으로 상위 N개 공급사를 SUGGESTED 상태로 자동 배정
     */
    @Transactional
    public void assign(SourcingRequest sourcingRequest) {
        String requestType = sourcingRequest.getType(); // READY or CUSTOM

        Integer subCategoryId = sourcingRequest.getSubCategoryId();
        List<Integer> candidateIds = supplierStatisticsService
                .getAutoAssignCandidates(requestType, subCategoryId, TOP_N);

        if (candidateIds.isEmpty()) {
            log.warn("[AutoAssign] 배정 가능한 공급사 없음 - sourcingRequestId: {}",
                    sourcingRequest.getSourcingRequestId());
            return;
        }

        List<SourcingSupplier> suppliers = candidateIds.stream()
                .map(companyId -> SourcingSupplier.builder()
                        .sourcingRequest(sourcingRequest)
                        .sellerCompanyId(companyId)
                        .build())
                .toList();

        sourcingSupplierRepository.saveAll(suppliers);
        log.info("[AutoAssign] {}개 공급사 자동 배정 완료 - sourcingRequestId: {}",
                suppliers.size(), sourcingRequest.getSourcingRequestId());
    }
}
