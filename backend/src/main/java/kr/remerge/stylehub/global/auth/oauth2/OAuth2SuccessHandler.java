package kr.remerge.stylehub.global.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.auth.oauth2.dto.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    @Value("${app.frontend-url}")
    private String frontendUrl; // application.yml: app.frontend-url: http://localhost:5173

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User principal = (CustomOAuth2User) authentication.getPrincipal();

        String accessToken = jwtProvider.generateAccessToken(
                principal.getUserId(),
                principal.getCompanyId(),
                principal.getRole().name(),
                principal.getBusinessRole().name()
        );
        String refreshToken = jwtProvider.generateRefreshToken(principal.getUserId());

        log.info("OAuth2 로그인 성공 - userId: {}", principal.getUserId());

        String redirectUrl = frontendUrl + "/oauth/callback"
                + "?accessToken=" + accessToken
                + "&refreshToken=" + refreshToken;

        response.sendRedirect(redirectUrl);
    }
}