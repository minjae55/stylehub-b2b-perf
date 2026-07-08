package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingBoardResponse;
import kr.remerge.stylehub.domain.sourcing.service.BuyerSourcingService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sourcing/buyer")
@RequiredArgsConstructor
public class BuyerSourcingController {

    private final BuyerSourcingService buyerSourcingService;

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<BuyerSourcingBoardResponse>> getBuyerRequests(
            @RequestParam String type,
            @RequestParam(required = false) String status,
            @LoginUser AuthUser user
    ) {
        BuyerSourcingBoardResponse response =
                buyerSourcingService.getBuyerSourcingBoard(
                        user.companyId(), user.userId(), user.role(), type, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/requests/{sourcingRequestId}/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @LoginUser AuthUser user,
            @PathVariable Integer sourcingRequestId
    ) {
        buyerSourcingService.withdraw(sourcingRequestId, user.userId(), user.companyId(), user.role());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}