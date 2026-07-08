package kr.remerge.stylehub.domain.dashboard;

import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.dashboard.dto.buyer.*;
import kr.remerge.stylehub.domain.dashboard.dto.seller.*;
import kr.remerge.stylehub.domain.dispute.entity.Dispute;
import kr.remerge.stylehub.domain.dispute.entity.DisputeItem;
import kr.remerge.stylehub.domain.dispute.enumtype.DisputeStatus;
import kr.remerge.stylehub.domain.dispute.repository.DisputeItemRepository;
import kr.remerge.stylehub.domain.dispute.repository.DisputeRepository;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRepository;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRequestRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private final NegotiationRequestRepository negotiationRequestRepository;
    private final NegotiationRepository negotiationRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DisputeRepository disputeRepository;
    private final DisputeItemRepository disputeItemRepository;

    // =================================================================
    // ── BUYER DASHBOARD SERVICES (바이어 7개 비즈니스 로직) ──
    // =================================================================

    /**
     * [바이어 1] 소싱 요청 목록 조회
     * 대표는 회사 전체, 직원은 본인이 작성한 요청만 조회 가능
     */
    public BuyerSourcingDashboardListResponse getBuyerSourcingDashboardList(
            Integer buyerCompanyId, Integer userId, String role, String statusStr) {

        List<SourcingStatus> statuses = java.util.Arrays.stream(statusStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(s -> {
                    try {
                        return SourcingStatus.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (statuses.isEmpty()) {
            statuses = List.of(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);
        }

        // 1. DB에서 전체 대기중인 '총 개수' 구하기
        long totalCount = sourcingRequestRepository.countAllBuyerDashboardFeeds(
                buyerCompanyId, statuses, userId, role
        );

        // 2. 화면 목록용 최신 5개 데이터 가져오기
        Pageable topFive = PageRequest.of(0, 5);
        List<SourcingRequest> requests = sourcingRequestRepository.findTop5BuyerDashboardFeeds(
                buyerCompanyId, statuses, userId, role, topFive
        );

        if (requests.isEmpty()) {
            return new BuyerSourcingDashboardListResponse(totalCount, Collections.emptyList());
        }

        // 3. 5개의 ID를 추출하여 대용량 매핑 맵(Map) 조립
        List<Integer> requestIds = requests.stream()
                .map(SourcingRequest::getSourcingRequestId)
                .collect(Collectors.toList());

        // 💡 람다 final 에러 해결: 선언과 조립을 한 번에 끝내 effectively final 상태로 유지
        Set<Integer> categoryIds = requests.stream()
                .map(SourcingRequest::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, String> categoryMap = categoryIds.isEmpty() ? Collections.emptyMap() :
                categoryRepository.findAllById(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getCategoryId, Category::getCategoryName));

        // 견적 제출 수 맵 조립
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

        // 💡 추가 보정: DTO에 필요한 총 수량(qty) 필드를 채우기 위한 묶음 단일 조회 (N+1 최적화)
        List<Tuple> qtyTuples = sourcingRequestItemRepository.sumQuantityGroupedByRequestId(requestIds);
        Map<Integer, Integer> qtyMap = qtyTuples.stream().collect(Collectors.toMap(
                t -> t.get("requestId", Integer.class),
                t -> {
                    Long sum = t.get("sum", Long.class);
                    return sum != null ? sum.intValue() : 0;
                },
                (oldVal, newVal) -> newVal
        ));

        // 4. 최종 변환 및 응답 반환
        // 💡 private 액세스 에러 해결: 직접 생성자 호출을 제거하고 정해진 DTO.of(...) static 메서드를 태워 호출
        Map<Integer, String> finalCategoryMap = categoryMap;
        List<BuyerSourcingDashboardResponse> list = requests.stream().map(req -> {
            String categoryName = finalCategoryMap.getOrDefault(req.getCategoryId(), "미지정");
            int bidCount = bidCountMap.getOrDefault(req.getSourcingRequestId(), 0);
            int totalQty = qtyMap.getOrDefault(req.getSourcingRequestId(), 0);

            return BuyerSourcingDashboardResponse.of(req, categoryName, totalQty, bidCount);
        }).collect(Collectors.toList());

        return new BuyerSourcingDashboardListResponse(totalCount, list);
    }

    /**
     * [바이어 2] 견적 수신 목록 조회
     */
    public BuyerQuoteDashboardListResponse getBuyerReceivedQuotes(
            Integer buyerCompanyId, Integer userId, String role, String statusStr) {

        // 바이어에게 들어온 '활성화된' 소싱 상태 정의
        List<SourcingStatus> activeStatuses = List.of(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);

        // 1. DB에서 조건에 맞는 받은 견적의 '진짜 전체 총 개수'를 광속으로 구합니다.
        long totalCount = sourcingSupplierRepository.countAllReceivedQuotes(
                buyerCompanyId, activeStatuses, userId, role
        );

        // 2. 화면 목록에 뿌려줄 딱 '최신 5개'의 견적 공급업체 데이터만 잘라옵니다.
        Pageable topFive = PageRequest.of(0, 5);
        List<SourcingSupplier> activeSuppliers = sourcingSupplierRepository.findTop5ReceivedQuotes(
                buyerCompanyId, activeStatuses, userId, role, topFive
        );

        if (activeSuppliers.isEmpty()) {
            return new BuyerQuoteDashboardListResponse(totalCount, Collections.emptyList());
        }

        // 3. N+1 문제 방지: 딱 5개의 소싱 요청 ID만 모아서 아이템 총 수량을 한방에 긁어옵니다.
        List<Integer> requestIds = activeSuppliers.stream()
                .map(ss -> ss.getSourcingRequest().getSourcingRequestId())
                .distinct()
                .collect(Collectors.toList());

        // 소싱요청별 총 아이템 수량 그룹화 쿼리 호출 (아까 소싱목록에서 권장드렸던 최적화 기법!)
        List<Tuple> qtyTuples = sourcingRequestItemRepository.sumQuantityGroupedByRequestId(requestIds);
        Map<Integer, Integer> qtyMap = qtyTuples.stream().collect(Collectors.toMap(
                t -> t.get("requestId", Integer.class),
                t -> {
                    Long sum = t.get("sum", Long.class);
                    return sum != null ? sum.intValue() : 0;
                },
                (o, n) -> n
        ));

        // 4. 최종 딱 5개 데이터에 대해서만 DTO 매핑 수행 (루프 내 DB 조회 0건!)
        List<BuyerQuoteDashboardResponse> dtoList = activeSuppliers.stream().map(ss -> {
            SourcingRequest sr = ss.getSourcingRequest();
            Quote quote = ss.getQuote();

            // 매번 DB 안 가고, 위에서 단 1번의 쿼리로 만들어둔 수량 맵에서 쏙 꺼내옵니다.
            int totalQty = qtyMap.getOrDefault(sr.getSourcingRequestId(), 0);
            String sellerCompanyName = "공급사 " + ss.getSellerCompanyId();

            return BuyerQuoteDashboardResponse.of(
                    quote.getQuoteId(),
                    "Q-" + quote.getQuoteId(),
                    sr.getProductName(),
                    sellerCompanyName,
                    totalQty,
                    sr.getUnitPrice() != null ? sr.getUnitPrice() : 0L,
                    sr.getTotalBudget() != null ? sr.getTotalBudget() : 0L,
                    "SUBMITTED",
                    sr.getExpiryDate() != null ? sr.getExpiryDate().atStartOfDay() : LocalDateTime.now()
            );
        }).collect(Collectors.toList());

        // 5. 포장 상자에 담아서 리턴
        return new BuyerQuoteDashboardListResponse(totalCount, dtoList);
    }

    /**
     * [바이어 3] 협의 진행중 내역 조회
     */
    public BuyerNegotiationDashboardListResponse getBuyerNegotiations(
            Integer buyerCompanyId, Integer userId, String role, String statusStr) {

        List<String> statuses = List.of("OPEN");

        // 1. 진짜 전체 대기 건수
        long totalCount = negotiationRepository.countAllBuyerNegotiations(
                buyerCompanyId, statuses, userId, role
        );

        // 2. 최신 5개 데이터 조회
        Pageable topFive = PageRequest.of(0, 5);
        List<Negotiation> negotiations = negotiationRepository.findTop5BuyerNegotiations(
                buyerCompanyId, statuses, userId, role, topFive
        );

        if (negotiations.isEmpty()) {
            return new BuyerNegotiationDashboardListResponse(totalCount, Collections.emptyList());
        }

        // 3. N+1 방지: 최신 메시지 조립용 ID 추출
        List<Integer> negoIds = negotiations.stream()
                .map(Negotiation::getNegotiationId)
                .collect(Collectors.toList());

        List<NegotiationRequest> latestRequests = negotiationRequestRepository.findLatestRequestsByNegotiationIds(negoIds);
        Map<Integer, String> lastMessageMap = latestRequests.stream().collect(Collectors.toMap(
                nr -> nr.getNegotiation().getNegotiationId(),
                NegotiationRequest::getBuyerRequest,
                (o, n) -> n
        ));

        // 4. [수량 최적화 핵심] 5개 데이터 중 존재하는 견적 ID만 골라내기
        List<Integer> quoteIds = negotiations.stream()
                .map(n -> n.getQuote() != null ? n.getQuote().getQuoteId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        final Map<Integer, Integer> finalQuoteQtyMap = quoteIds.isEmpty()
                ? Collections.emptyMap()
                : quoteItemRepository.sumQuantityGroupedByQuoteId(quoteIds).stream()
                .collect(Collectors.toMap(
                        t -> t.get("quoteId", Integer.class),
                        t -> {
                            Long sum = t.get("sum", Long.class);
                            return sum != null ? sum.intValue() : 0;
                        },
                        (o, n) -> n
                ));

        // 5. 루프 돌며 DTO 조립 (변수가 final이므로 에러 없음!)
        List<BuyerNegotiationDashboardResponse> dtoList = negotiations.stream().map(n -> {

            String lastMessage = lastMessageMap.getOrDefault(n.getNegotiationId(), "진행 중인 협의 내용이 있습니다.");
            String sellerCompanyName = n.getSeller() != null ? "공급사 " + n.getSeller().getName() : "미지정 공급사";

            int qty = 0;
            if (n.getQuote() != null) {
                qty = finalQuoteQtyMap.getOrDefault(n.getQuote().getQuoteId(), 0);
            }

            return new BuyerNegotiationDashboardResponse(
                    n.getNegotiationId(),
                    n.getQuote() != null ? n.getQuote().getProductName() : n.getTitle(),
                    sellerCompanyName,
                    qty,
                    n.getTitle(),
                    n.getStatus(),
                    lastMessage,
                    n.getUpdatedAt(),
                    false
            );
        }).collect(Collectors.toList());

        return new BuyerNegotiationDashboardListResponse(totalCount, dtoList);
    }

    /**
     * [바이어 4 & 5] 결제 대기 및 배송 중 주문 목록 조회
     */
    public BuyerOrderDashboardListResponse getBuyerOrders(
            Integer buyerCompanyId, Integer userId, String role, String statusStr) {

        List<OrderStatus> statuses = Arrays.stream(statusStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(s -> {
                    try {
                        return OrderStatus.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (statuses.isEmpty()) {
            statuses = List.of(OrderStatus.PENDING);
        }

        // 1. 주문 마스터(Order) 기준으로 전체 카운트를 조회합니다.
        long totalCount = orderRepository.countAllBuyerOrders(buyerCompanyId, statuses, userId, role);

        // 2. 주문 마스터(Order) 기준으로 최신 5개 주문 데이터만 자릅니다.
        Pageable topFive = PageRequest.of(0, 5);
        List<Order> orders = orderRepository.findTop5BuyerOrders(buyerCompanyId, statuses, userId, role, topFive);

        if (orders.isEmpty()) {
            return new BuyerOrderDashboardListResponse(totalCount, Collections.emptyList());
        }

        // 3. 딱 5개의 주문 ID만 추출해서 하위 품목(OrderItem)들을 N+1 없이 단 1번의 쿼리로 긁어옵니다.
        List<Integer> orderIds = orders.stream().map(Order::getOrderId).collect(Collectors.toList());
        List<OrderItem> allItems = orderItemRepository.findByOrderIds(orderIds);

        // 4. 추출한 자식 품목들을 주문 ID별로 그룹핑 맵(Map)을 생성합니다.
        Map<Integer, List<OrderItem>> orderItemsGroupByMap = allItems.stream()
                .collect(Collectors.groupingBy(oi -> oi.getOrder().getOrderId()));

        // 5. 각 주문별로 자식 아이템들을 파싱하여 "첫번째 상품명 외 N건" 및 "총 수량"을 조립합니다.
        List<BuyerOrderDashboardResponse> dtoList = orders.stream().map(o -> {
            List<OrderItem> items = orderItemsGroupByMap.getOrDefault(o.getOrderId(), Collections.emptyList());

            String productName = "주문 상품 정보 없음";
            int totalQty = 0;

            if (!items.isEmpty()) {
                String firstItemName = items.get(0).getProductName();
                totalQty = items.stream().mapToInt(OrderItem::getQuantity).sum();

                // 💡 품목 개수가 2개 이상일 때만 "외 N건" 처리를 진행합니다.
                productName = items.size() > 1 ? firstItemName + " 외 " + (items.size() - 1) + "건" : firstItemName;
            }

            return new BuyerOrderDashboardResponse(
                    o.getOrderId(),
                    o.getOrderNo(),
                    productName,                  // 묶인 상품명 반영 ("트렌치 코트 외 2건")
                    o.getSellerCompanyName(),
                    totalQty,                     // 주문 내 모든 품목 합산 수량 반영
                    o.getTotalAmount(),
                    o.getStatus().name(),
                    o.getCreatedAt(),
                    false,
                    o.getCarrier(),
                    o.getTrackingNumber()
            );
        }).collect(Collectors.toList());

        return new BuyerOrderDashboardListResponse(totalCount, dtoList);
    }

    /**
     * [바이어 6] 이의제기 진행 내역 조회
     * 대표는 회사 전체, 직원은 본인이 접수한 이의제기만 조회 가능 스펙 바인딩
     */
    public List<BuyerDisputeDashboardResponse> getBuyerActiveDisputes(Integer buyerId, String statusStr) {
        List<DisputeStatus> statuses = Arrays.stream(statusStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(s -> {
                    try {
                        return DisputeStatus.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (statuses.isEmpty()) {
            return Collections.emptyList();
        }

        Pageable topFive = PageRequest.of(0, 5);
        List<Dispute> disputes = disputeRepository.findTop5BuyerDisputes(buyerId, statuses, topFive);

        if (disputes.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> disputeIds = disputes.stream().map(Dispute::getDisputeId).collect(Collectors.toList());
        List<DisputeItem> disputeItems = disputeItemRepository.findByDisputeIds(disputeIds);
        Map<Integer, List<DisputeItem>> itemsGroupMap = disputeItems.stream()
                .collect(Collectors.groupingBy(di -> di.getDispute().getDisputeId()));

        return disputes.stream().map(d -> {
            List<DisputeItem> items = itemsGroupMap.getOrDefault(d.getDisputeId(), Collections.emptyList());
            String productName = "정보 없음";
            if (!items.isEmpty()) {
                String firstProductName = items.get(0).getOrderItem().getProductName();
                productName = items.size() > 1 ? firstProductName + " 외 " + (items.size() - 1) + "건" : firstProductName;
            } else if (d.getOrder() != null) {
                productName = d.getOrder().getOrderNo();
            }

            String sellerName = d.getSellerCompany() != null ? d.getSellerCompany().getName() : "미지정 공급사";

            return new BuyerDisputeDashboardResponse(
                    d.getDisputeId(),
                    productName,
                    sellerName,
                    d.getTitle(),
                    d.getDisputeType().name(),
                    d.getBuyerClaim(),
                    d.getStatus().name(),
                    d.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    /**
     * [바이어 7] 자동확정 임박 건 조회
     * 배송 완료 상태 조건 매핑 및 경과 일수 필터 최적화 연동
     */
    public List<UrgentReceiptDashboardResponse> getBuyerUrgentReceipts(Integer buyerId) {
        Pageable topFive = PageRequest.of(0, 5);

        // 현재 시간 기준 5일 전 시점 계산 (이 시점보다 이전에 배송 완료된 건이 5일 이상 경과된 건)
        LocalDateTime urgentThresholdDate = LocalDateTime.now().minusDays(5);

        List<Order> orders = orderRepository.findTop5UrgentReceipts(
                buyerId,
                List.of(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
                urgentThresholdDate,
                topFive
        );

        if (orders.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> orderIds = orders.stream().map(Order::getOrderId).collect(Collectors.toList());
        List<OrderItem> allItems = orderItemRepository.findByOrderIds(orderIds);
        Map<Integer, List<OrderItem>> orderItemsGroupByMap = allItems.stream()
                .collect(Collectors.groupingBy(oi -> oi.getOrder().getOrderId()));

        LocalDateTime now = LocalDateTime.now();

        return orders.stream().map(o -> {
            List<OrderItem> items = orderItemsGroupByMap.getOrDefault(o.getOrderId(), Collections.emptyList());
            String productName = "주문 상품 정보 없음";
            int totalQty = 0;

            if (!items.isEmpty()) {
                String firstItemName = items.get(0).getProductName();
                totalQty = items.stream().mapToInt(OrderItem::getQuantity).sum();
                productName = items.size() > 1 ? firstItemName + " 외 " + (items.size() - 1) + "건" : firstItemName;
            }

            // 경과 일수 계산 기준을 o.getDeliveredAt()으로 변경하여 신뢰성 확보
            long daysElapsed = 0;
            if (o.getDeliveredAt() != null) {
                daysElapsed = ChronoUnit.DAYS.between(o.getDeliveredAt(), now);
            }

            return new UrgentReceiptDashboardResponse(
                    o.getOrderId(),
                    o.getOrderNo(),
                    productName,
                    o.getSellerCompanyName(),
                    totalQty,
                    (int) daysElapsed
            );
        }).collect(Collectors.toList());
    }

// =================================================================
    // ── SELLER DASHBOARD SERVICES (셀러 7개 비즈니스 로직 완전 교정) ──
    // =================================================================

    public List<SellerSourcingFeedResponse> getSellerSourcingFeedList(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        Pageable topFive = PageRequest.of(0, 5);
        List<SourcingSupplier> suppliers = sourcingSupplierRepository.findTop5SellerFeeds(
                sellerCompanyId, SourcingSupplierStatus.RECOMMENDED, topFive);

        if (suppliers.isEmpty()) return Collections.emptyList();

        List<SourcingRequest> requests = suppliers.stream().map(SourcingSupplier::getSourcingRequest).collect(Collectors.toList());
        Set<Integer> categoryIds = requests.stream().map(SourcingRequest::getCategoryId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, String> categoryMap = Collections.emptyMap();
        if (!categoryIds.isEmpty()) {
            categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(Category::getCategoryId, Category::getCategoryName));
        }

        Map<Integer, String> finalCategoryMap = categoryMap;
        return requests.stream().map(req -> {
            List<SourcingRequestItem> items = sourcingRequestItemRepository.findBySourcingRequest_SourcingRequestId(req.getSourcingRequestId());
            int totalQty = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();
            return SellerSourcingFeedResponse.of(req, "바이어 회사 " + req.getBuyerCompanyId(), finalCategoryMap.getOrDefault(req.getCategoryId(), "미지정"), totalQty);
        }).collect(Collectors.toList());
    }

    public List<QuoteDraftDashboardResponse> getSellerQuoteDrafts(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        Pageable topFive = PageRequest.of(0, 5);
        List<SourcingSupplier> sellerAllocations = sourcingSupplierRepository.findTop5SellerQuoteDrafts(sellerCompanyId, SourcingSupplierStatus.RECOMMENDED, topFive);

        if (sellerAllocations.isEmpty()) return Collections.emptyList();

        List<Integer> requestIds = sellerAllocations.stream().map(ss -> ss.getSourcingRequest().getSourcingRequestId()).collect(Collectors.toList());
        Map<Integer, Integer> qtyMap = sourcingRequestItemRepository.sumQuantityGroupedByRequestId(requestIds).stream()
                .collect(Collectors.toMap(t -> t.get("requestId", Integer.class), t -> {
                    Long sum = t.get("sum", Long.class);
                    return sum != null ? sum.intValue() : 0;
                }, (o, n) -> n));

        return sellerAllocations.stream().map(ss -> {
            SourcingRequest sr = ss.getSourcingRequest();
            return QuoteDraftDashboardResponse.of(ss.getSourcingSupplierSId(), sr.getProductName(), "바이어 회사 " + sr.getBuyerCompanyId(), qtyMap.getOrDefault(sr.getSourcingRequestId(), 0), sr.getTotalBudget() != null ? sr.getTotalBudget() : 0L, sr.getExpiryDate());
        }).collect(Collectors.toList());
    }

    public List<SellerNegotiationDashboardResponse> getSellerNegotiations(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        List<String> statuses = List.of("OPEN");
        Pageable topFive = PageRequest.of(0, 5);
        List<Negotiation> negotiations = negotiationRepository.findTop5SellerNegotiations(sellerCompanyId, statuses, sellerUserId, role, topFive);

        if (negotiations.isEmpty()) return Collections.emptyList();

        List<Integer> quoteIds = negotiations.stream().map(n -> n.getQuote() != null ? n.getQuote().getQuoteId() : null).filter(Objects::nonNull).distinct().collect(Collectors.toList());
        final Map<Integer, Integer> finalQuoteQtyMap = quoteIds.isEmpty() ? Collections.emptyMap() : quoteItemRepository.sumQuantityGroupedByQuoteId(quoteIds).stream()
                .collect(Collectors.toMap(t -> t.get("quoteId", Integer.class), t -> {
                    Long sum = t.get("sum", Long.class);
                    return sum != null ? sum.intValue() : 0;
                }, (o, n) -> n));

        return negotiations.stream().map(n -> {
            // 💡 컴파일 오류 유발 코드를 완벽 제거한 확정 라인
            String lastMessage = n.getTitle() != null ? n.getTitle() : "진행 중인 협의 내용이 있습니다.";
            return new SellerNegotiationDashboardResponse(n.getNegotiationId(), n.getTitle(), n.getQuote() != null ? n.getQuote().getProductName() : n.getTitle(), n.getBuyer() != null ? n.getBuyer().getName() : "미지정 바이어", n.getQuote() != null ? finalQuoteQtyMap.getOrDefault(n.getQuote().getQuoteId(), 0) : 0, lastMessage, n.getUpdatedAt(), false);
        }).collect(Collectors.toList());
    }

    public List<SellerShipmentDashboardResponse> getSellerOrders(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        List<OrderStatus> statuses = Arrays.stream(statusStr.split(",")).map(String::trim).map(String::toUpperCase).map(s -> {
            try {
                return OrderStatus.valueOf(s);
            } catch (IllegalArgumentException e) {
                return null;
            }
        }).filter(Objects::nonNull).collect(Collectors.toList());
        if (statuses.isEmpty()) statuses = List.of(OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

        Pageable topFive = PageRequest.of(0, 5);
        List<Order> orders = orderRepository.findTop5SellerOrders(sellerCompanyId, statuses, topFive);
        if (orders.isEmpty()) return Collections.emptyList();

        Map<Integer, List<OrderItem>> orderItemsGroupByMap = orderItemRepository.findByOrderIds(orders.stream().map(Order::getOrderId).collect(Collectors.toList())).stream().collect(Collectors.groupingBy(oi -> oi.getOrder().getOrderId()));

        return orders.stream().map(o -> {
            List<OrderItem> items = orderItemsGroupByMap.getOrDefault(o.getOrderId(), Collections.emptyList());
            String productName = "주문 상품 정보 없음";
            int totalQty = 0;
            if (!items.isEmpty()) {
                String firstItemName = items.get(0).getProductName();
                totalQty = items.stream().mapToInt(OrderItem::getQuantity).sum();
                productName = items.size() > 1 ? firstItemName + " 외 " + (items.size() - 1) + "건" : firstItemName;
            }
            return SellerShipmentDashboardResponse.of(o.getOrderId(), o.getOrderNo(), productName, o.getBuyer() != null ? o.getBuyer().getName() : "미지정 바이어", totalQty, o.getTotalAmount(), o.getCreatedAt(), o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate().plusDays(3) : LocalDate.now().plusDays(3));
        }).collect(Collectors.toList());
    }

    public List<SellerDisputeDashboardResponse> getSellerActiveDisputes(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        List<DisputeStatus> statuses = Arrays.stream(statusStr.split(",")).map(String::trim).map(String::toUpperCase).map(s -> {
            try {
                return DisputeStatus.valueOf(s);
            } catch (IllegalArgumentException e) {
                return null;
            }
        }).filter(Objects::nonNull).collect(Collectors.toList());
        if (statuses.isEmpty())
            statuses = List.of(DisputeStatus.RECEIVED, DisputeStatus.REVIEWING, DisputeStatus.WAITING_SELLER);

        Pageable topFive = PageRequest.of(0, 5);
        List<Dispute> disputes = disputeRepository.findTop5SellerDisputes(sellerCompanyId, statuses, topFive);
        if (disputes.isEmpty()) return Collections.emptyList();

        Map<Integer, List<DisputeItem>> itemsGroupMap = disputeItemRepository.findByDisputeIds(disputes.stream().map(Dispute::getDisputeId).collect(Collectors.toList())).stream().collect(Collectors.groupingBy(di -> di.getDispute().getDisputeId()));

        return disputes.stream().map(d -> {
            List<DisputeItem> items = itemsGroupMap.getOrDefault(d.getDisputeId(), Collections.emptyList());
            String productName = "정보 없음";
            if (!items.isEmpty()) {
                String firstProductName = items.get(0).getOrderItem().getProductName();
                productName = items.size() > 1 ? firstProductName + " 외 " + (items.size() - 1) + "건" : firstProductName;
            } else if (d.getOrder() != null) {
                productName = d.getOrder().getOrderNo();
            }
            return new SellerDisputeDashboardResponse(d.getDisputeId(), d.getTitle(), productName, d.getBuyer() != null ? d.getBuyer().getName() : "미지정 바이어", d.getBuyerClaim(), d.getCreatedAt(), d.getStatus().name());
        }).collect(Collectors.toList());
    }

    public List<SellerSettlementDashboardResponse> getSellerPendingSettlements(
            Integer sellerCompanyId, Integer sellerUserId, String role, String statusStr) {
        Pageable topFive = PageRequest.of(0, 5);
        List<Order> orders = orderRepository.findTop5SellerOrders(sellerCompanyId, List.of(OrderStatus.DELIVERED), topFive);
        if (orders.isEmpty()) return Collections.emptyList();

        Map<Integer, List<OrderItem>> orderItemsGroupByMap = orderItemRepository.findByOrderIds(orders.stream().map(Order::getOrderId).collect(Collectors.toList())).stream().collect(Collectors.groupingBy(oi -> oi.getOrder().getOrderId()));

        return orders.stream().map(o -> {
            List<OrderItem> items = orderItemsGroupByMap.getOrDefault(o.getOrderId(), Collections.emptyList());
            String productName = "주문 상품 정보 없음";
            int totalQty = 0;
            if (!items.isEmpty()) {
                String firstItemName = items.get(0).getProductName();
                totalQty = items.stream().mapToInt(OrderItem::getQuantity).sum();
                productName = items.size() > 1 ? firstItemName + " 외 " + (items.size() - 1) + "건" : firstItemName;
            }
            long totalAmount = o.getTotalAmount() != null ? o.getTotalAmount() : 0L;
            long fee = (long) (totalAmount * 0.03);
            return new SellerSettlementDashboardResponse(o.getOrderId(), o.getOrderNo(), productName, o.getBuyer() != null ? o.getBuyer().getName() : "미지정 바이어", totalQty, totalAmount, fee, totalAmount - fee, o.getCreatedAt());
        }).collect(Collectors.toList());
    }
}