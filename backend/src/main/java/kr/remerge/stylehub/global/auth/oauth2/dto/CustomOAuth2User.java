package kr.remerge.stylehub.global.auth.oauth2.dto;

import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class CustomOAuth2User implements OAuth2User {

    private final Integer userId;
    private final Integer companyId;       // 추가
    private final String providerUid;
    private final String email;
    private final String nickname;
    private final UserRole role;
    private final BusinessRole businessRole; // 추가
    private final Map<String, Object> attributes;

    public CustomOAuth2User(Integer userId, Integer companyId, String providerUid, String email,
                            String nickname, UserRole role, BusinessRole businessRole,
                            Map<String, Object> attributes) {
        this.userId = userId;
        this.companyId = companyId;
        this.providerUid = providerUid;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
        this.businessRole = businessRole;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getName() {
        return providerUid;
    }
}