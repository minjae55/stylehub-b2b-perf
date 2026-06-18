package kr.remerge.stylehub.global.auth.security;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

// @LoginUser 어노테이션이 붙은 파라미터를 가로채서
// SecurityContext에서 유저 정보를 꺼내 LoginUserInfo로 변환해주는 클래스
@Component
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    // 이 Resolver가 처리할 파라미터인지 판단
    // @LoginUser 어노테이션이 붙어있으면 true
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class);
    }

    // 실제로 파라미터에 들어갈 값을 만들어서 반환
    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // [방어 코드 1] 인증 정보가 아예 없거나, 인증되지 않은 상태면 null 반환
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        // [방어 코드 2] 로그인을 안 해서 principal이 "anonymousUser"(String)인 경우 null 반환
        if (principal instanceof String) {
            return null;
        }
        // JwtFilter가 이미 SecurityContext에 인증 정보를 저장해둔 상태
        // 거기서 CustomUserDetails를 꺼냄
        CustomUserDetails userDetails = (CustomUserDetails) principal;

        // CustomUserDetails → LoginUserInfo로 변환해서 반환
        return AuthUser.from(userDetails);
    }
}