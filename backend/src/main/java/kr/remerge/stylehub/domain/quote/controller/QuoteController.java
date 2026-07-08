package kr.remerge.stylehub.domain.quote.controller;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateRequest;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateResponse;
import kr.remerge.stylehub.domain.quote.dto.QuoteDetailResponse;
import kr.remerge.stylehub.domain.quote.dto.QuoteStatusUpdateRequest;
import kr.remerge.stylehub.domain.quote.service.QuoteService;
import kr.remerge.stylehub.domain.quote.service.QuoteStatusService;
import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestSellerDetailResponse;
import kr.remerge.stylehub.domain.sourcing.service.SourcingRequestSellerDetailService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteService quoteService;
    private final QuoteStatusService quoteStatusService;
    private final SourcingRequestSellerDetailService sourcingRequestSellerDetailService;

    @GetMapping("/init/{sourcingRequestId}")
    public ResponseEntity<ApiResponse<SourcingRequestSellerDetailResponse>> getQuoteInit(
            @LoginUser AuthUser authUser,
            @PathVariable Integer sourcingRequestId
    ) {
        SourcingRequestSellerDetailResponse response = sourcingRequestSellerDetailService
                .getSellerSourcingDetail(sourcingRequestId, authUser.companyId(), authUser.userId(), authUser.role());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(
            value = "/{quoteId}/pdf",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> getQuotePdf(
            @LoginUser AuthUser authUser,
            @PathVariable Integer quoteId
    ) {
        byte[] pdfBytes = quoteService.generateQuotePdf(
                authUser.userId(),
                quoteId
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename("quote-" + quoteId + ".pdf")
                                .build()
                                .toString()
                )
                .body(pdfBytes);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuoteCreateResponse>> createQuote(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody QuoteCreateRequest request
    ) {

        QuoteCreateResponse quote = quoteService.createQuote(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(quote));
    }

    @GetMapping("/{quoteId}")
    public ResponseEntity<ApiResponse<QuoteDetailResponse>> getQuoteDetail(
            @LoginUser AuthUser authUser,
            @PathVariable Integer quoteId
    ) {
        QuoteDetailResponse quoteDetail
                = quoteService.getQuoteDetail(
                authUser.userId(),
                quoteId
        );
        return ResponseEntity.ok(ApiResponse.success(quoteDetail));
    }

    @PatchMapping("/{quoteId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @LoginUser AuthUser authUser,
            @PathVariable Integer quoteId,
            @Valid @RequestBody QuoteStatusUpdateRequest request
    ) {

        quoteStatusService.updateStatus(
                authUser.userId(),
                quoteId,
                request.status()
        );

         return ResponseEntity.ok(ApiResponse.success(null));
    }



}
