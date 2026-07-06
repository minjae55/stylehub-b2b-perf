package kr.remerge.stylehub.domain.banktransfer.controller;

import kr.remerge.stylehub.domain.banktransfer.dto.WaitingDepositResponse;
import kr.remerge.stylehub.domain.banktransfer.service.BankTransferPaymentService;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/bank-transfer-payments")
@RequiredArgsConstructor
public class AdminBankTransferController {

    private final BankTransferPaymentService bankTransferPaymentService;

    @GetMapping("/waiting")
    public ResponseEntity<ApiResponse<List<WaitingDepositResponse>>> getWaitingDeposits() {
        return ResponseEntity.ok(ApiResponse.success(bankTransferPaymentService.getWaitingDeposits()));
    }

    @PostMapping("/{bankTransferPaymentId}/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmDeposit(@PathVariable Long bankTransferPaymentId) {
        bankTransferPaymentService.confirmDeposit(bankTransferPaymentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}