package kr.remerge.stylehub.domain.deliveryTracker;

import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryTrackingController {

    private final DeliveryTrackingService trackingService;

    public DeliveryTrackingController(DeliveryTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /**
     * 배송 추적 조회
     * GET /api/delivery/track?carrierId=kr.cjlogistics&trackingNumber=123456789
     */
    @GetMapping("/track")
    public ResponseEntity<DeliveryTrackingDto.TrackingResponse> track(
            @RequestParam String carrierId,
            @RequestParam String trackingNumber
    ) {
        DeliveryTrackingDto.TrackingResponse result = trackingService.getTrackingInfo(carrierId, trackingNumber);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<DeliveryTrackingDto.TrackingResponse>>
    getOrderTracking(
            @LoginUser AuthUser authUser,
            @PathVariable Integer orderId
    ) {
        DeliveryTrackingDto.TrackingResponse response =
                trackingService.getOrderTracking(
                        authUser.userId(),
                        orderId
                );

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
    }
}
