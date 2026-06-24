package kr.remerge.stylehub.domain.deliveryTracker;

import java.util.List;

public class DeliveryTrackingDto {

    public record TrackingResponse(
            TrackingEvent lastEvent,
            List<TrackingEvent> events
    ) {}

    public record TrackingEvent(
            String time,
            TrackingStatus status,
            String description,
            TrackingLocation location
    ) {}

    public record TrackingStatus(
            String code,
            String name
    ) {}

    public record TrackingLocation(
            String name
    ) {}
}
