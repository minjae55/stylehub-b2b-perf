package kr.remerge.stylehub.global.interceptor;

import io.jsonwebtoken.Claims;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FilterChannelInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider; // 기존에 사용하시는 토큰 검증 Provider 주입

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // 1. 프론트엔드가 최초 연결(CONNECT)을 요청할 때 토큰 검증 및 세션 등록
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            // 프론트엔드가 전송한 Stomp Header에서 Authorization 토큰 추출
            String authToken = accessor.getFirstNativeHeader("Authorization");
            log.info("WebSocket CONNECT Attempt - Token: {}", authToken);

            if (authToken != null && authToken.startsWith("Bearer ")) {
                String token = authToken.substring(7);

                try {
                    // 1. 토큰에서 claims를 한 번만 파싱합니다.
                    Claims claims = jwtProvider.parseClaims(token);

                    // 2. 토큰 내부에 저장되어 있던 유저 정보들을 쏙쏙 뽑아냅니다.
                    Integer userId = Integer.valueOf(claims.getSubject());
                    Integer companyId = claims.get("companyId", Integer.class);
                    String role = claims.get("role", String.class);
                    String businessRole = claims.get("businessRole", String.class);

                    // 3. 내 커스텀 DTO인 AuthUser 객체를 생성합니다.
                    AuthUser authUser = new AuthUser(userId, companyId, role, businessRole);

                    // 4. Principal 자리에 String ID 대신, 이 authUser DTO 자체를 통째로 꼽아줍니다!
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            authUser,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role)) // Security 기능 쓰는걸 고려
                    );

                    // 이렇게 해두면 @MessageMapping 컨트롤러가 호출될 때 이 토큰을 꺼내 쓸 수 있습니다.
                    accessor.setUser(authentication);

                } catch (Exception e) {
                    log.error("웹소켓 토큰 검증 실패: {}", e.getMessage());
                    // 토큰이 유효하지 않으면 연결을 거부하도록 예외 처리 가능
                    throw new BusinessException(ErrorCode.INVALID_TOKEN);
                }
            }
        }
        return message;
    }
}