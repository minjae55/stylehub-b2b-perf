package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.BuyerSourcingResponse;
import kr.remerge.stylehub.domain.sourcing.service.BuyerSourcingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sourcing/buyer")
@RequiredArgsConstructor
public class BuyerSourcingController {

    private final BuyerSourcingService buyerSourcingService;

    // 회사 단위 소싱 요청 리스트
    @GetMapping("/requests")
    public ResponseEntity<List<BuyerSourcingResponse>> getBuyerRequests(
            @RequestParam String type
    ) {
        return ResponseEntity.ok(buyerSourcingService.getBuyerRequests(type));
    }

    // buyer 직접 취소 → WITHDRAWN
    @PatchMapping("/requests/{sourcingRequestId}/withdraw")
    public ResponseEntity<Void> withdraw(@PathVariable Integer sourcingRequestId) {
        buyerSourcingService.withdraw(sourcingRequestId);
        return ResponseEntity.ok().build();
    }
}
