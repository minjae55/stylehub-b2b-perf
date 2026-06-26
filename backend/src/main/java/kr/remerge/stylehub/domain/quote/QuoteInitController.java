package kr.remerge.stylehub.domain.quote;

import kr.remerge.stylehub.domain.quote.dto.QuoteInitResponse;
import kr.remerge.stylehub.domain.quote.service.QuoteInitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sourcing-requests")
@RequiredArgsConstructor
public class QuoteInitController {

    private final QuoteInitService quoteInitService;

    /**
     * 셀러 견적 작성 화면 진입 시 소싱 요청 기본 정보 조회
     * GET /api/sourcing-requests/{sourcingId}/quote-init
     */
    @GetMapping("/{sourcingId}/quote-init")
    public ResponseEntity<QuoteInitResponse> getQuoteInit(@PathVariable Integer sourcingId) {
        return ResponseEntity.ok(quoteInitService.getQuoteInit(sourcingId));
    }
}
