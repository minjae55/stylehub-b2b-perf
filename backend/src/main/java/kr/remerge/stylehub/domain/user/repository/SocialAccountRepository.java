package kr.remerge.stylehub.domain.user.repository;

import kr.remerge.stylehub.domain.user.entity.SocialAccount;
import kr.remerge.stylehub.domain.user.enumtype.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Integer> {
    Optional<SocialAccount> findByProviderAndProviderUid(SocialProvider provider, String providerUid);
}
