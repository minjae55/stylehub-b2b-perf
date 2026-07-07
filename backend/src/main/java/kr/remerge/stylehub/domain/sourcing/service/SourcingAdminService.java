package kr.remerge.stylehub.domain.sourcing.service;

import jakarta.persistence.Tuple;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.sourcing.dto.AdminSourcingRequestResponse;
import kr.remerge.stylehub.domain.sourcing.dto.AdminSourcingStatsResponse;
import kr.remerge.stylehub.domain.sourcing.dto.AssignableCompanyResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingReviewQueueResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.notification.NotificationMessage;
import kr.remerge.stylehub.global.notification.enumtype.NotificationType;
import kr.remerge.stylehub.global.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SourcingAdminService {

    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyHandledCategoryRepository companyHandledCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;

    private static final List<SourcingStatus> ACTIVE_STATUSES =
            List.of(SourcingStatus.PENDING, SourcingStatus.QUOTED, SourcingStatus.NEGOTIATING);
    private static final List<SourcingStatus> TRADING_STATUSES =
            List.of(SourcingStatus.TRADING);
    private static final List<SourcingStatus> COMPLETED_STATUSES =
            List.of(SourcingStatus.COMPLETED);
    private static final List<SourcingStatus> CLOSED_STATUSES =
            List.of(SourcingStatus.CANCELLED, SourcingStatus.WITHDRAWN, SourcingStatus.EXPIRED);
    private final SourcingAutoCancelService sourcingAutoCancelService;

    // ───────────────────────────────────────────
    // 전체 소싱 요청 현황 (회사 무관)
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminSourcingRequestResponse> getAllRequests(String filter) {
        List<SourcingStatus> statuses = resolveStatuses(filter);

        List<SourcingRequest> requests = statuses == null
                ? sourcingRequestRepository.findAllByOrderByCreatedAtDesc()
                : sourcingRequestRepository.findAllByStatusInOrderByCreatedAtDesc(statuses);

        if (requests.isEmpty()) {
            return List.of();
        }

        Map<Integer, String> companyNames = companyRepository
                .findAllById(requests.stream().map(SourcingRequest::getBuyerCompanyId).distinct().toList())
                .stream()
                .collect(HashMap::new, (m, c) -> m.put(c.getCompanyId(), c.getName()), HashMap::putAll);

        // categoryId가 null인 요청도 있을 수 있으므로 null 제외하고 조회
        List<Integer> categoryIds = requests.stream()
                .map(SourcingRequest::getCategoryId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        Map<Integer, String> categoryNames = categoryIds.isEmpty()
                ? Map.of()
                : categoryRepository.findAllById(categoryIds)
                .stream()
                .collect(HashMap::new, (m, c) -> m.put(c.getCategoryId(), c.getCategoryName()), HashMap::putAll);

        Map<Integer, Integer> pendingCounts = new HashMap<>();
        for (Tuple t : sourcingSupplierRepository.countByStatusGroupedByRequest(SourcingSupplierStatus.SUGGESTED)) {
            pendingCounts.put(t.get("requestId", Integer.class), t.get("cnt", Long.class).intValue());
        }

        return requests.stream()
                .map(r -> AdminSourcingRequestResponse.of(
                        r,
                        companyNames.get(r.getBuyerCompanyId()),
                        r.getCategoryId() != null ? categoryNames.get(r.getCategoryId()) : null,
                        pendingCounts.getOrDefault(r.getSourcingRequestId(), 0)
                ))
                .toList();
    }

    private List<SourcingStatus> resolveStatuses(String filter) {
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("ALL")) {
            return null;
        }
        return switch (filter.toUpperCase()) {
            case "ACTIVE" -> ACTIVE_STATUSES;
            case "TRADING" -> TRADING_STATUSES;
            case "COMPLETED" -> COMPLETED_STATUSES;
            case "CLOSED" -> CLOSED_STATUSES;
            default -> throw new BusinessException(ErrorCode.INVALID_INPUT);
        };
    }

    @Transactional(readOnly = true)
    public AdminSourcingStatsResponse getStats() {
        List<Tuple> grouped = sourcingRequestRepository.countAllGroupedByStatus();

        Map<SourcingStatus, Long> counts = new EnumMap<>(SourcingStatus.class);
        for (Tuple t : grouped) {
            counts.put(t.get("status", SourcingStatus.class), t.get("cnt", Long.class));
        }

        long active = sumStatuses(counts, ACTIVE_STATUSES);
        long trading = sumStatuses(counts, TRADING_STATUSES);
        long completed = sumStatuses(counts, COMPLETED_STATUSES);
        long closed = sumStatuses(counts, CLOSED_STATUSES);
        long all = active + trading + completed + closed;

        return AdminSourcingStatsResponse.builder()
                .all(all)
                .active(active)
                .trading(trading)
                .completed(completed)
                .closed(closed)
                .build();
    }

    private long sumStatuses(Map<SourcingStatus, Long> counts, List<SourcingStatus> statuses) {
        return statuses.stream().mapToLong(s -> counts.getOrDefault(s, 0L)).sum();
    }

    // ───────────────────────────────────────────
    // 공급사 배정 승인 대기 큐
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SourcingReviewQueueResponse> getReviewQueue() {
        List<Tuple> grouped = sourcingSupplierRepository.countByStatusGroupedByRequest(SourcingSupplierStatus.SUGGESTED);

        return grouped.stream()
                .map(t -> {
                    Integer requestId = t.get("requestId", Integer.class);
                    long cnt = t.get("cnt", Long.class);

                    SourcingRequest request = sourcingRequestRepository.findById(requestId)
                            .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_NOT_FOUND));

                    String buyerCompanyName = companyRepository.findById(request.getBuyerCompanyId())
                            .map(Company::getName)
                            .orElse(null);

                    return SourcingReviewQueueResponse.of(request, buyerCompanyName, (int) cnt);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SourcingSupplierResponse> getSuggestedSuppliers(Integer sourcingRequestId) {
        List<SourcingSupplier> suppliers = sourcingSupplierRepository
                .findAllBySourcingRequest_SourcingRequestIdAndStatus(
                        sourcingRequestId, SourcingSupplierStatus.SUGGESTED);

        Map<Integer, String> companyNames = companyRepository
                .findAllById(suppliers.stream().map(SourcingSupplier::getSellerCompanyId).toList())
                .stream()
                .collect(HashMap::new, (m, c) -> m.put(c.getCompanyId(), c.getName()), HashMap::putAll);

        return suppliers.stream()
                .map(s -> SourcingSupplierResponse.from(s, companyNames.get(s.getSellerCompanyId())))
                .toList();
    }

    @Transactional
    public void approve(Integer sourcingSupplierId, Integer adminId) {
        SourcingSupplier supplier = sourcingSupplierRepository.findById(sourcingSupplierId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_SUPPLIER_NOT_FOUND));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        supplier.approve(admin);

        notificationService.send(NotificationMessage.toCompany(
                NotificationType.SOURCING_ASSIGNED,
                supplier.getSellerCompanyId(),
                supplier.getSourcingRequest().getSourcingRequestId(),
                "SOURCING"
        ));
    }

    @Transactional
    public void reject(Integer sourcingSupplierId, Integer adminId, String reason) {
        SourcingSupplier supplier = sourcingSupplierRepository.findById(sourcingSupplierId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_SUPPLIER_NOT_FOUND));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        supplier.reject(admin, reason);

        Integer sourcingRequestId = supplier.getSourcingRequest().getSourcingRequestId();
        sourcingAutoCancelService.checkAndAutoCancel(sourcingRequestId);
    }


    @Transactional(readOnly = true)
    public List<SourcingSupplierResponse> getUnassignedRequests() {
        return sourcingSupplierRepository.findUnassignedRequests()
                .stream()
                .map(SourcingSupplierResponse::from)
                .toList();
    }

    // ───────────────────────────────────────────
    // 관리자 수동배정 화면 - 배정 가능한 회사 검색
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AssignableCompanyResponse> getAssignableCompanies(
            Integer sourcingRequestId, String keyword, boolean includeAllCategories
    ) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_NOT_FOUND));

        Integer categoryId = sourcingRequest.getCategoryId();
        Integer buyerCompanyId = sourcingRequest.getBuyerCompanyId();

        // 이미 배정된 회사(상태 무관)는 검색 결과에서 제외 - manualAssign의 중복 배정 방지와 동일한 기준
        List<Integer> alreadyAssignedIds = sourcingSupplierRepository
                .findAllBySourcingRequest_SourcingRequestId(sourcingRequestId)
                .stream()
                .map(SourcingSupplier::getSellerCompanyId)
                .toList();

        String safeKeyword = keyword == null ? "" : keyword.trim();

        List<Integer> candidateIds = companyRepository.findAllByNameContainingIgnoreCase(safeKeyword)
                .stream()
                .map(Company::getCompanyId)
                .filter(id -> !id.equals(buyerCompanyId))
                .filter(id -> !alreadyAssignedIds.contains(id))
                .toList();

        if (candidateIds.isEmpty()) {
            return List.of();
        }

        // 기본은 카테고리 매칭 필터를 적용. includeAllCategories=true면 건너뛰어 전체 검색
        // (셀러가 취급 카테고리 등록을 누락/오기입한 경우, 관리자가 상품명 보고 직접 판단해서
        //  이름 검색으로 찾을 수 있도록 하는 예외 통로)
        if (!includeAllCategories && categoryId != null) {
            List<Integer> categoryMatchIds = companyHandledCategoryRepository.findCompanyIdsByCategoryId(categoryId);
            candidateIds = candidateIds.stream()
                    .filter(categoryMatchIds::contains)
                    .toList();
        }

        if (candidateIds.isEmpty()) {
            return List.of();
        }

        List<Integer> approvedIds = companyRepository.findIdsByIdInAndStatusAndSellerStatus(
                candidateIds, CompanyStatus.APPROVED, SellerStatus.APPROVED
        );

        if (approvedIds.isEmpty()) {
            return List.of();
        }

        return companyRepository.findAllById(approvedIds).stream()
                .map(AssignableCompanyResponse::from)
                .toList();
    }

    @Transactional
    public void manualAssign(Integer sourcingRequestId, Integer companyId) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_NOT_FOUND));

        if (sourcingRequest.getBuyerCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.SOURCING_SELF_COMPANY_NOT_ALLOWED);
        }

        boolean alreadyAssigned = sourcingSupplierRepository
                .findBySourcingRequest_SourcingRequestIdAndSellerCompanyId(sourcingRequestId, companyId)
                .isPresent();
        if (alreadyAssigned) {
            throw new BusinessException(ErrorCode.SOURCING_SUPPLIER_ALREADY_ASSIGNED);
        }

        SourcingSupplier supplier = SourcingSupplier.builder()
                .sourcingRequest(sourcingRequest)
                .sellerCompanyId(companyId)
                .build();

        sourcingSupplierRepository.save(supplier);
    }
}