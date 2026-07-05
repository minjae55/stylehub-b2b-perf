package kr.remerge.stylehub.global.auth.oauth2.dto;

import java.util.Map;

public class NaverUserInfo implements OAuth2UserInfo {

    private final Map<String, Object> response;

    @SuppressWarnings("unchecked")
    public NaverUserInfo(Map<String, Object> attributes) {
        // 네이버는 실제 유저 정보가 "response" 키 안에 한 번 더 감싸져 있음
        this.response = (Map<String, Object>) attributes.get("response");
    }

    @Override
    public String getProviderUid() {
        if (response == null) return null;
        Object id = response.get("id");
        return id != null ? id.toString() : null;
    }

    @Override
    public String getEmail() {
        return response != null ? (String) response.get("email") : null;
    }

    @Override
    public String getNickname() {
        return response != null ? (String) response.get("name") : null;
    }
}