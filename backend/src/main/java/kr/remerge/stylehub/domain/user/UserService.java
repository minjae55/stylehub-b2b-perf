package kr.remerge.stylehub.domain.user;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.dto.request.UpdateMemberRoleRequest;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.entity.CompanyHandledCategory;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyBankAccountRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.dto.request.*;
import kr.remerge.stylehub.domain.user.dto.response.ProfileUpdateResponse;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.UserPreferredCategoryRepository;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.AuthService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserPreferredCategoryRepository preferredCategoryRepository;
    private final CompanyRepository companyRepository;
    private final CompanyHandledCategoryRepository companyHandledCategoryRepository;
    private final CompanyBankAccountRepository companyBankAccountRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final AuthService authService;

    // ───────────────────────────────────────────
    // 회원가입 플로우
    // ───────────────────────────────────────────

    /**
     * 바이어 대표자 가입
     */
    @Transactional
    public void signUpBuyer(BuyerSignUpRequest request) {
        // 1. 공통 가입 인증 검증 (이메일, 휴대폰)
        validateSignUpAuth(request.email(), request.phone());

        // 2. 인증 티켓 소모
        invalidateAuthTickets(request.email(), request.phone());

        // 3. 사업자 번호 중복 검사
        if (companyRepository.existsByBusinessNumber(request.businessNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 4. 회사 및 유저 정보 저장
        Company company = companyRepository.save(request.toCompanyEntity());
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.PRESIDENT, BusinessRole.BUYER);
        userRepository.save(user);

        // 5. 선호 카테고리 저장 (바이어 대표는 0개 허용이므로 필수 여부 false)
        saveCategories(request.preferredCategoryIds(), false,
                category -> UserPreferredCategory.builder().user(user).category(category).build(),
                preferredCategoryRepository::saveAll);
    }

    /**
     * 셀러 대표자 가입
     */
    @Transactional
    public void signUpSeller(SellerSignUpRequest request) {
        // 1. 공통 가입 인증 검증
        validateSignUpAuth(request.email(), request.phone());

        // 2. 인증 티켓 소모
        invalidateAuthTickets(request.email(), request.phone());

        // 3. 사업자 번호 중복 검사
        if (companyRepository.existsByBusinessNumber(request.businessNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 4. 회사 및 브랜드 정보 저장
        Company company = companyRepository.save(request.toCompanyEntity());
        if (request.brandName() != null && !request.brandName().isBlank()) {
            brandRepository.save(request.toBrandEntity(company));
        }

        // 5. 유저 및 정산 계좌 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.PRESIDENT, BusinessRole.BOTH);
        userRepository.save(user);
        companyBankAccountRepository.save(request.toBankAccountEntity(company));

        // 6. 카테고리 매핑 데이터 저장
        // - 개인 선호 카테고리: 선택 사항 (false)
        // - 회사 취급 카테고리: 최소 1개 필수 사항 (true)
        saveCategories(request.preferredCategoryIds(), false,
                category -> UserPreferredCategory.builder().user(user).category(category).build(),
                preferredCategoryRepository::saveAll);

        saveCategories(request.handledCategoryIds(), true,
                category -> CompanyHandledCategory.builder().companyId(company.getCompanyId()).categoryId(category.getCategoryId()).build(),
                companyHandledCategoryRepository::saveAll);
    }

    /**
     * 직원 가입
     */
    @Transactional
    public void signUpEmployee(EmployeeSignUpRequest request) {
        // 1. 공통 가입 인증 검증 및 티켓 소모
        validateSignUpAuth(request.email(), request.phone());
        invalidateAuthTickets(request.email(), request.phone());

        // 2. 소속 회사 조회
        Company company = companyRepository.findByBusinessNumber(request.businessNumber())
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        // 3. 직원 역할군 및 회사 상태 정밀 검증
        validateEmployeeRole(request.businessRole(), company);

        // 4. 직원 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.EMPLOYEE, request.businessRole());
        userRepository.save(user);

        // 5. 직원 개인 선호 카테고리 저장 (선택 사항이므로 false)
        saveCategories(request.preferredCategoryIds(), false,
                category -> UserPreferredCategory.builder().user(user).category(category).build(),
                preferredCategoryRepository::saveAll);
    }

    // ───────────────────────────────────────────
    // 공통 내부 리팩토링 메서드 (중복 제거용)
    // ───────────────────────────────────────────

    /**
     * 카테고리 검증, 매핑, 저장을 일괄 처리하는 공통 제네릭 메서드 (핵심 리팩토링)
     */
    private <T> void saveCategories(List<Integer> categoryIds, boolean isRequired, Function<Category, T> mapper, Consumer<List<T>> saveAction) {
        int count = (categoryIds == null) ? 0 : categoryIds.size();

        // [조건 1] 필수 사항인데 하나도 선택 안 한 경우 에러 (셀러 대표 취급 카테고리 방어)
        if (isRequired && count == 0) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY_COUNT);
        }
        // [조건 2] 5개를 초과하여 선택한 경우 무조건 에러
        if (count > 5) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY_COUNT);
        }
        // 데이터가 없는 선택 사항 케이스라면 저장 생략하고 리턴
        if (categoryIds == null || categoryIds.isEmpty()) {
            return;
        }

        // DB에서 카테고리 데이터 유효성 일괄 검증
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        // 제네릭 스트림 매핑 처리 후 람다 액션 실행
        List<T> entities = categories.stream().map(mapper).toList();
        saveAction.accept(entities);
    }

    /**
     * 회원가입 후 사용된 이메일 및 휴대폰 인증 티켓 무효화
     */
    private void invalidateAuthTickets(String email, String phone) {
        authService.invalidateVerification(email);
        authService.invalidateVerification(phone.replaceAll("[^0-9]", ""));
    }

    /**
     * 직원 가입 요청 시 역할군 및 회사의 상태(SellerStatus) 정밀 검증
     */
    private void validateEmployeeRole(BusinessRole requestedRole, Company company) {
        if (requestedRole != BusinessRole.SELLER && requestedRole != BusinessRole.BUYER) {
            throw new BusinessException(ErrorCode.INVALID_JOIN_ROLE);
        }

        if (requestedRole == BusinessRole.SELLER) {
            if (company.getSellerStatus() != SellerStatus.APPROVED && company.getSellerStatus() != SellerStatus.PENDING) {
                throw new BusinessException(ErrorCode.COMPANY_NOT_APPROVED);
            }
        } else if (requestedRole == BusinessRole.BUYER) {
            if (company.getSellerStatus() != SellerStatus.NONE &&
                    company.getSellerStatus() != SellerStatus.APPROVED &&
                    company.getSellerStatus() != SellerStatus.PENDING) {
                throw new BusinessException(ErrorCode.INVALID_COMPANY_STATUS);
            }
        }
    }

    /**
     * 회원가입 전 공통 보안 검증 (이메일 중복, 이메일 인증 여부, 휴대폰 인증 여부)
     */
    private void validateSignUpAuth(String email, String phone) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (!authService.isVerified(email)) {
            throw new BusinessException(ErrorCode.UNVERIFIED_EMAIL);
        }
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (!authService.isVerified(cleanPhone)) {
            throw new BusinessException(ErrorCode.UNVERIFIED_PHONE);
        }
    }

    // ───────────────────────────────────────────
    // 회원 조회 / 수정 / 탈퇴 로직
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserResponse getMe(Integer userId) {
        User user = userRepository.findByIdWithCompany(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public void verifyPassword(Integer userId, VerifyPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
    }

    @Transactional
    public ProfileUpdateResponse updateProfile(Integer userId, ProfileUpdateRequest request) {
        // 1. 현재 로그인한 유저 정보 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. 이메일이 변경되었는지 확인 → 변경되었다면 Redis 인증 여부 검증
        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
            }
            // AuthService에 만들어 둔 검증 정책 메서드 활용
            authService.validateVerification(request.email());
            authService.invalidateVerification(request.email());

            user.updateEmail(request.email());
        }

        // 3. 휴대폰 번호가 변경되었는지 확인 → 변경되었다면 Redis 인증 여부 검증
        if (request.phone() != null && !request.phone().equals(user.getPhone())) {
            String cleanPhone = request.phone().replaceAll("[^0-9]", "");
            if (userRepository.existsByPhone(cleanPhone)) { // 해당 메서드가 레포지토리에 있다고 가정
                throw new BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER);
            }

            authService.validateVerification(cleanPhone);
            authService.invalidateVerification(cleanPhone);

            user.updatePhone(cleanPhone);
        }

        // 4. 프로필 이미지 등 기타 정보 업데이트
        if (request.profileImageUrl() != null) {
            user.updateProfileImageUrl(request.profileImageUrl());
        }

        return ProfileUpdateResponse.from(user);
    }

    @Transactional
    public void changePassword(Integer userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1. 현재 패스워드 일치 여부 검증
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        // 2. 새 패스워드가 기존 패스워드와 동일한지 검증
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.SAME_AS_CURRENT_PASSWORD);
        }

        // 3. 패스워드 암호화 후 변경
        String encodedPassword = passwordEncoder.encode(request.newPassword());
        user.updatePassword(encodedPassword);

        // 4. 기존 발급된 모든 인증 토큰 만료 처리 (리프레시 토큰 제거)
        authService.logout(userId);
    }

    @Transactional
    public void deleteMe(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.delete();
    }

    @Transactional
    public void updateMemberRole(Integer userId, UpdateMemberRoleRequest request, AuthUser authUser) {
        if (!"PRESIDENT".equals(authUser.role()) && !"ADMIN".equals(authUser.role())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 1. 수정 대상 직원 조회
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. 권한 검증: 요청자가 대표(PRESIDENT)인 경우, 같은 회사 소속인지 체크
        if (UserRole.PRESIDENT.name().equals(authUser.role())) {
            if (!authUser.companyId().equals(targetUser.getCompany().getCompanyId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }

        // 3. 엔티티 내부 메서드를 통한 선택적 수정 (더티 체킹 발동)
        targetUser.updateRoles(request.role(), request.businessRole());
    }

    @Transactional
    public void updateUserStatus(Integer userId, UserStatus newStatus, AuthUser authUser) {
        // 1. 상태를 바꿀 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. 보안 검증: 대표(PRESIDENT)가 바꾸는 경우, 본인 회사 소속의 직원이 맞는지 확인
        if ("PRESIDENT".equals(authUser.role()) && !authUser.companyId().equals(user.getCompany().getCompanyId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 3. 비즈니스 로직에 따른 상태 변경 처리 (JPA 더티 체킹 활용)
        // 엔티티 내부에 user.changeStatus(newStatus) 같은 메서드가 있다면 그것을 호출하는 것이 좋습니다.
        user.updateStatus(newStatus);
    }
}