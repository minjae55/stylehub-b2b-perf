package kr.remerge.stylehub.domain.banktransfer.repository;

import kr.remerge.stylehub.domain.banktransfer.entity.BankTransferPayment;
import kr.remerge.stylehub.domain.banktransfer.enums.BankTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BankTransferPaymentRepository extends JpaRepository<BankTransferPayment, Long> {
    @Query("SELECT b FROM BankTransferPayment b JOIN b.orderIds oid WHERE oid = :orderId")
    Optional<BankTransferPayment> findByOrderId(@Param("orderId") Integer orderId);
    List<BankTransferPayment> findByStatus(BankTransferStatus status);
}
