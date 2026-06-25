package kr.remerge.stylehub.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;

@Configuration
public class WebClientConfig {

    @Value("${toss.secret-key}") // application.yml에 정의된 Secret Key
    private String secretKey;

    @Bean
    public WebClient tossWebClient() {
        // 토스페이먼츠 인증을 위한 Base64 인코딩
        String encodedAuth = Base64.getEncoder().encodeToString((secretKey + ":").getBytes());

        return WebClient.builder()
                .baseUrl("https://api.tosspayments.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + encodedAuth)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
