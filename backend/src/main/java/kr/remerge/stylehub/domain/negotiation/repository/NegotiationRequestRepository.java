package kr.remerge.stylehub.domain.negotiation.repository;

import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NegotiationRequestRepository
        extends JpaRepository<NegotiationRequest, Integer> {

    List<NegotiationRequest>
    findByNegotiation_NegotiationIdInOrderByCreatedAtDesc(
            List<Integer> negotiationIds
    );

    List<NegotiationRequest>
    findByNegotiation_NegotiationIdOrderByCreatedAtAsc(
            Integer negotiationId
    );

    // 견적 협의 + 계약 협의처럼 연결된 여러 Negotiation의 이력을 하나의 시간순
    // 대화로 합쳐서 보여주기 위한 조회.
    List<NegotiationRequest>
    findByNegotiation_NegotiationIdInOrderByCreatedAtAsc(
            List<Integer> negotiationIds
    );

    // 이 협의 스레드의 가장 최근 요청. 새 라운드를 시작할 때 "현재 기준 견적"이
    // 원본이 아니라 직전 라운드에서 갱신된 최신 버전이 되도록 하기 위해 사용한다.
    Optional<NegotiationRequest>
    findFirstByNegotiation_NegotiationIdOrderByCreatedAtDesc(
            Integer negotiationId
    );
}
