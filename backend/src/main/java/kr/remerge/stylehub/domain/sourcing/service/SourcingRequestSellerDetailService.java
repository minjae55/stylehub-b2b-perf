package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestSellerDetailResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestFileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
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

    @Transactional(readOnly = true)
    public SourcingRequestSellerDetailResponse getSellerSourcingDetail(
            Integer sourcingRequestId, Integer sellerCompanyId) {

        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청을 찾을 수 없습니다."));

        SourcingSupplier mySupplier = sourcingSupplierRepository
                .findBySourcingRequest_SourcingRequestIdAndSellerCompanyId(sourcingRequestId, sellerCompanyId)
                .orElseThrow(() -> new IllegalArgumentException("배정되지 않은 소싱 요청입니다."));

        return SourcingRequestSellerDetailResponse.from(
                request,
                sourcingRequestItemRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId),
                sourcingRequestFileRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId),
                mySupplier
        );
    }
}