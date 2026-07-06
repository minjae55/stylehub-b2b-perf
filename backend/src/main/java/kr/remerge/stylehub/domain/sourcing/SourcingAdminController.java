package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.AdminSourcingRequestResponse;
import kr.remerge.stylehub.domain.sourcing.dto.AdminSourcingStatsResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingReviewQueueResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierRejectRequest;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingSupplierResponse;
import kr.remerge.stylehub.domain.sourcing.service.SourcingAdminService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sourcing")
@RequiredArgsConstructor
public class SourcingAdminController {

    private final SourcingAdminService sourcingAdminService;

    // ───────────────────────────────────────────
    // 전체 소싱 요청 현황 (회사 무관)
    // ───────────────────────────────────────────

    // 전체 소싱 요청 목록 — filter: ALL(기본)/ACTIVE/TRADING/COMPLETED/CLOSED
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<AdminSourcingRequestResponse>>> getAllRequests(
            @LoginUser AuthUser authUser,
            @RequestParam(required = false) String filter
    ) {
        List<AdminSourcingRequestResponse> response = sourcingAdminService.getAllRequests(filter);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 전체 소싱 요청 그룹별 통계
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminSourcingStatsResponse>> getStats(
            @LoginUser AuthUser authUser
    ) {
        AdminSourcingStatsResponse response = sourcingAdminService.getStats();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ───────────────────────────────────────────
    // 공급사 배정 승인 대기 큐
    // ───────────────────────────────────────────

    @GetMapping("/review-queue")
    public ResponseEntity<ApiResponse<List<SourcingReviewQueueResponse>>> getReviewQueue(
            @LoginUser AuthUser authUser
    ) {
        List<SourcingReviewQueueResponse> response = sourcingAdminService.getReviewQueue();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{sourcingRequestId}/suppliers/suggested")
    public ResponseEntity<ApiResponse<List<SourcingSupplierResponse>>> getSuggestedSuppliers(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingRequestId
    ) {
        List<SourcingSupplierResponse> response =
                sourcingAdminService.getSuggestedSuppliers(sourcingRequestId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/suppliers/{sourcingSupplierId}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingSupplierId
    ) {
        sourcingAdminService.approve(sourcingSupplierId, authUser.userId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/suppliers/{sourcingSupplierId}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingSupplierId,
            @RequestBody SourcingSupplierRejectRequest request
    ) {
        sourcingAdminService.reject(sourcingSupplierId, authUser.userId(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<ApiResponse<List<SourcingSupplierResponse>>> getUnassignedRequests(
            @LoginUser AuthUser authUser
    ) {
        List<SourcingSupplierResponse> response =
                sourcingAdminService.getUnassignedRequests();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sourcingRequestId}/suppliers")
    public ResponseEntity<ApiResponse<Void>> manualAssign(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingRequestId,
            @RequestParam Integer companyId
    ) {
        sourcingAdminService.manualAssign(sourcingRequestId, companyId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}