package kr.remerge.stylehub.domain.contract.repository;

import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractItemRepository extends JpaRepository<ContractItem, Integer> {

    List<ContractItem> findByContract_ContractIdOrderByContractItemIdAsc(
            Integer contractId
    );
}
