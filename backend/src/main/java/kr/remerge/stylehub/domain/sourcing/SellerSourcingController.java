package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.SellerDeclineRequest;
import kr.remerge.stylehub.domain.sourcing.dto.SellerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestSellerDetailResponse;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.service.SellerSourcingService;
import kr.remerge.stylehub.domain.sourcing.service.SourcingRequestSellerDetailService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sourcing/seller")
public class SellerSourcingController {

    private final SellerSourcingService sellerSourcingService;
    private final SourcingRequestSellerDetailService sourcingRequestSellerDetailService;

    // current: RECOMMENDED / my: QUOTED
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<SellerSourcingResponse>>> getSellerRequests(
            @LoginUser AuthUser authUser,
            @RequestParam String type,
            @RequestParam(defaultValue = "RECOMMENDED") SourcingSupplierStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerSourcingService.getSellerRequests(
                        authUser.companyId(), type, status, authUser.userId(), authUser.role())));
    }

    // past: DECLINED + EXPIRED
    @GetMapping("/requests/past")
    public ResponseEntity<ApiResponse<List<SellerSourcingResponse>>> getSellerPastRequests(
            @LoginUser AuthUser authUser,
            @RequestParam String type
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerSourcingService.getSellerPastRequests(
                        authUser.companyId(), type, authUser.userId(), authUser.role())));
    }

    // 셀러용 소싱 요청 상세 조회 (다른 회사 견적은 포함하지 않음)
    @GetMapping("/requests/{sourcingRequestId}")
    public ResponseEntity<ApiResponse<SourcingRequestSellerDetailResponse>> getSellerSourcingDetail(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingRequestId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sourcingRequestSellerDetailService.getSellerSourcingDetail(
                        sourcingRequestId, authUser.companyId(), authUser.userId(), authUser.role())));
    }

    // 거절
    @PatchMapping("/suppliers/{sourcingSupplierId}/decline")
    public ResponseEntity<ApiResponse<Void>> decline(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingSupplierId,
            @RequestBody SellerDeclineRequest request
    ) {
        sellerSourcingService.decline(sourcingSupplierId, authUser.companyId(), request.getFeedback());
        return ResponseEntity.ok(ApiResponse.success());
    }

    // completed: 견적이 승인(APPROVED)된 요청
    @GetMapping("/requests/completed")
    public ResponseEntity<ApiResponse<List<SellerSourcingResponse>>> getSellerCompletedRequests(
            @LoginUser AuthUser authUser,
            @RequestParam String type
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerSourcingService.getSellerCompletedRequests(
                        authUser.companyId(), type, authUser.userId(), authUser.role())));
    }
}