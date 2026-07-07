package kr.remerge.stylehub.domain.negotiation.repository;

import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NegotiationRepository extends JpaRepository<Negotiation, Integer> {

    List<Negotiation>
    findByBuyer_UserIdOrSeller_UserIdOrderByUpdatedAtDesc(
            Integer buyerId,
            Integer sellerId
    );

    // 같은 견적/계약 + 같은 바이어라면 이전 협의가 AGREED/CLOSED로 끝났더라도
    // 상태와 무관하게 항상 같은 행(Negotiation)을 재사용하기 위한 조회.
    // (셀러 협의관리 화면에서 한 건에 대한 협의 이력이 여러 행으로 쪼개지지 않도록 함)
    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyer_UserIdOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId
    );

    Optional<Negotiation>
    findFirstByContract_ContractIdAndBuyer_UserIdOrderByOpenedAtDesc(
            Integer contractId,
            Integer buyerId
    );

    // 같은 딜(같은 견적, 같은 바이어·셀러)의 다른 타입 협의를 찾기 위한 조회.
    // 견적 협의(QUOTE)와 계약 협의(CONTRACT)는 서로 다른 행이지만, 같은 딜이면
    // 화면에서 하나의 연속된 대화로 이어 보여주기 위해 짝을 찾을 때 쓴다.
    Optional<Negotiation>
    findFirstByQuote_QuoteIdAndBuyer_UserIdAndSeller_UserIdAndNegotiationTypeOrderByOpenedAtDesc(
            Integer quoteId,
            Integer buyerId,
            Integer sellerId,
            String negotiationType
    );
}
