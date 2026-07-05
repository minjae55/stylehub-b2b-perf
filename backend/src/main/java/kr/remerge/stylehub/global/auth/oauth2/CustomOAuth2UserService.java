package kr.remerge.stylehub.global.auth.oauth2;

import kr.remerge.stylehub.domain.user.entity.SocialAccount;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.SocialProvider;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.SocialAccountRepository;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.oauth2.dto.CustomOAuth2User;
import kr.remerge.stylehub.global.auth.oauth2.dto.OAuth2UserInfo;
import kr.remerge.stylehub.global.auth.oauth2.dto.OAuth2UserInfoFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // "kakao", "google", "naver" - application.yml의 registration id
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        SocialProvider provider;
        try {
            provider = SocialProvider.valueOf(registrationId.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인입니다: " + registrationId);
        }

        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, attributes);

        String providerUid = userInfo.getProviderUid();
        if (providerUid == null) {
            throw new OAuth2AuthenticationException(provider + " 사용자 ID를 가져올 수 없습니다.");
        }

        String email = userInfo.getEmail();
        String nickname = userInfo.getNickname();

        // 1. SocialAccount로 기존 연결 여부 조회 (provider + providerUid 조합으로 유일)
        User user = socialAccountRepository
                .findByProviderAndProviderUid(provider, providerUid)
                .map(SocialAccount::getUser)
                .orElseGet(() -> registerNewUser(provider, providerUid, email, nickname));

        log.info("OAuth2 로그인 - provider: {}, userId: {}, providerUid: {}",
                provider, user.getUserId(), providerUid);

        return new CustomOAuth2User(
                user.getUserId(),
                user.getCompany() != null ? user.getCompany().getCompanyId() : null,
                providerUid,
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getBusinessRole(),
                attributes
        );
    }

    private User registerNewUser(SocialProvider provider, String providerUid, String email, String nickname) {
        // 이메일 동의를 안 한 경우(특히 카카오) 대비 - unique 제약이므로 임시값 부여
        String safeEmail = (email != null && !email.isBlank())
                ? email
                : provider.name().toLowerCase() + "_" + providerUid + "@social.stylehub.kr";

        // User.name 컬럼 길이 제한(20자) 방어
        String safeName = (nickname != null && nickname.length() > 20)
                ? nickname.substring(0, 20)
                : nickname;

        User newUser = User.builder()
                .email(safeEmail)
                .name(safeName)
                .role(UserRole.EMPLOYEE)          // 정책에 맞게 조정
                .businessRole(BusinessRole.BUYER) // 정책에 맞게 조정 (온보딩에서 변경 가능)
                .status(UserStatus.PENDING)        // 정책에 맞게 조정
                .build();
        userRepository.save(newUser);

        SocialAccount socialAccount = SocialAccount.builder()
                .user(newUser)
                .provider(provider)
                .providerUid(providerUid)
                .createdAt(LocalDateTime.now())
                .build();
        socialAccountRepository.save(socialAccount);

        return newUser;
    }
}