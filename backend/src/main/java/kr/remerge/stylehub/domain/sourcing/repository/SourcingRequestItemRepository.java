package kr.remerge.stylehub.domain.sourcing.repository;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourcingRequestItemRepository extends JpaRepository<SourcingRequestItem, Integer> {
    List<SourcingRequestItem> findBySourcingRequest_SourcingRequestId(Integer sourcingRequestId);
}
