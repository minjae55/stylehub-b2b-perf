package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.company.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Integer> {
}
