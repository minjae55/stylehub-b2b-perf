package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SellerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static reactor.netty.http.HttpConnectionLiveness.log;

@Service
@RequiredArgsConstructor
public class SellerSourcingService {

    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final SourcingRequestRepository sourcingRequestRepository;

    // current 탭: RECOMMENDED
    // my 탭: QUOTED
    @Transactional(readOnly = true)
    public List<SellerSourcingResponse> getSellerRequests(Integer companyId, String type, SourcingSupplierStatus status) {
        return sourcingSupplierRepository
                .findSellerRequests(companyId, status, type)
                .stream()
                .map(SellerSourcingResponse::from)
                .toList();
    }

    // past 탭: DECLINED + EXPIRED
    @Transactional(readOnly = true)
    public List<SellerSourcingResponse> getSellerPastRequests(Integer companyId, String type) {
        return sourcingSupplierRepository
                .findSellerPastRequests(
                        companyId,
                        List.of(SourcingSupplierStatus.DECLINED, SourcingSupplierStatus.EXPIRED),
                        type
                )
                .stream()
                .map(SellerSourcingResponse::from)
                .toList();
    }

    // 거절 + 전체 DECLINED 시 자동 반려
    @Transactional
    public void decline(Integer sourcingSupplierId, Integer companyId, String feedback) {
        SourcingSupplier supplier = sourcingSupplierRepository.findById(sourcingSupplierId)
                .orElseThrow(() -> new IllegalArgumentException("해당 배정 없음: " + sourcingSupplierId));

        // 본인 배정인지 확인
        if (!supplier.getSellerCompanyId().equals(companyId)) {
            throw new IllegalArgumentException("권한 없음");
        }

        supplier.decline(feedback);

        // 해당 소싱 요청의 모든 supplier가 DECLINED인지 체크
        Integer sourcingRequestId = supplier.getSourcingRequest().getSourcingRequestId();
        List<SourcingSupplier> allSuppliers = sourcingSupplierRepository
                .findAllBySourcingRequest_SourcingRequestId(sourcingRequestId);

        boolean allDeclined = allSuppliers.stream()
                .allMatch(s -> s.getStatus() == SourcingSupplierStatus.DECLINED);

        if (allDeclined) {
            SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                    .orElseThrow(() -> new IllegalArgumentException("소싱 요청 없음: " + sourcingRequestId));
            sourcingRequest.cancel();
            log.info("[AutoCancel] 모든 공급사 거절 → 소싱 요청 반려 처리 - sourcingRequestId: {}", sourcingRequestId);
        }
    }
}
