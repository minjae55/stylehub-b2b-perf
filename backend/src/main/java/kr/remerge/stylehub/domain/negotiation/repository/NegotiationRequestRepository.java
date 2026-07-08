package kr.remerge.stylehub.domain.negotiation.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
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

    // 💡 최신 5개 협의방의 가장 마지막 메시지(buyerRequest)들을 단 1번의 쿼리로 모아오는 최적화 쿼리
    @Query("""
            SELECT nr FROM NegotiationRequest nr
            JOIN FETCH nr.negotiation n
            WHERE nr.negotiation.negotiationId IN :negotiationIds
              AND nr.createdAt = (
                  SELECT MAX(sub.createdAt) 
                  FROM NegotiationRequest sub 
                  WHERE sub.negotiation.negotiationId = n.negotiationId
              )
            """)
    List<NegotiationRequest> findLatestRequestsByNegotiationIds(@Param("negotiationIds") Collection<Integer> negotiationIds);
}
