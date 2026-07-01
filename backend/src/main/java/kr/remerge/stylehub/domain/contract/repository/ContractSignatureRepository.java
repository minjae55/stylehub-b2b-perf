package kr.remerge.stylehub.domain.contract.repository;

import kr.remerge.stylehub.domain.contract.entity.ContractSignature;
import kr.remerge.stylehub.domain.contract.enumtype.SignerRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractSignatureRepository
        extends JpaRepository<ContractSignature, Integer> {

    boolean existsByContract_ContractIdAndSignerRole(
            Integer contractId,
            SignerRole signerRole
    );
}
