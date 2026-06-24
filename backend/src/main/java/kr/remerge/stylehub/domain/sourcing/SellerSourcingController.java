package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.SellerDeclineRequest;
import kr.remerge.stylehub.domain.sourcing.dto.SellerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.service.SellerSourcingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sourcing/seller")
@RequiredArgsConstructor
public class SellerSourcingController {

    private final SellerSourcingService sellerSourcingService;

    // current: RECOMMENDED / my: QUOTED
    @GetMapping("/requests")
    public ResponseEntity<List<SellerSourcingResponse>> getSellerRequests(
            @RequestParam String type,
            @RequestParam(defaultValue = "RECOMMENDED") SourcingSupplierStatus status
    ) {
        return ResponseEntity.ok(sellerSourcingService.getSellerRequests(type, status));
    }

    // past: DECLINED + EXPIRED
    @GetMapping("/requests/past")
    public ResponseEntity<List<SellerSourcingResponse>> getSellerPastRequests(
            @RequestParam String type
    ) {
        return ResponseEntity.ok(sellerSourcingService.getSellerPastRequests(type));
    }

    // 거절
    @PatchMapping("/suppliers/{sourcingSupplierId}/decline")
    public ResponseEntity<Void> decline(
            @PathVariable Integer sourcingSupplierId,
            @RequestBody SellerDeclineRequest request
    ) {
        sellerSourcingService.decline(sourcingSupplierId, request.getFeedback());
        return ResponseEntity.ok().build();
    }
}
