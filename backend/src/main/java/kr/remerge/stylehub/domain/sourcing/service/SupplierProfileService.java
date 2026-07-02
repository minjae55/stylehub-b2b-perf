package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SupplierProfileResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SupplierProfileUpdateRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SupplierProfile;
import kr.remerge.stylehub.domain.sourcing.repository.SupplierProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierProfileService {

    private final SupplierProfileRepository supplierProfileRepository;

    // 아직 설정한 적 없는 셀러는 프로필 행 자체가 없을 수 있음 -> 기본값(NONE, 자동배정 OFF)으로 응답
    @Transactional(readOnly = true)
    public SupplierProfileResponse getProfile(Integer companyId) {
        SupplierProfile profile = supplierProfileRepository.findById(companyId)
                .orElseGet(() -> SupplierProfile.createDefault(companyId));
        return SupplierProfileResponse.from(profile);
    }

    @Transactional
    public SupplierProfileResponse updateProfile(Integer companyId, SupplierProfileUpdateRequest request) {
        SupplierProfile profile = supplierProfileRepository.findById(companyId)
                .orElseGet(() -> SupplierProfile.createDefault(companyId));

        profile.changeSourcingType(request.getSourcingType());
        profile.toggleAutoAssign(request.isAutoAssignEnabled());

        SupplierProfile saved = supplierProfileRepository.save(profile);
        return SupplierProfileResponse.from(saved);
    }
}
