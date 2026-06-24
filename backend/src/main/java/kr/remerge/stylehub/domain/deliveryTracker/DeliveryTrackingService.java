package kr.remerge.stylehub.domain.deliveryTracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DeliveryTrackingService {

    private final DeliveryTrackerClient client;
    private final ObjectMapper objectMapper;

    public DeliveryTrackingService(DeliveryTrackerClient client, ObjectMapper objectMapper) {
        this.client = client;
        this.objectMapper = objectMapper;
    }

    public DeliveryTrackingDto.TrackingResponse getTrackingInfo(String carrierId, String trackingNumber) {
        Map<String, Object> raw = client.track(carrierId, trackingNumber);

        // GraphQL 응답 구조: { data: { track: { lastEvent: ..., events: ... } } }
        Map<String, Object> data = (Map<String, Object>) raw.get("data");
        Map<String, Object> track = (Map<String, Object>) data.get("track");

        DeliveryTrackingDto.TrackingEvent lastEvent = parseEvent(
                (Map<String, Object>) track.get("lastEvent")
        );

        Map<String, Object> eventsWrapper = (Map<String, Object>) track.get("events");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) eventsWrapper.get("edges");
        List<DeliveryTrackingDto.TrackingEvent> events = edges.stream()
                .map(edge -> parseEvent((Map<String, Object>) edge.get("node")))
                .toList();

        return new DeliveryTrackingDto.TrackingResponse(lastEvent, events);
    }

    private DeliveryTrackingDto.TrackingEvent parseEvent(Map<String, Object> node) {
        if (node == null) return null;

        Map<String, Object> statusMap = (Map<String, Object>) node.get("status");
        DeliveryTrackingDto.TrackingStatus status = new DeliveryTrackingDto.TrackingStatus(
                (String) statusMap.get("code"),
                (String) statusMap.get("name")
        );

        Map<String, Object> locationMap = (Map<String, Object>) node.get("location");
        DeliveryTrackingDto.TrackingLocation location = locationMap != null
                ? new DeliveryTrackingDto.TrackingLocation((String) locationMap.get("name"))
                : null;

        return new DeliveryTrackingDto.TrackingEvent(
                (String) node.get("time"),
                status,
                (String) node.get("description"),
                location
        );
    }
}
