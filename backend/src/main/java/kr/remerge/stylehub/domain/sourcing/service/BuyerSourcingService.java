package kr.remerge.stylehub.domain.sourcing.service;

import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuyerSourcingService {

    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final CategoryRepository categoryRepository;

    // TODO: 인증 붙으면 buyerCompanyId를 SecurityContext에서 추출
    private static final Integer DUMMY_BUYER_COMPANY_ID = 3;

    @Transactional(readOnly = true)
    public List<BuyerSourcingResponse> getBuyerRequests(String type) {
        List<SourcingRequest> requests = sourcingRequestRepository
                .findByBuyerCompanyIdAndTypeOrderByCreatedAtDesc(DUMMY_BUYER_COMPANY_ID, type);

        if (requests.isEmpty()) {
            return List.of();
        }

        List<Integer> requestIds = requests.stream()
                .map(SourcingRequest::getSourcingRequestId)
                .toList();

        // 요청별 QUOTED 견적 수 (쿼리 1번)
        Map<Integer, Integer> bidCountMap = sourcingSupplierRepository
                .countByStatusGroupedByRequestId(requestIds, SourcingSupplierStatus.QUOTED)
                .stream()
                .collect(Collectors.toMap(
                        t -> t.get("requestId", Integer.class),
                        t -> t.get("cnt", Long.class).intValue()
                ));

        // subCategoryId로 카테고리명 일괄 조회 (쿼리 1번)
        List<Integer> categoryIds = requests.stream()
                .map(SourcingRequest::getSubCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Integer, String> categoryNameMap = categoryRepository.findAllById(categoryIds)
                .stream()
                .collect(Collectors.toMap(
                        Category::getCategoryId,
                        Category::getCategoryName
                ));

        return requests.stream()
                .map(request -> BuyerSourcingResponse.from(
                        request,
                        bidCountMap.getOrDefault(request.getSourcingRequestId(), 0),
                        request.getSubCategoryId() != null
                                ? categoryNameMap.get(request.getSubCategoryId())
                                : null
                ))
                .toList();
    }

    @Transactional
    public void withdraw(Integer sourcingRequestId) {
        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청 없음: " + sourcingRequestId));

        // PENDING, QUOTED 상태일 때만 취소 가능
        if (request.getStatus() != SourcingStatus.PENDING
                && request.getStatus() != SourcingStatus.QUOTED) {
            throw new IllegalStateException("취소할 수 없는 상태입니다: " + request.getStatus());
        }

        // QUOTED 상태면 배정된 공급사들 중 RECOMMENDED/QUOTED 상태인 것들 DECLINED 처리
        if (request.getStatus() == SourcingStatus.QUOTED) {
            List<SourcingSupplier> suppliers = sourcingSupplierRepository
                    .findAllBySourcingRequest_SourcingRequestId(sourcingRequestId);

            suppliers.stream()
                    .filter(s -> s.getStatus() == SourcingSupplierStatus.RECOMMENDED
                            || s.getStatus() == SourcingSupplierStatus.QUOTED)
                    .forEach(s -> s.decline("바이어 요청 취소"));
        }

        request.withdraw();
    }
}