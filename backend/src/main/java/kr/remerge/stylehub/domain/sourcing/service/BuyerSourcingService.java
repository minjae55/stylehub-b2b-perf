// BuyerSourcingService.java
package kr.remerge.stylehub.domain.sourcing.service;

import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingBoardResponse;
import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingCountResponse;
import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
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
    private final QuoteRepository quoteRepository;

    // 진행중 그룹: 아직 채택 전 단계
    private static final List<SourcingStatus> ACTIVE_STATUSES =
            List.of(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);

    // 종료 그룹: 반려/취소/기한만료 — 더 이상 견적을 받지 않는 상태
    private static final List<SourcingStatus> CLOSED_STATUSES =
            List.of(SourcingStatus.CANCELLED, SourcingStatus.WITHDRAWN, SourcingStatus.EXPIRED);

    @Transactional(readOnly = true)
    public BuyerSourcingBoardResponse getBuyerSourcingBoard(Integer buyerCompanyId, String type, String statusGroup) {

        // 타입 기준 전체를 한 번만 조회 → 카운트와 필터링 모두 여기서 재사용 (쿼리 중복 방지)
        List<SourcingRequest> allRequests = sourcingRequestRepository
                .findByBuyerCompanyIdAndTypeOrderByCreatedAtDesc(buyerCompanyId, type);

        BuyerSourcingCountResponse counts = buildCounts(allRequests);

        List<SourcingRequest> filtered = filterByStatusGroup(allRequests, statusGroup);

        if (filtered.isEmpty()) {
            return new BuyerSourcingBoardResponse(List.of(), counts);
        }

        List<Integer> requestIds = filtered.stream()
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

        // CategoryId로 카테고리명 일괄 조회 (쿼리 1번)
        List<Integer> categoryIds = filtered.stream()
                .map(SourcingRequest::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Integer, String> categoryNameMap = categoryRepository.findAllById(categoryIds)
                .stream()
                .collect(Collectors.toMap(
                        Category::getCategoryId,
                        Category::getCategoryName
                ));

        List<BuyerSourcingResponse> requests = filtered.stream()
                .map(request -> BuyerSourcingResponse.from(
                        request,
                        bidCountMap.getOrDefault(request.getSourcingRequestId(), 0),
                        request.getCategoryId() != null
                                ? categoryNameMap.get(request.getCategoryId())
                                : null
                ))
                .toList();

        return new BuyerSourcingBoardResponse(requests, counts);
    }

    private List<SourcingRequest> filterByStatusGroup(List<SourcingRequest> requests, String statusGroup) {
        if (statusGroup == null || "ALL".equalsIgnoreCase(statusGroup)) {
            return requests;
        }
        List<SourcingStatus> targetStatuses = switch (statusGroup.toUpperCase()) {
            case "ACTIVE" -> ACTIVE_STATUSES;
            case "TRADING" -> List.of(SourcingStatus.TRADING);
            case "COMPLETED" -> List.of(SourcingStatus.COMPLETED);
            case "CLOSED" -> CLOSED_STATUSES;
            default -> throw new IllegalArgumentException("알 수 없는 상태 필터: " + statusGroup);
        };
        return requests.stream()
                .filter(r -> targetStatuses.contains(r.getStatus()))
                .toList();
    }

    private BuyerSourcingCountResponse buildCounts(List<SourcingRequest> requests) {
        int active = 0, trading = 0, completed = 0, closed = 0;
        for (SourcingRequest r : requests) {
            if (ACTIVE_STATUSES.contains(r.getStatus())) active++;
            else if (r.getStatus() == SourcingStatus.TRADING) trading++;
            else if (r.getStatus() == SourcingStatus.COMPLETED) completed++;
            else if (CLOSED_STATUSES.contains(r.getStatus())) closed++;
        }
        return new BuyerSourcingCountResponse(requests.size(), active, trading, completed, closed);
    }

    @Transactional
    public void withdraw(Integer sourcingRequestId, Integer userId, Integer buyerCompanyId, String role) {
        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청 없음: " + sourcingRequestId));

        // 회사 자체가 다르면 애초에 대상이 아님
        if (!request.getBuyerCompanyId().equals(buyerCompanyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 액션(취소)이므로 작성자 본인 또는 회사 대표만 허용
        boolean isWriter = Objects.equals(request.getBuyer().getUserId(), userId);
        boolean isCompanyPresident = "PRESIDENT".equals(role);

        if (!isWriter && !isCompanyPresident) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request.getStatus() != SourcingStatus.PENDING
                && request.getStatus() != SourcingStatus.QUOTED) {
            throw new IllegalStateException("취소할 수 없는 상태입니다: " + request.getStatus());
        }

        if (request.getStatus() == SourcingStatus.QUOTED) {
            List<SourcingSupplier> suppliers = sourcingSupplierRepository
                    .findAllBySourcingRequest_SourcingRequestId(sourcingRequestId);

            suppliers.stream()
                    .filter(s -> s.getStatus() == SourcingSupplierStatus.RECOMMENDED
                            || s.getStatus() == SourcingSupplierStatus.QUOTED)
                    .forEach(SourcingSupplier::cancelByBuyerWithdrawal);

            List<Quote> quotes = quoteRepository
                    .findBySourcingRequest_SourcingRequestId(sourcingRequestId);

            quotes.stream()
                    .filter(q -> QuoteStatusCode.SUBMITTED.equals(q.getStatus())
                            || QuoteStatusCode.NEGOTIATING.equals(q.getStatus())
                            || QuoteStatusCode.SAMPLE_REQUESTED.equals(q.getStatus()))
                    .forEach(q -> q.changeStatus(QuoteStatusCode.NOT_SELECTED));
        }

        request.withdraw();
    }
}