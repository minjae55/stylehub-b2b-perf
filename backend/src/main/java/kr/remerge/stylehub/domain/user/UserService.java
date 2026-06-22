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
import kr.remerge.stylehub.domain.user.dto.response.FindIdResponse;
import kr.remerge.stylehub.domain.user.dto.response.UserResponse;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import kr.remerge.stylehub.domain.user.repository.UserPreferredCategoryRepository;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.jwt.JwtProvider;
import kr.remerge.stylehub.global.common.service.EmailService;
import kr.remerge.stylehub.global.common.service.SmsService;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.common.RedisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Random;

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

    private final RedisRepository redisRepository; // Redis 캐시 레포지토리 (만료 시간 설정용)
    private final SmsService smsService;             // 알림톡 또는 SMS 발송 서비스
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

    // ───────────────────────────────────────────
    // 아이디 찾기 - OTP 인증번호 발송
    // ───────────────────────────────────────────
    @Transactional
    public void sendFindIdOtp(FindIdSendOtpRequest request) {
        // 1. 이름과 휴대폰 번호가 일치하는 유저가 존재하는지 검증
        boolean isExist = userRepository.existsByNameAndPhone(request.name(), request.phone());
        if (!isExist) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND); // 혹은 "입력 정보가 일치하지 않습니다" 전용 에러코드
        }

        // 2. 6자리 보안 난수 생성
        String otpCode = String.format("%06d", new Random().nextInt(1000000));

        // 3. Redis 캐시에 휴대폰 번호를 Key로 삼아 3분(180초) 동안 저장
        redisRepository.save(request.phone(), otpCode, Duration.ofMinutes(3));

        // 4. 외부 SMS 유틸을 이용해 발송
        smsService.sendSms(request.phone(), "[StyleHub] 본인확인 인증번호 [" + otpCode + "]를 입력해주세요. (3분 내 제한)");
    }

    // ───────────────────────────────────────────
    // 아이디 찾기 - OTP 인증번호 검증 및 결과 반환
    // ───────────────────────────────────────────
    @Transactional
    public FindIdResponse verifyFindIdOtp(FindIdVerifyOtpRequest request) {
        // 1. 캐시 저장소에서 해당 번호의 OTP 코드 조회
        String savedCode = redisRepository.get(request.phone());

        if (savedCode == null) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED); // 인증 시간 만료 예외 처리
        }

        if (!savedCode.equals(request.code())) {
            throw new BusinessException(ErrorCode.INVALID_OTP_CODE); // 인증번호 불일치 예외 처리
        }

        // 2. 일치할 경우 유저 정보 획득
        User user = userRepository.findByNameAndPhone(request.name(), request.phone())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 3. 검증 완료 후 OTP 코드는 보관함에서 즉시 파기 (보안)
        redisRepository.delete(request.phone());

        // 4. 이메일(아이디) 마스킹 처리
        String maskedEmail = maskEmail(user.getEmail());

        // 프론트엔드가 요구하는 { maskedEmail, createdAt } 스펙 반환
        return new FindIdResponse(maskedEmail, user.getCreatedAt().toString());
    }

    // ───────────────────────────────────────────
    // 비밀번호 찾기 - 재설정 이메일 발송
    // ───────────────────────────────────────────
    @Transactional
    public void requestFindPassword(FindPwRequest request) {
        // 1. 가입 이메일과 이름이 정확히 일치하는 유저 검증
        User user = userRepository.findByEmailAndName(request.email(), request.name())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. 30분 동안만 유효한 임시 비밀번호 재설정 토큰 생성
        String resetToken = jwtProvider.createPasswordResetToken(user.getEmail());

        // 3. 사용자가 접근할 프론트엔드 도메인 링크 세팅
        String resetLink = "https://stylehub.kr/auth/reset-password?token=" + resetToken;

        // 4. HTML 포맷 빌드 및 메일 발송
        String emailContent = "<h3>안녕하세요, StyleHub입니다.</h3>" +
                "<p>아래 링크를 클릭하여 30분 이내에 비밀번호를 재설정해 주세요.</p>" +
                "<p><a href='" + resetLink + "' style='color: #2563eb; font-weight: bold;'>비밀번호 재설정하러 가기</a></p>";

        emailService.sendHtmlEmail(user.getEmail(), "[StyleHub] 비밀번호 재설정 링크 안내", emailContent);
    }

    // ───────────────────────────────────────────
    // 이메일 마스킹 헬퍼 메서드
    // ───────────────────────────────────────────
    private String maskEmail(String email) {
        String[] parts = email.split("@");
        String id = parts[0];
        String domain = parts[1];

        if (id.length() <= 3) {
            return id.replaceAll("\\.", "*") + "@" + domain;
        }
        // 앞 2자리 유지, 중간 별표, 뒤 2자리 유지 패턴
        return id.substring(0, 2) + "***" + id.substring(id.length() - 2) + "@" + domain;
    }
}