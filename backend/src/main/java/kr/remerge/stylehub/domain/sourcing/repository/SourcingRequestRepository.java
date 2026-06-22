package kr.remerge.stylehub.domain.sourcing.repository;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourcingRequestRepository extends JpaRepository<SourcingRequest, Integer> {
}