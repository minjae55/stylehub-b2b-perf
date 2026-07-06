package kr.remerge.stylehub.domain.deliveryTracker.service;

import kr.remerge.stylehub.domain.deliveryTracker.DeliveryTrackingDto;
import kr.remerge.stylehub.domain.deliveryTracker.DeliveryTrackingService;
import kr.remerge.stylehub.domain.deliveryTracker.dto.DeliveryRegisterRequest;
import kr.remerge.stylehub.domain.deliveryTracker.dto.DeliveryTrackingResponse;
import kr.remerge.stylehub.domain.deliveryTracker.entity.DeliveryTrackingStatus;
import kr.remerge.stylehub.domain.deliveryTracker.enumtype.DeliveryStatus;
import kr.remerge.stylehub.domain.deliveryTracker.repository.DeliveryTrackingStatusRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderProcessStep;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryTrackingStatusService {

    private final DeliveryTrackingStatusRepository deliveryTrackingStatusRepository;
    private final DeliveryTrackingService deliveryTrackingService;
    private final OrderRepository orderRepository;
    private final OrderLogRepository orderLogRepository;

    // 운송장 등록 — 셀러가 호출
    @Transactional
    public void register(Integer requestingCompanyId, DeliveryRegisterRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 셀러 본인 회사 주문인지 검증
        if (!Objects.equals(order.getSellerCompany().getCompanyId(), requestingCompanyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // order 엔티티에 carrier/trackingNumber 기록 + shippedAt 자동 세팅
        order.registerShipment(request.carrierName(), request.trackingNumber());
        order.changeStatus(OrderStatus.SHIPPED);

        // delivery_tracking_status upsert (재등록 시 기존 행 갱신)
        DeliveryTrackingStatus existing = deliveryTrackingStatusRepository
                .findByOrderId(request.orderId())
                .orElse(null);

        DeliveryTrackingStatus tracking;
        if (existing != null) {
            tracking = DeliveryTrackingStatus.builder()
                    .id(existing.getId())
                    .orderId(request.orderId())
                    .carrierId(request.carrierId())
                    .trackingNumber(request.trackingNumber())
                    .lastStatus(DeliveryStatus.REGISTERED)
                    .lastDescription("운송장이 등록되었습니다.")
                    .lastLocation(null)
                    .lastEventTime(null)
                    .syncedAt(LocalDateTime.now())
                    .createdAt(existing.getCreatedAt())
                    .build();
        } else {
            tracking = DeliveryTrackingStatus.builder()
                    .orderId(request.orderId())
                    .carrierId(request.carrierId())
                    .trackingNumber(request.trackingNumber())
                    .lastStatus(DeliveryStatus.REGISTERED)
                    .lastDescription("운송장이 등록되었습니다.")
                    .lastLocation(null)
                    .lastEventTime(null)
                    .syncedAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        deliveryTrackingStatusRepository.save(tracking);
    }

    // 배송 현황 조회
    @Transactional
    public DeliveryTrackingResponse.TrackingResult track(Integer orderId) {
        DeliveryTrackingStatus tracking = deliveryTrackingStatusRepository
                .findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DELIVERY_NOT_FOUND));

        // DELIVERED 이후엔 DeliveryTracker 호출 없이 DB 캐시 그대로 반환
        if (tracking.getLastStatus() == DeliveryStatus.DELIVERED) {
            return buildResult(orderId, tracking, List.of());
        }

        List<DeliveryTrackingResponse.EventResult> events = refreshTracking(tracking);

        return buildResult(orderId, tracking, events);
    }

    // 배송 건 1개를 실시간 조회하여 DB 동기화 + 배송완료 시 주문 상태 전이
    // (화면에서의 단건 조회, 스케줄러의 전체 폴링 양쪽에서 공용으로 사용)
    private List<DeliveryTrackingResponse.EventResult> refreshTracking(
            DeliveryTrackingStatus tracking
    ) {
        DeliveryTrackingDto.TrackingResponse response = deliveryTrackingService
                .getTrackingInfo(tracking.getCarrierId(), tracking.getTrackingNumber());

        // lastEvent → DeliveryStatus 변환 후 DB 동기화
        DeliveryStatus currentStatus = tracking.getLastStatus();
        if (response.lastEvent() != null) {
            currentStatus = DeliveryStatus.from(response.lastEvent().status().code());
            tracking.update(
                    currentStatus,
                    response.lastEvent().description(),
                    response.lastEvent().location() != null
                            ? response.lastEvent().location().name()
                            : null,
                    response.lastEvent().time()
            );
        }

        // DELIVERED 전환 시 order.deliveredAt 자동 세팅
        if (currentStatus == DeliveryStatus.DELIVERED) {
            orderRepository.findById(tracking.getOrderId())
                    .filter(order -> order.getStatus() == OrderStatus.SHIPPED)
                    .ifPresent(order -> {
                        order.markDelivered(); // deliveredAt + status 동시 세팅

                        if (order.getIsSample()) {
                            orderLogRepository.save(
                                    OrderLog.createProcessLog(
                                            order,
                                            OrderProcessStep.SAMPLE_DELIVERED,
                                            null,
                                            "샘플이 바이어에게 도착했습니다."
                                    )
                            );
                        }
                    });
        }

        // events 변환 (null-safe)
        return response.events() != null
                ? response.events().stream()
                .map(DeliveryTrackingResponse.EventResult::from)
                .toList()
                : List.of();
    }

    // 스케줄러 전용: 아직 배송완료/만료되지 않은 건 전체를 폴링하여 자동 동기화
    @Transactional
    public void syncActiveDeliveries() {
        List<DeliveryStatus> terminalStatuses =
                List.of(DeliveryStatus.DELIVERED, DeliveryStatus.EXPIRED);

        List<DeliveryTrackingStatus> activeTrackings =
                deliveryTrackingStatusRepository.findByLastStatusNotIn(terminalStatuses);

        int successCount = 0;
        int failCount = 0;

        for (DeliveryTrackingStatus tracking : activeTrackings) {
            try {
                refreshTracking(tracking);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.warn(
                        "[배송 자동동기화 실패] orderId={}, carrierId={}, trackingNumber={}, reason={}",
                        tracking.getOrderId(),
                        tracking.getCarrierId(),
                        tracking.getTrackingNumber(),
                        e.getMessage()
                );
            }
        }

        log.info(
                "[배송 자동동기화 결과] 대상={}건, 성공={}건, 실패={}건",
                activeTrackings.size(),
                successCount,
                failCount
        );
    }

    // 응답 조립 공통 메서드
    private DeliveryTrackingResponse.TrackingResult buildResult(
            Integer orderId,
            DeliveryTrackingStatus tracking,
            List<DeliveryTrackingResponse.EventResult> events
    ) {
        return new DeliveryTrackingResponse.TrackingResult(
                orderId,
                tracking.getCarrierId(),
                tracking.getTrackingNumber(),
                tracking.getLastStatus(),
                tracking.getLastStatus().getLabel(),
                tracking.getLastDescription(),
                tracking.getLastLocation(),
                tracking.getLastEventTime(),
                events
        );
    }
}