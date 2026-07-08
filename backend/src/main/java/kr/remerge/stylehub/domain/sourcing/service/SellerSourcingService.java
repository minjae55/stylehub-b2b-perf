package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.sourcing.dto.SellerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerSourcingService {

    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingAutoCancelService sourcingAutoCancelService;

    // current 탭: RECOMMENDED (견적 없음 → 회사 전체 공개)
    // my 탭: QUOTED (견적 있음 → 작성자 본인 또는 대표만 공개)
    @Transactional(readOnly = true)
    public List<SellerSourcingResponse> getSellerRequests(
            Integer companyId, String type, SourcingSupplierStatus status, Integer userId, String role) {
        return sourcingSupplierRepository
                .findSellerRequests(companyId, status, type, userId, role)
                .stream()
                .map(SellerSourcingResponse::from)
                .toList();
    }

    // 견적이 없으면(=담당자 미지정) 회사 전체 공개, 있으면 작성자 본인 또는 대표만 공개
    @Transactional(readOnly = true)
    public List<SellerSourcingResponse> getSellerPastRequests(
            Integer companyId, String type, Integer userId, String role) {
        return sourcingSupplierRepository
                .findSellerPastRequests(
                        companyId,
                        List.of(SourcingSupplierStatus.DECLINED, SourcingSupplierStatus.EXPIRED, SourcingSupplierStatus.CANCELLED),
                        List.of(QuoteStatusCode.REJECTED, QuoteStatusCode.NOT_SELECTED),
                        type,
                        userId,
                        role
                )
                .stream()
                .map(SellerSourcingResponse::from)
                .toList();
    }

    @Transactional
    public void decline(Integer sourcingSupplierId, Integer companyId, String feedback) {
        SourcingSupplier supplier = sourcingSupplierRepository.findById(sourcingSupplierId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOURCING_SUPPLIER_NOT_FOUND));

        if (!supplier.getSellerCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        supplier.decline(feedback);

        Integer sourcingRequestId = supplier.getSourcingRequest().getSourcingRequestId();
        sourcingAutoCancelService.checkAndAutoCancel(sourcingRequestId);
    }

    // APPROVED는 항상 견적 작성자가 확정된 상태 → 작성자 본인 또는 대표만 공개
    @Transactional(readOnly = true)
    public List<SellerSourcingResponse> getSellerCompletedRequests(
            Integer companyId, String type, Integer userId, String role) {
        return sourcingSupplierRepository
                .findSellerCompletedRequests(companyId, QuoteStatusCode.APPROVED, type, userId, role)
                .stream()
                .map(SellerSourcingResponse::from)
                .toList();
    }


}