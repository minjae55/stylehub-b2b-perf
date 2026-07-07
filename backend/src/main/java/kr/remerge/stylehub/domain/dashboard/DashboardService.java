package kr.remerge.stylehub.domain.dashboard;

import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.dashboard.dto.buyer.*;
import kr.remerge.stylehub.domain.dashboard.dto.seller.*;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    // ── 1번 방식으로 각 도메인의 기존 Repository 주입 ──
    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingRequestItemRepository sourcingRequestItemRepository;
    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final CategoryRepository categoryRepository;

    // =================================================================
    // ── BUYER DASHBOARD SERVICES (바이어 7개 비즈니스 로직) ──
    // =================================================================

    /**
     * [바이어 1] 소싱 요청 목록 조회
     */
    public List<BuyerSourcingDashboardResponse> getBuyerSourcingDashboardList(Integer buyerCompanyId, String statusStr) {
        List<SourcingStatus> statuses = parseSourcingStatuses(statusStr);

        List<SourcingRequest> requests = sourcingRequestRepository
                .findByBuyerCompanyIdAndTypeAndStatusInOrderByCreatedAtDesc(
                        buyerCompanyId, "SOURCING", statuses
                );

        if (requests.isEmpty()) return Collections.emptyList();

        List<Integer> requestIds = requests.stream()
                .map(SourcingRequest::getSourcingRequestId)
                .collect(Collectors.toList());

        // 카테고리 맵 조립
        Set<Integer> categoryIds = requests.stream()
                .map(SourcingRequest::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, String> categoryMap = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(Category::getCategoryId, Category::getCategoryName));
        }

        // 견적 제출 수 맵 조립 (Group By 튜닝)
        List<Tuple> bidCountsTuple = sourcingSupplierRepository
                .countByStatusGroupedByRequestId(requestIds, SourcingSupplierStatus.QUOTED);

        Map<Integer, Integer> bidCountMap = bidCountsTuple.stream().collect(Collectors.toMap(
                t -> t.get("requestId", Integer.class),
                t -> {
                    Long cnt = t.get("cnt", Long.class);
                    return cnt != null ? cnt.intValue() : 0;
                },
                (oldVal, newVal) -> newVal
        ));

        // 최종 DTO 매핑
        Map<Integer, String> finalCategoryMap = categoryMap;
        return requests.stream().map(req -> {
            List<SourcingRequestItem> items = sourcingRequestItemRepository
                    .findBySourcingRequest_SourcingRequestId(req.getSourcingRequestId());

            int totalQty = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();

            Integer bidCount = bidCountMap.getOrDefault(req.getSourcingRequestId(), 0);
            String categoryName = finalCategoryMap.getOrDefault(req.getCategoryId(), "미지정");

            return BuyerSourcingDashboardResponse.of(req, categoryName, totalQty, bidCount);
        }).collect(Collectors.toList());
    }

    /**
     * [바이어 2] 받은 견적 내역 조회
     */
    public List<BuyerQuoteDashboardResponse> getBuyerReceivedQuotes(Integer buyerCompanyId, String statusStr) {
        List<SourcingStatus> activeStatuses = List.of(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);
        List<SourcingRequest> myRequests = sourcingRequestRepository
                .findByBuyerCompanyIdAndTypeAndStatusInOrderByCreatedAtDesc(buyerCompanyId, "SOURCING", activeStatuses);

        if (myRequests.isEmpty()) return Collections.emptyList();

        List<Integer> requestIds = myRequests.stream()
                .map(SourcingRequest::getSourcingRequestId)
                .collect(Collectors.toList());

        List<SourcingSupplier> activeSuppliers = new ArrayList<>();
        for (Integer reqId : requestIds) {
            activeSuppliers.addAll(sourcingSupplierRepository.findAllBySourcingRequest_SourcingRequestId(reqId));
        }

        return activeSuppliers.stream()
                .filter(ss -> ss.getQuote() != null)
                .map(ss -> {
                    SourcingRequest sr = ss.getSourcingRequest();
                    Quote quote = ss.getQuote();

                    List<SourcingRequestItem> items = sourcingRequestItemRepository
                            .findBySourcingRequest_SourcingRequestId(sr.getSourcingRequestId());
                    int totalQty = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();

                    String sellerCompanyName = "공급사 " + ss.getSellerCompanyId();

                    // 💡 Quote 엔티티 내부 필드가 아직 미확정 상태이므로 컴파일 에러를 막기 위한 가바인딩 조치
                    return BuyerQuoteDashboardResponse.of(
                            quote.getQuoteId(),
                            "Q-" + quote.getQuoteId(),
                            sr.getProductName(),
                            sellerCompanyName,
                            totalQty,
                            sr.getUnitPrice() != null ? sr.getUnitPrice() : 0L,   // SourcingRequest의 단가 등으로 대체 방어
                            sr.getTotalBudget() != null ? sr.getTotalBudget() : 0L, // SourcingRequest의 예산 등으로 대체 방어
                            "SUBMITTED",
                            sr.getExpiryDate() != null ? sr.getExpiryDate().atStartOfDay() : LocalDateTime.now()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * [바이어 3] 협의 진행중 내역 조회
     */
    public List<BuyerNegotiationDashboardResponse> getBuyerNegotiations(Integer buyerId, String statusStr) {
        // TODO: 실제 대화/협의 테이블 조회 로직 연동 예정
        return List.of(
                new BuyerNegotiationDashboardResponse(1, "샘플 가디건", "A 공급사", 100, "단가 협의의 건", "OPEN", "최종 단가 확인 부탁드립니다.", LocalDateTime.now(), true)
        );
    }

    /**
     * [바이어 4 & 5] 결제 대기 및 배송 중 주문 목록 조회
     */
    public List<BuyerOrderDashboardResponse> getBuyerOrders(Integer buyerId, String statusStr) {
        // TODO: 주문(Order) 도메인 테이블 연동 예정
        return List.of(
                new BuyerOrderDashboardResponse(1, "ORD-001", "샘플 가디건", "A 공급사", 100, 1500000L, statusStr, LocalDateTime.now(), false, "CJ대한통운", "123456789")
        );
    }

    /**
     * [바이어 6] 이의제기 진행 내역 조회
     */
    public List<BuyerDisputeDashboardResponse> getBuyerActiveDisputes(Integer buyerId, String statusStr) {
        // TODO: 클레임/분쟁(Dispute) 도메인 연동 예정
        return List.of(
                new BuyerDisputeDashboardResponse(1, "샘플 가디건", "A 공급사", "오염 발생의 건", "DEFECT", "제품 하단에 이염이 심합니다.", "UNDER_REVIEW", LocalDateTime.now())
        );
    }

    /**
     * [바이어 7] 자동확정 임박 건 조회
     */
    public List<UrgentReceiptDashboardResponse> getBuyerUrgentReceipts(Integer buyerId) {
        // TODO: 배송 완료 후 5일 이상 지난 배송 데이터 필터링 연동 예정
        return List.of(
                new UrgentReceiptDashboardResponse(1, "ORD-001", "샘플 가디건", "A 공급사", 100, 6)
        );
    }


    // =================================================================
    // ── SELLER DASHBOARD SERVICES (셀러 7개 비즈니스 로직) ──
    // =================================================================

    /**
     * [셀러 1] 신규 소싱 요청 피드 조회
     */
    public List<SellerSourcingFeedResponse> getSellerSourcingFeedList(Integer sellerCompanyId, String statusStr) {
        // 💡 [교정] ASSIGNED 대신 실제 존재하는 RECOMMENDED 상태 사용
        List<SourcingSupplier> suppliers = sourcingSupplierRepository.findSellerRequests(
                sellerCompanyId,
                SourcingSupplierStatus.RECOMMENDED,
                "SOURCING"
        );

        if (suppliers.isEmpty()) return Collections.emptyList();

        List<SourcingRequest> requests = suppliers.stream()
                .map(SourcingSupplier::getSourcingRequest)
                .collect(Collectors.toList());

        Set<Integer> categoryIds = requests.stream()
                .map(SourcingRequest::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, String> categoryMap = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(Category::getCategoryId, Category::getCategoryName));
        }

        Map<Integer, String> finalCategoryMap = categoryMap;
        return requests.stream().map(req -> {
            List<SourcingRequestItem> items = sourcingRequestItemRepository
                    .findBySourcingRequest_SourcingRequestId(req.getSourcingRequestId());

            int totalQty = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();

            // 💡 [교정] 무리한 객체 그래프 탐색 대신 엔티티 내의 buyerCompanyId를 직접 활용하여 에러 제거
            String buyerCompanyName = "바이어 회사 " + req.getBuyerCompanyId();
            String categoryName = finalCategoryMap.getOrDefault(req.getCategoryId(), "미지정");

            return SellerSourcingFeedResponse.of(req, buyerCompanyName, categoryName, totalQty);
        }).collect(Collectors.toList());
    }

    /**
     * [셀러 2] 작성 중이거나 마감 임박인 견적서 조회
     */
    public List<QuoteDraftDashboardResponse> getSellerQuoteDrafts(Integer sellerCompanyId, String statusStr) {
        // 💡 [교정] ASSIGNED 대신 실제 존재하는 RECOMMENDED 상태 사용
        List<SourcingSupplier> sellerAllocations = sourcingSupplierRepository.findSellerRequests(
                sellerCompanyId,
                SourcingSupplierStatus.RECOMMENDED,
                "SOURCING"
        );

        return sellerAllocations.stream()
                .map(ss -> {
                    SourcingRequest sr = ss.getSourcingRequest();

                    List<SourcingRequestItem> items = sourcingRequestItemRepository
                            .findBySourcingRequest_SourcingRequestId(sr.getSourcingRequestId());
                    int totalQty = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();

                    String buyerName = "바이어 회사 " + sr.getBuyerCompanyId();

                    Long totalAmount = sr.getTotalBudget();
                    Integer quoteId = ss.getSourcingSupplierSId(); // 💡 [교정] 실제 Id 필드명 매핑 완료

                    return QuoteDraftDashboardResponse.of(
                            quoteId,
                            sr.getProductName(),
                            buyerName,
                            totalQty,
                            totalAmount != null ? totalAmount : 0L,
                            sr.getExpiryDate()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * [셀러 3] 대화 및 협의 목록 조회
     */
    public List<SellerNegotiationDashboardResponse> getSellerNegotiations(Integer sellerCompanyId, String statusStr) {
        // TODO: 셀러 기준 협의 목록 연동 예정
        return List.of(
                new SellerNegotiationDashboardResponse(1, "납기일 조율", "트렌치 코트", "B 바이어", 200, "네 확인했습니다.", LocalDateTime.now(), false)
        );
    }

    /**
     * [셀러 4 & 5] 출고 대기 및 배송 흐름/확정 대기 목록 조회
     */
    public List<SellerShipmentDashboardResponse> getSellerOrders(Integer sellerCompanyId, String statusStr) {
        // TODO: 셀러의 주문 배송 현황 연동 예정 (PREPARING vs SHIPPED,DELIVERED 분기)
        return List.of(
                SellerShipmentDashboardResponse.of(1, "ORD-002", "트렌치 코트", "B 바이어", 200, 4000000L, LocalDateTime.now(), LocalDate.now().plusDays(2))
        );
    }

    /**
     * [셀러 6] 구매자가 제기한 클레임 분쟁 건 조회
     */
    public List<SellerDisputeDashboardResponse> getSellerActiveDisputes(Integer sellerCompanyId, String statusStr) {
        // TODO: 셀러가 받은 분쟁 내역 연동 예정
        return List.of(
                new SellerDisputeDashboardResponse(1, "원단 불량 이의제기", "트렌치 코트", "B 바이어", "재봉선이 안 맞습니다.", LocalDateTime.now(), "RECEIVED")
        );
    }

    /**
     * [셀러 7] 정산 예정 내역 조회
     */
    public List<SellerSettlementDashboardResponse> getSellerPendingSettlements(Integer sellerCompanyId, String statusStr) {
        // TODO: 정산(Settlement) 도메인 테이블 연동 예정
        return List.of(
                new SellerSettlementDashboardResponse(1, "ORD-002", "트렌치 코트", "B 바이어", 200, 4000000L, 120000L, 3880000L, LocalDateTime.now())
        );
    }


    // ── 상태값 파싱 헬퍼 메서드 ──
    private List<SourcingStatus> parseSourcingStatuses(String statusStr) {
        if (!StringUtils.hasText(statusStr)) {
            return Arrays.asList(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);
        }
        return Arrays.stream(statusStr.split(","))
                .map(String::trim)
                .map(SourcingStatus::valueOf)
                .collect(Collectors.toList());
    }
}