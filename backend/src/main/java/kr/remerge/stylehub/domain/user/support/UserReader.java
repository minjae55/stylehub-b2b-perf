package kr.remerge.stylehub.domain.user.support;

import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserReader {

    private final UserRepository userRepository;

    public User getUser(Integer userId) {
        validateUserId(userId);

        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );
    }

    public User getUserWithCompany(Integer userId) {
        validateUserId(userId);

        return userRepository.findByIdWithCompany(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );
    }

    public User getCompanyUser(Integer userId) {
        User user = getUserWithCompany(userId);

        if (user.getCompany() == null) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
        }

        return user;
    }

    private void validateUserId(Integer userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
