package kr.remerge.stylehub.domain.dashboard;

import kr.remerge.stylehub.domain.dashboard.dto.buyer.*;
import kr.remerge.stylehub.domain.dashboard.dto.seller.*;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // =================================================================
    // ── BUYER DASHBOARD APIS (바이어 대시보드 탭 리스트 - 총 7개) ──
    // =================================================================

    /**
     * [바이어 1] 소싱 요청 목록 조회
     * GET /api/dashboard/sourcing-requests/buyer?status=PENDING,QUOTED,NEGOTIATING
     */
    @GetMapping("/sourcing-requests/buyer")
    public ResponseEntity<ApiResponse<BuyerSourcingDashboardListResponse>> getBuyerSourcingRequests(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING,QUOTED,NEGOTIATING") String status
    ) {
        // 💡 서비스 레이어에서 묶음 객체(Record)를 반환하므로 타입을 일치시켜 줍니다.
        BuyerSourcingDashboardListResponse data = dashboardService.getBuyerSourcingDashboardList(
                authUser.companyId(), authUser.userId(), authUser.role(), status);

        return ResponseEntity.ok(ApiResponse.success(data));
    }
    /**
     * [바이어 2] 받은 견적 내역 조회
     * GET /api/dashboard/quotes/buyer?status=SUBMITTED
     */
    @GetMapping("/quotes/buyer")
    public ResponseEntity<ApiResponse<BuyerQuoteDashboardListResponse>> getBuyerReceivedQuotes(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING,QUOTED,NEGOTIATING") String status
    ) {
        BuyerQuoteDashboardListResponse data = dashboardService.getBuyerReceivedQuotes(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [바이어 3] 협의 진행중 내역 조회
     * GET /api/dashboard/negotiations/buyer?status=OPEN
     */
    @GetMapping("/negotiations/buyer")
    public ResponseEntity<ApiResponse<BuyerNegotiationDashboardListResponse>> getBuyerNegotiations(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "OPEN") String status
    ) {
        BuyerNegotiationDashboardListResponse data = dashboardService.getBuyerNegotiations(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    /**
     * [바이어 4 & 5] 결제 대기 및 배송 중 주문 목록 조회 (상태값 분기)
     * GET /api/dashboard/orders/buyer?status=PENDING
     * GET /api/dashboard/orders/buyer?status=SHIPPED
     */
    @GetMapping("/orders/buyer")
    public ResponseEntity<ApiResponse<BuyerOrderDashboardListResponse>> getBuyerOrders(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status
    ) {
        BuyerOrderDashboardListResponse data = dashboardService.getBuyerOrders(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [바이어 6] 이의제기 진행 내역 조회
     * GET /api/dashboard/disputes/buyer?status=RECEIVED,UNDER_REVIEW
     */
    @GetMapping("/disputes/buyer")
    public ResponseEntity<ApiResponse<List<BuyerDisputeDashboardResponse>>> getBuyerActiveDisputes(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "RECEIVED,UNDER_REVIEW") String status
    ) {
        List<BuyerDisputeDashboardResponse> data = dashboardService.getBuyerActiveDisputes(authUser.userId(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [바이어 7] 자동확정 임박 건 조회
     * GET /api/dashboard/orders/buyer/urgent-receipts
     */
    @GetMapping("/orders/buyer/urgent-receipts")
    public ResponseEntity<ApiResponse<List<UrgentReceiptDashboardResponse>>> getBuyerUrgentReceipts(
            @LoginUser AuthUser authUser
    ) {
        List<UrgentReceiptDashboardResponse> data = dashboardService.getBuyerUrgentReceipts(authUser.userId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }


    // =================================================================
    // ── SELLER DASHBOARD APIS (셀러 대시보드 탭 리스트 - 총 7개) ──
    // =================================================================

    /**
     * [셀러 1] 신규 소싱 요청 피드 조회
     */
    @GetMapping("/sourcing-requests/seller")
    public ResponseEntity<ApiResponse<List<SellerSourcingFeedResponse>>> getSellerNewSourcingRequests(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status
    ) {
        List<SellerSourcingFeedResponse> data = dashboardService.getSellerSourcingFeedList(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [셀러 2] 작성 중이거나 마감 임박인 견적서 조회
     */
    @GetMapping("/quotes/seller")
    public ResponseEntity<ApiResponse<List<QuoteDraftDashboardResponse>>> getSellerQuoteDrafts(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "DRAFT") String status
    ) {
        List<QuoteDraftDashboardResponse> data = dashboardService.getSellerQuoteDrafts(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [셀러 3] 대화 및 협의 목록 조회
     */
    @GetMapping("/negotiations/seller")
    public ResponseEntity<ApiResponse<List<SellerNegotiationDashboardResponse>>> getSellerNegotiations(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "OPEN") String status
    ) {
        // 💡 파라미터 매치 컴파일 오류 교정
        List<SellerNegotiationDashboardResponse> data = dashboardService.getSellerNegotiations(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [셀러 4 & 5] 출고 대기 및 배송 흐름 목록 조회
     */
    @GetMapping("/orders/seller")
    public ResponseEntity<ApiResponse<List<SellerShipmentDashboardResponse>>> getSellerOrders(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PREPARING") String status
    ) {
        // 💡 파라미터 매치 컴파일 오류 교정
        List<SellerShipmentDashboardResponse> data = dashboardService.getSellerOrders(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [셀러 6] 구매자가 제기한 클레임 분쟁 건 조회
     */
    @GetMapping("/disputes/seller")
    public ResponseEntity<ApiResponse<List<SellerDisputeDashboardResponse>>> getSellerActiveDisputes(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "RECEIVED") String status
    ) {
        // 💡 파라미터 매치 컴파일 오류 교정
        List<SellerDisputeDashboardResponse> data = dashboardService.getSellerActiveDisputes(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * [셀러 7] 정산 예정 내역 조회
     */
    @GetMapping("/settlements/seller")
    public ResponseEntity<ApiResponse<List<SellerSettlementDashboardResponse>>> getSellerPendingSettlements(
            @LoginUser AuthUser authUser,
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status
    ) {
        // 💡 파라미터 매치 컴파일 오류 교정
        List<SellerSettlementDashboardResponse> data = dashboardService.getSellerPendingSettlements(
                authUser.companyId(), authUser.userId(), authUser.role(), status);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
