package kr.remerge.stylehub.domain.banktransfer.controller;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.banktransfer.dto.CreateBankTransferRequest;
import kr.remerge.stylehub.domain.banktransfer.service.BankTransferPaymentService;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bank-transfer-payments")
@RequiredArgsConstructor
public class BankTransferPaymentController {

    private final BankTransferPaymentService bankTransferPaymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createBankTransferPayment(
            @Valid @RequestBody CreateBankTransferRequest request
    ) {
        bankTransferPaymentService.create(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}