package kr.remerge.stylehub.domain.company.client;

import kr.remerge.stylehub.domain.company.dto.response.NtsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NtsApiClient {

    private final RestTemplate restTemplate;
    @Value("${nts.api.service-key}")
    private String serviceKey;
    @Value("${nts.api.url}")
    private String serviceUrl;

    public NtsResponse validateBusiness(String businessNumber, String companyName, String representativeName, String openDate) {
        String url = serviceUrl + "?serviceKey=" + serviceKey;

        // 국세청 진위확인 API의 필수 요청 바디 규격 조립
        Map<String, Object> businessData = Map.of(
                "b_no", businessNumber,
                "start_dt", openDate, // YYYYMMDD
                "p_nm", representativeName,
                "b_nm", companyName
        );
        Map<String, Object> requestBody = Map.of("businesses", List.of(businessData));

        return restTemplate.postForObject(url, requestBody, NtsResponse.class);
    }
}