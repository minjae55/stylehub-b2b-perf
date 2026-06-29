package kr.remerge.stylehub.domain.adminuser.repository;

import kr.remerge.stylehub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.adminuser.repository.AdminUserRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {
    private final AdminUserRepository adminUserRepository;

    @Transactional
    public void changeUserStatus(Integer userId, UserStatus newStatus) {
       int updatedCount = adminUserRepository.updateUserStatus(userId, newStatus);
       if (updatedCount == 0) {
           throw new IllegalArgumentException("존재하지 않는 회원입니다. ID: " + userId);
       }
    }
}
