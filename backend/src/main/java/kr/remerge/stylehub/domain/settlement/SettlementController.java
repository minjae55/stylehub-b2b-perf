package kr.remerge.stylehub.domain.settlement;

import kr.remerge.stylehub.domain.settlement.dto.SettlementDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.*;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<Void> createSettlement(@RequestBody SettlementDto settlementDto) {
        // 1. Controller에서 DTO로 데이터를 바인딩 받아 Service로 토스
        settlementService.saveSettlement(settlementDto);
        return ResponseEntity.ok().build();
    }
}
