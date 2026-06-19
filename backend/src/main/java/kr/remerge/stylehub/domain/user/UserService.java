package kr.remerge.stylehub.domain.user;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.entity.CompanyHandledCategory;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyBankAccountRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyHandledCategoryRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.dto.request.*;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.UserPreferredCategoryRepository;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
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

    // ───────────────────────────────────────────
    // 회원가입
    // ───────────────────────────────────────────

    @Transactional
    public UserResponse signUp(SignUpRequest request) {

        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 2. 비밀번호 암호화
        // BCrypt로 단방향 암호화 → DB에 평문 저장 절대 금지
        String encodedPassword = passwordEncoder.encode(request.password());

        // 3. User 엔티티 생성
        // 가입 직후엔 PENDING 상태 (관리자 승인 후 APPROVED)
        User user = User.builder()
                .email(request.email())
                .password(encodedPassword)
                .name(request.name())
                .phone(request.phone())
                .role(request.role())
                .businessRole(request.businessRole())
                .status(UserStatus.PENDING)
                .build();

        // 4. DB 저장
        User savedUser = userRepository.save(user);

        // 5. 저장된 유저 정보 반환
        return UserResponse.from(savedUser);
    }

    // ───────────────────────────────────────────
    // 바이어 대표자 가입
    // ───────────────────────────────────────────
    @Transactional
    public void signUpBuyer(BuyerSignUpRequest request) {
        validateEmail(request.email());

        // 1. 회사 생성 및 저장
        Company company = companyRepository.save(request.toCompanyEntity());

        // 2. 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = userRepository.save(request.toUserEntity(company, encodedPassword));

        // 3. 선호 카테고리 저장
        saveUserPreferredCategories(user, request.preferredCategoryIds());

    }

    // ───────────────────────────────────────────
    // 셀러 대표자 가입
    // ───────────────────────────────────────────
    @Transactional
    public void signUpSeller(SellerSignUpRequest request) {
        validateEmail(request.email());

        // 1. 회사 생성 및 저장
        Company company = companyRepository.save(request.toCompanyEntity());

        // 2. 브랜드 정보가 있다면 저장
        if (request.brandName() != null && !request.brandName().isBlank()) {
            brandRepository.save(request.toBrandEntity(company));
        }

        // 3. 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = userRepository.save(request.toUserEntity(company, encodedPassword));

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

        // 2. 직원 유저 생성 및 저장
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = userRepository.save(request.toUserEntity(company, encodedPassword));

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return UserResponse.from(user);
    }

    // ───────────────────────────────────────────
    // 내 정보 수정
    // ───────────────────────────────────────────

    @Transactional
    public UserResponse updateMe(Integer userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.update(request.name(), request.phone(), request.profileImageUrl());

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