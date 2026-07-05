package kr.remerge.stylehub.global.auth.oauth2.dto;

public interface OAuth2UserInfo {
    String getProviderUid();

    String getEmail();

    String getNickname();
}