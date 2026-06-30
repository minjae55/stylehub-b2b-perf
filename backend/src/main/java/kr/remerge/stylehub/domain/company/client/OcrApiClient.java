package kr.remerge.stylehub.domain.company.client;

import kr.remerge.stylehub.domain.company.dto.response.OcrResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Component
public class OcrApiClient {

    private final RestTemplate restTemplate = new RestTemplate();
    @Value("${naver.ocr.url}")
    private String ocrUrl;
    @Value("${naver.ocr.secret-key}")
    private String secretKey;

    public OcrResponse callOcr(MultipartFile file) throws IOException {
        // 1. 헤더 설정 (네이버 OCR 필수 스펙)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-OCR-SECRET", secretKey);

        // 2. 네이버가 요구하는 JSON 메타데이터 생성
        String messageJson = String.format(
                "{\"images\":[{\"format\":\"%s\",\"name\":\"%s\"}],\"requestId\":\"%s\",\"version\":\"V2\",\"timestamp\":%d}",
                getFileExtension(file.getOriginalFilename()), "biz_license", UUID.randomUUID(), System.currentTimeMillis()
        );

        // 3. 바디 조립 (메타데이터 JSON + 실제 파일 바이너리)
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("message", messageJson);

        // getOriginalFilename() 대신 원본 클래스의 getFilename()을 오버라이드해야 합니다.
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename(); // 스프링 내부 멀티파트 전송 시 이 파일명을 읽어갑니다.
            }
        };
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // 4. API 호출 및 응답 바인딩
        return restTemplate.postForObject(ocrUrl, requestEntity, OcrResponse.class);
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "jpg";
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}