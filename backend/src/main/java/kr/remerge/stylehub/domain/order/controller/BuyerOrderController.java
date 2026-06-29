package kr.remerge.stylehub.domain.order.controller;

import kr.remerge.stylehub.domain.order.dto.*;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderDetailResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderListResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderOverviewResponse;
import kr.remerge.stylehub.domain.order.service.BuyerOrderService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer/orders")
@RequiredArgsConstructor
public class BuyerOrderController {

    private final BuyerOrderService buyerOrderService;

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

    @GetMapping("/{orderId}/detail")
    public ResponseEntity<ApiResponse<BuyerOrderDetailResponse>> getOrderDetail(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {
        BuyerOrderDetailResponse response =
                buyerOrderService.getOrderDetail(authUser.userId(), orderId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
