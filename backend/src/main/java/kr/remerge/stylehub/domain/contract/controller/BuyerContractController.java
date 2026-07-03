package kr.remerge.stylehub.domain.contract.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.contract.dto.BuyerContractDetailResponse;
import kr.remerge.stylehub.domain.contract.dto.BuyerContractSignRequest;
import kr.remerge.stylehub.domain.contract.service.BuyerContractService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buyer/contracts")
@RequiredArgsConstructor
public class BuyerContractController {

    private final BuyerContractService buyerContractService;

    @GetMapping("/{contractId}")
    public ResponseEntity<ApiResponse<BuyerContractDetailResponse>> getContract(
            @LoginUser AuthUser authUser,
            @PathVariable Integer contractId
    ) {
        BuyerContractDetailResponse response =  buyerContractService.getContract(
                authUser.userId(),
                contractId
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{contractId}/sign")
    public ResponseEntity<ApiResponse<Void>> signContract(
            @LoginUser AuthUser authUser,
            @PathVariable Integer contractId,
            @Valid @RequestBody BuyerContractSignRequest request,
            HttpServletRequest httpRequest
    ) {
        buyerContractService.signContract(
                authUser.userId(),
                contractId,
                request,
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
        );

        return ResponseEntity.ok(ApiResponse.success());
    }
}
