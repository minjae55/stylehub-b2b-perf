package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestSellerDetailResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestFileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SourcingRequestSellerDetailService {

    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingRequestItemRepository sourcingRequestItemRepository;
    private final SourcingRequestFileRepository sourcingRequestFileRepository;
    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public SourcingRequestSellerDetailResponse getSellerSourcingDetail(
            Integer sourcingRequestId, Integer sellerCompanyId) {

        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_NOT_FOUND));

        // 관리자 승인 전(SUGGESTED) 또는 관리자가 반려(REJECTED)한 배정은
        // 아직/영원히 셀러에게 노출되면 안 되는 상태이므로 상세 조회 자체를 차단
        SourcingSupplier mySupplier = sourcingSupplierRepository
                .findBySourcingRequest_SourcingRequestIdAndSellerCompanyId(sourcingRequestId, sellerCompanyId)
                .filter(s -> s.getStatus() != SourcingSupplierStatus.SUGGESTED
                        && s.getStatus() != SourcingSupplierStatus.REJECTED)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_SUPPLIER_NOT_FOUND));

        // categoryId가 없을 수도 있으므로 null-safe 하게 조회
        String categoryName = request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId())
                .map(Category::getCategoryName)
                .orElse(null)
                : null;

        return SourcingRequestSellerDetailResponse.from(
                request,
                sourcingRequestItemRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId),
                sourcingRequestFileRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId),
                mySupplier,
                categoryName
        );
    }
}