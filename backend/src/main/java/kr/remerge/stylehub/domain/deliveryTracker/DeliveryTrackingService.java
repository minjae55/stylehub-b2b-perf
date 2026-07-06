package kr.remerge.stylehub.domain.deliveryTracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static kr.remerge.stylehub.domain.deliveryTracker.DeliveryTrackingDto.*;

@Service
public class DeliveryTrackingService {

    private final DeliveryTrackerClient client;
    private final ObjectMapper objectMapper;
    private final OrderRepository orderRepository;
    private final UserReader userReader;

    public DeliveryTrackingService(
            DeliveryTrackerClient client,
            ObjectMapper objectMapper,
            OrderRepository orderRepository,
            UserReader userReader
    ) {
        this.client = client;
        this.objectMapper = objectMapper;
        this.orderRepository = orderRepository;
        this.userReader = userReader;
    }

    public TrackingResponse getTrackingInfo(String carrierId, String trackingNumber) {
        Map<String, Object> raw = client.track(carrierId, trackingNumber);

        // GraphQL 응답 구조: { data: { track: { lastEvent: ..., events: ... } } }
        Map<String, Object> data = (Map<String, Object>) raw.get("data");
        Map<String, Object> track = (Map<String, Object>) data.get("track");

        TrackingEvent lastEvent = parseEvent(
                (Map<String, Object>) track.get("lastEvent")
        );

        Map<String, Object> eventsWrapper = (Map<String, Object>) track.get("events");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) eventsWrapper.get("edges");
        List<TrackingEvent> events = edges.stream()
                .map(edge -> parseEvent((Map<String, Object>) edge.get("node")))
                .toList();

        return new TrackingResponse(lastEvent, events);
    }

    private TrackingEvent parseEvent(Map<String, Object> node) {
        if (node == null) return null;

        Map<String, Object> statusMap = (Map<String, Object>) node.get("status");
        TrackingStatus status = new TrackingStatus(
                (String) statusMap.get("code"),
                (String) statusMap.get("name")
        );

        Map<String, Object> locationMap = (Map<String, Object>) node.get("location");
        TrackingLocation location = locationMap != null
                ? new TrackingLocation((String) locationMap.get("name"))
                : null;

        return new TrackingEvent(
                (String) node.get("time"),
                status,
                (String) node.get("description"),
                location
        );
    }

    public TrackingResponse getOrderTracking(
        Integer userId,
        Integer orderId
    ) {
        User user = userReader.getUserWithCompany(userId);

        Order order = orderRepository.findOneByOrderId(orderId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.ORDER_NOT_FOUND)
                );

        validateOrderAccess(user, order);
        validateTrackingInfo(order);

        DeliveryCarrier carrier =
                DeliveryCarrier.fromName(order.getCarrier());

        return getTrackingInfo(
                carrier.getCarrierId(),
                order.getTrackingNumber()
        );
    }

    private void validateOrderAccess(User user, Order order) {
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        boolean isBuyer = Objects.equals(
                order.getBuyer().getUserId(),
                user.getUserId()
        );

        boolean isSellerCompanyMember =
                user.getCompany() != null
                        && Objects.equals(
                        order.getSellerCompany().getCompanyId(),
                        user.getCompany().getCompanyId()
                );

        if (!isAdmin && !isBuyer && !isSellerCompanyMember) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateTrackingInfo(Order order) {
        boolean hasNoCarrier =
                order.getCarrier() == null
                        || order.getCarrier().isBlank();

        boolean hasNoTrackingNumber =
                order.getTrackingNumber() == null
                        || order.getTrackingNumber().isBlank();

        if (hasNoCarrier || hasNoTrackingNumber) {
            throw new BusinessException(
                    ErrorCode.DELIVERY_INFO_NOT_REGISTERED
            );
        }
    }
}
