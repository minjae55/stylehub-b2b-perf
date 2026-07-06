package kr.remerge.stylehub.domain.deliveryTracker.repository;

import kr.remerge.stylehub.domain.deliveryTracker.entity.DeliveryTrackingStatus;
import kr.remerge.stylehub.domain.deliveryTracker.enumtype.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DeliveryTrackingStatusRepository extends JpaRepository<DeliveryTrackingStatus, Integer> {
    Optional<DeliveryTrackingStatus> findByOrderId(Integer orderId);

    // 스케줄러용: 아직 종결(배송완료/만료)되지 않은 배송 건만 조회
    List<DeliveryTrackingStatus> findByLastStatusNotIn(Collection<DeliveryStatus> statuses);
}