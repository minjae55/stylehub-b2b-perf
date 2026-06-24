package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierResponse;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SourcingAdminService {

    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final UserRepository userRepository;

    // SUGGESTED 상태 공급사 목록 조회
    @Transactional(readOnly = true)
    public List<SourcingSupplierResponse> getSuggestedSuppliers(Integer sourcingRequestId) {
        return sourcingSupplierRepository
                .findAllBySourcingRequest_SourcingRequestIdAndStatus(
                        sourcingRequestId, SourcingSupplierStatus.SUGGESTED)
                .stream()
                .map(SourcingSupplierResponse::from)
                .toList();
    }

    // 관리자 승인 → RECOMMENDED
    @Transactional
    public void approve(Integer sourcingSupplierId, Integer adminId) {
        SourcingSupplier supplier = sourcingSupplierRepository.findById(sourcingSupplierId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공급사 배정 없음: " + sourcingSupplierId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("해당 관리자 없음: " + adminId));

        supplier.approve(admin);
    }

    // 배정 안 된 소싱 요청 목록 조회
    // sourcing_suppliers가 없거나 전부 DECLINED인 요청
    @Transactional(readOnly = true)
    public List<SourcingSupplierResponse> getUnassignedRequests() {
        return sourcingSupplierRepository.findUnassignedRequests()
                .stream()
                .map(SourcingSupplierResponse::from)
                .toList();
    }

    // 수동 배정 → SUGGESTED로 추가
    @Transactional
    public void manualAssign(Integer sourcingRequestId, Integer companyId) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청 없음: " + sourcingRequestId));

        SourcingSupplier supplier = SourcingSupplier.builder()
                .sourcingRequest(sourcingRequest)
                .sellerCompanyId(companyId)
                .build();

        sourcingSupplierRepository.save(supplier);
    }
}
