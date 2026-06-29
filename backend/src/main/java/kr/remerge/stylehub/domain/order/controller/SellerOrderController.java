package kr.remerge.stylehub.domain.order.controller;


import kr.remerge.stylehub.domain.order.dto.seller.SellerOrderListResponse;
import kr.remerge.stylehub.domain.order.service.SellerOrderService;
import kr.remerge.stylehub.global.auth.dto.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {

    private final SellerOrderService sellerOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerOrderListResponse>>> getOrderList(
            @LoginUser AuthUser authUser
            ) {

        List<SellerOrderListResponse> orderList = sellerOrderService.getSellerOrderList(authUser.userId());

        return ResponseEntity.ok(ApiResponse.success(orderList));
    }

}
