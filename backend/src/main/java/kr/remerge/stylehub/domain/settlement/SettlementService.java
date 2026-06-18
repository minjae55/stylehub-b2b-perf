package kr.remerge.stylehub.domain.settlement;

import kr.remerge.stylehub.domain.settlement.dto.SettlementDto;
import kr.remerge.stylehub.domain.settlement.entity.Settlement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;

    @Transactional
    public void saveSettlement(SettlementDto settlementDto) {
        // 2. DTO 데이터를 기반으로 Entity 객체 생성
        Settlement settlement = Settlement.builder()
                .companyId(settlementDto.getCompanyId())
                .amount(settlementDto.getAmount())
                .status("PENDING") // 초기 상태 값 등 비즈니스 로직 적용
                .build();

        // 3. Repository를 통해 DB에 저장
        settlementRepository.save(settlement);
    }
}