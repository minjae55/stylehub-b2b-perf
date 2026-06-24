package kr.remerge.stylehub.domain.deliveryTracker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class DeliveryTrackerClient {

    private static final String API_URL = "https://apis.tracker.delivery/graphql";

    @Value("${delivery.tracker.client-id}")
    private String clientId;

    @Value("${delivery.tracker.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    public DeliveryTrackerClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> track(String carrierId, String trackingNumber) {
        String query = """
                query Track($carrierId: ID!, $trackingNumber: String!) {
                  track(carrierId: $carrierId, trackingNumber: $trackingNumber) {
                    lastEvent {
                      time
                      status { code name }
                      description
                      location { name }
                    }
                    events(last: 10) {
                      edges {
                        node {
                          time
                          status { code name }
                          description
                          location { name }
                        }
                      }
                    }
                  }
                }
                """;

        Map<String, Object> body = Map.of(
                "query", query,
                "variables", Map.of(
                        "carrierId", carrierId,
                        "trackingNumber", trackingNumber
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "TRACKQL-API-KEY " + clientId + ":" + clientSecret);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, request, Map.class);
        return response.getBody();
    }
}
