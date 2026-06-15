package kr.remerge.stylehub.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker   // STOMP 메시지 브로커 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 구독할 주제 prefix (서버 → 클라이언트 방향)
        registry.enableSimpleBroker("/topic", "/queue");

        // 클라이언트가 메시지 보낼 때 prefix (클라이언트 → 서버 방향)
        registry.setApplicationDestinationPrefixes("/app");

        // 특정 유저에게 메시지 보낼 때 prefix (1:1 메시지)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")                     // 웹소켓 연결 엔드포인트
                .setAllowedOriginPatterns("*")              // CORS (CorsConfig와 별도로 설정 필요)
                .withSockJS();                              // SockJS 폴백 지원 (웹소켓 미지원 브라우저 대비)
    }
}