package kr.remerge.stylehub.domain.order.controller;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.order.dto.OrderCancelRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateResponse;
import kr.remerge.stylehub.domain.order.dto.contract.ContractOrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.contract.ContractOrderCreateResponse;
import kr.remerge.stylehub.domain.order.dto.sample.SampleOrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.sample.SampleOrderCreateResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderDetailResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderListResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderOverviewResponse;
import kr.remerge.stylehub.domain.order.service.BuyerOrderService;
import kr.remerge.stylehub.domain.order.service.ContractOrderService;
import kr.remerge.stylehub.domain.order.service.OrderCancellationService;
import kr.remerge.stylehub.domain.order.service.SampleOrderService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/buyer/orders")
@RequiredArgsConstructor
public class BuyerOrderController {

    private final BuyerOrderService buyerOrderService;
    private final SampleOrderService sampleOrderService;
    private final ContractOrderService contractOrderService;
    private final OrderCancellationService orderCancellationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuyerOrderListResponse>>> getOrderList(
            @LoginUser AuthUser authUser
    ) {

        List<BuyerOrderListResponse> orders =
                buyerOrderService.geyBuyerOrderList(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<BuyerOrderOverviewResponse>> getOrderOverview(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {

        BuyerOrderOverviewResponse overviewResponse =
                buyerOrderService.getOrderOverview(authUser.userId(), orderId);

        return ResponseEntity.ok(ApiResponse.success(overviewResponse));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderCreateResponse>> createOrder(
            @LoginUser AuthUser authUser,
            @RequestBody OrderCreateRequest request
            ) {

        OrderCreateResponse orderCreateResponse =
                buyerOrderService.createOrder(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(orderCreateResponse));
    }

    @PostMapping("/contract")
    public ResponseEntity<ApiResponse<ContractOrderCreateResponse>>
    createContractOrder(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody ContractOrderCreateRequest request
    ) {
        ContractOrderCreateResponse response =
                contractOrderService.createOrder(
                        authUser.userId(),
                        request
                );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{orderId}/detail")
    public ResponseEntity<ApiResponse<BuyerOrderDetailResponse>> getOrderDetail(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {
        BuyerOrderDetailResponse response =
                buyerOrderService.getOrderDetail(authUser.userId(), orderId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/{orderId}/receipt", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadReceipt(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {

        byte[] pdfBytes =
                buyerOrderService.generateReceiptPdf(authUser.userId(), orderId);

        ContentDisposition disposition = ContentDisposition
                .attachment()
                .filename("order-receipt-" + orderId + ".pdf", StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PostMapping("/sample")
    public ResponseEntity<ApiResponse<SampleOrderCreateResponse>> createSampleOrder(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody SampleOrderCreateRequest request
    ) {

        SampleOrderCreateResponse response =
                sampleOrderService.createSampleOrder(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId,
            @Valid @RequestBody OrderCancelRequest request
    ) {

        orderCancellationService.cancelOrder(
                authUser.userId(),
                orderId,
                request
        );

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{orderId}/complete")
    public ResponseEntity<ApiResponse<Void>> completeOrder(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {

        buyerOrderService.confirmOrder(
                authUser.userId(),
                orderId
        );

        return ResponseEntity.ok(ApiResponse.success(null));
    }

}