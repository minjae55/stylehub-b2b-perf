package kr.remerge.stylehub.domain.user;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.entity.CompanyHandledCategory;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyBankAccountRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.dto.request.*;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.repository.UserPreferredCategoryRepository;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.AuthService;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.common.service.EmailService;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    private final EmailService emailService;         // 이메일 발송 서비스
    private final JwtProvider jwtProvider; // 임시 비밀번호 재설정용 토큰 공급자
    // ───────────────────────────────────────────
    // 회원가입
    // ───────────────────────────────────────────
    // ───────────────────────────────────────────
    // 바이어 대표자 가입
    // ───────────────────────────────────────────
    @Transactional
    public void signUpBuyer(BuyerSignUpRequest request) {
        validateEmail(request.email());

        // 사업자 번호 중복 검사
        if (companyRepository.existsByBusinessNumber(request.businessNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 1. 회사 생성 및 저장
        Company company = companyRepository.save(request.toCompanyEntity());

        // 2. 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.PRESIDENT, BusinessRole.BUYER);
        userRepository.save(user);

        // 3. 선호 카테고리 저장
        saveUserPreferredCategories(user, request.preferredCategoryIds());
    }

    // ───────────────────────────────────────────
    // 셀러 대표자 가입
    // ───────────────────────────────────────────
    @Transactional
    public void signUpSeller(SellerSignUpRequest request) {
        validateEmail(request.email());

        // 사업자 번호 중복 검사
        if (companyRepository.existsByBusinessNumber(request.businessNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 1. 회사 생성 및 저장
        Company company = companyRepository.save(request.toCompanyEntity());

        // 2. 브랜드 정보가 있다면 저장
        if (request.brandName() != null && !request.brandName().isBlank()) {
            brandRepository.save(request.toBrandEntity(company));
        }

        // 3. 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.PRESIDENT, BusinessRole.BOTH);
        userRepository.save(user);

        // 4. 회사 정산 계좌 저장
        companyBankAccountRepository.save(request.toBankAccountEntity(company));

        // 5. 카테고리 맵핑 데이터들 저장
        saveUserPreferredCategories(user, request.preferredCategoryIds());
        saveCompanyHandledCategories(company, request.handledCategoryIds());
    }

    // ───────────────────────────────────────────
    // 직원 가입
    // ───────────────────────────────────────────
    @Transactional
    public void signUpEmployee(EmployeeSignUpRequest request) {
        validateEmail(request.email());

        // 1. 기존에 등록된 회사 찾기 (없으면 예외)
        Company company = companyRepository.findByBusinessNumber(request.businessNumber())
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        if (company.getSellerStatus() != SellerStatus.APPROVED) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_APPROVED); // 💡 승인되지 않은 회사 예외
        }

        BusinessRole requestedRole = request.businessRole();
        if (requestedRole != BusinessRole.SELLER && requestedRole != BusinessRole.BUYER) {
            throw new BusinessException(ErrorCode.INVALID_BUSINESS_ROLE);
        }

        // 2. 직원 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = request.toUserEntity(company, encodedPassword, UserRole.EMPLOYEE, request.businessRole());
        userRepository.save(user);

        // 3. 직원 개인 선호 카테고리 저장 (선택 사항)
        if (request.preferredCategoryIds() != null && !request.preferredCategoryIds().isEmpty()) {
            saveUserPreferredCategories(user, request.preferredCategoryIds());
        }
    }

    // ───────────────────────────────────────────
    // 공통 내부 메서드
    // ───────────────────────────────────────────
    private void validateEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    // 유저 개인 선호 카테고리 저장 (바이어/셀러/직원 공통)
    // user_preferred_categories 테이블
    private void saveUserPreferredCategories(User user, List<Integer> categoryIds) {
        validateCategoryCount(categoryIds);

        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        List<UserPreferredCategory> preferredCategories = categories.stream()
                .map(category -> UserPreferredCategory.builder()
                        .user(user)       // 객체 연관 관계 매핑
                        .category(category) // 객체 연관 관계 매핑
                        .build())
                .toList();

        preferredCategoryRepository.saveAll(preferredCategories);
    }

    // 회사 취급 카테고리 저장 (셀러만)
    // company_handled_categories 테이블
    private void saveCompanyHandledCategories(Company company, List<Integer> categoryIds) {
        validateCategoryCount(categoryIds);

        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        List<CompanyHandledCategory> handledCategories = categories.stream()
                .map(category -> CompanyHandledCategory.builder()
                        .companyId(company.getCompanyId())
                        .categoryId(category.getCategoryId())
                        .build())
                .toList();

        companyHandledCategoryRepository.saveAll(handledCategories);
    }

    private void validateCategoryCount(List<Integer> categoryIds) {
        if (categoryIds.size() < 3 || categoryIds.size() > 5) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY_COUNT);
        }
    }

    // ───────────────────────────────────────────
    // 내 정보 조회
    // ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserResponse getMe(Integer userId) {
        User user = userRepository.findByIdWithCompany(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return UserResponse.from(user);
    }

    // ───────────────────────────────────────────
    // 내 정보 수정
    // ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public void verifyPassword(Integer userId, VerifyPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 입력받은 비밀번호와 DB의 해시화된 비밀번호 비교
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
    }

    @Transactional
    public UserResponse updateMe(Integer userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 이메일을 변경하는 경우 중복 체크
        if (!user.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (!request.email().equals(user.getEmail())) {
            if (!authService.isVerified(request.email())) {
                throw new BusinessException(ErrorCode.UNVERIFIED_EMAIL);
            }
            authService.invalidateVerification(request.email());
        }

        user.update(request.email(), request.phone(), request.profileImageUrl());

        return UserResponse.from(user);
    }

    // ───────────────────────────────────────────
    // 회원 탈퇴
    // ───────────────────────────────────────────

    @Transactional
    public void deleteMe(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.delete();
    }
}