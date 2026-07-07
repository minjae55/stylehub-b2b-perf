package kr.remerge.stylehub.global.auth.oauth2.dto;

import kr.remerge.stylehub.domain.user.enumtype.SocialProvider;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(SocialProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case KAKAO -> new KakaoUserInfo(attributes);
            case GOOGLE -> new GoogleUserInfo(attributes);
            case NAVER -> new NaverUserInfo(attributes);
        };
    }
}