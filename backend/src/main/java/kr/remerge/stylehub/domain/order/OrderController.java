package kr.remerge.stylehub.domain.order;

import kr.remerge.stylehub.domain.order.dto.*;
import kr.remerge.stylehub.domain.order.service.OrderService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuyerOrderListResponse>>> getOrderList(
            @LoginUser AuthUser authUser
    ) {

        List<BuyerOrderListResponse> orders =
                orderService.getOrderList(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<BuyerOrderOverviewResponse>> getOrderOverview(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {

        BuyerOrderOverviewResponse overviewResponse =
                orderService.getOrderOverview(authUser.userId(), orderId);

        return ResponseEntity.ok(ApiResponse.success(overviewResponse));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderCreateResponse>> createOrder(
            @LoginUser AuthUser authUser,
            @RequestBody OrderCreateRequest request
            ) {

        OrderCreateResponse orderCreateResponse =
                orderService.createOrder(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(orderCreateResponse));
    }

    @GetMapping("/{orderId}/detail")
    public ResponseEntity<ApiResponse<BuyerOrderDetailResponse>> getOrderDetail(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {
        BuyerOrderDetailResponse response =
                orderService.getOrderDetail(authUser.userId(), orderId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
