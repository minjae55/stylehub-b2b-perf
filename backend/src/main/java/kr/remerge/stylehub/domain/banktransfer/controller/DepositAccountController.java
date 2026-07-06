package kr.remerge.stylehub.domain.banktransfer.controller;

import kr.remerge.stylehub.domain.banktransfer.dto.DepositAccountResponse;
import kr.remerge.stylehub.domain.banktransfer.service.DepositAccountService;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deposit-accounts")
@RequiredArgsConstructor
public class DepositAccountController {

    private final DepositAccountService depositAccountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepositAccountResponse>>> getActiveAccounts() {
        return ResponseEntity.ok(ApiResponse.success(depositAccountService.getActiveAccounts()));
    }
}