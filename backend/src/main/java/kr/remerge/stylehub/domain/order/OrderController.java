package kr.remerge.stylehub.domain.order;

import kr.remerge.stylehub.domain.order.dto.OrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.service.OrderService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
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
    public ResponseEntity<ApiResponse<?>> getOrderList(
            @LoginUser AuthUser authUser
    ) {

        List<Order> orderList =  orderService.getOrderList(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success());
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

}
