package kr.remerge.stylehub.domain.address;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Integer> {

    /**
     * 1. 회사별 삭제되지 않은 전체 주소록 목록 조회
     * 서비스의 getCompanyAddresses에서 사용
     */
    List<Address> findByCompany_CompanyIdAndDeletedAtIsNull(Integer companyId);

    /**
     * 2. 특정 주소 ID로 삭제되지 않은 주소 조회 (단건)
     * 서비스의 updateAddress, deleteAddress, updateDefaultAddress에서 사용
     */
    Optional<Address> findByAddressIdAndDeletedAtIsNull(Integer addressId);

    @Query("""
        SELECT a
        FROM Address a
        WHERE a.addressId = :addressId
         and a.company.companyId = :companyId
         and a.deletedAt is null
    """)
    Optional<Address> findActiveCompanyAddress(@Param("addressId") Integer addressId, @Param("companyId") Integer companyId);
}
