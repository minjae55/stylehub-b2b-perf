package kr.remerge.stylehub.domain.company.repository;

import kr.remerge.stylehub.domain.address.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Integer> {

    @Query("""
        SELECT a
        FROM Address a
        WHERE a.addressId = :addressId
         and a.company.companyId = :companyId
         and a.deletedAt is null
    """)
    Optional<Address> findActiveCompanyAddress(@Param("addressId") Integer addressId, @Param("companyId") Integer companyId);
}
