package kr.remerge.stylehub.domain.sourcing.repository;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourcingRequestFileRepository extends JpaRepository<SourcingRequestFile, Integer> {
    List<SourcingRequestFile> findBySourcingRequest_SourcingRequestId(Integer sourcingRequestId);
}
