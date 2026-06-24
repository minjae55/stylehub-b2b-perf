package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.AdminManualAssignRequest;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierApproveRequest;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierResponse;
import kr.remerge.stylehub.domain.sourcing.service.SourcingAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sourcing")
@RequiredArgsConstructor
public class SourcingAdminController {

    private final SourcingAdminService sourcingAdminService;

    // SUGGESTED 목록 조회 (관리자 추천 대기 목록)
    @GetMapping("/{sourcingRequestId}/suppliers/suggested")
    public ResponseEntity<List<SourcingSupplierResponse>> getSuggestedSuppliers(
            @PathVariable Integer sourcingRequestId) {
        return ResponseEntity.ok(sourcingAdminService.getSuggestedSuppliers(sourcingRequestId));
    }

    // 관리자 승인 → RECOMMENDED
    @PatchMapping("/suppliers/{sourcingSupplierId}/approve")
    public ResponseEntity<Void> approve(
            @PathVariable Integer sourcingSupplierId,
            @RequestBody SourcingSupplierApproveRequest request) {
        sourcingAdminService.approve(sourcingSupplierId, request.getAdminId());
        return ResponseEntity.ok().build();
    }

    // 배정 안 된 소싱 요청 목록 조회
    // - sourcing_suppliers row 없거나 전부 DECLINED인 요청
    @GetMapping("/requests/unassigned")
    public ResponseEntity<List<SourcingSupplierResponse>> getUnassignedRequests() {
        return ResponseEntity.ok(sourcingAdminService.getUnassignedRequests());
    }

    // 수동 배정 → SUGGESTED로 추가
    @PostMapping("/requests/{sourcingRequestId}/assign")
    public ResponseEntity<Void> manualAssign(
            @PathVariable Integer sourcingRequestId,
            @RequestBody AdminManualAssignRequest request) {
        sourcingAdminService.manualAssign(sourcingRequestId, request.getCompanyId());
        return ResponseEntity.ok().build();
    }
}
