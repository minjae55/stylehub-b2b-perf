package kr.remerge.stylehub.domain.company;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.dto.request.SellerSignUpRequest;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.entity.CompanyBankAccount;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyBankAccountRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.entity.UserPreferredCategory;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
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
public class SellerSignUpService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final BrandRepository brandRepository;
    private final CompanyBankAccountRepository companyBankAccountRepository;
    private final UserPreferredCategoryRepository userPreferredCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    // 셀러 회원가입 - 회사/브랜드/유저/계좌/선호카테고리를 하나의 트랜잭션으로 생성
    // 중간에 하나라도 실패하면 전체 롤백
    @Transactional
    public void signUpSeller(SellerSignUpRequest request) {

        // 1. 중복 체크
        if (userRepository.existsByEmail(request.managerEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (companyRepository.existsByBusinessNumber(request.businessNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_BUSINESS_NUMBER);
        }

        // 2. Company 생성
        // 가입 직후엔 PENDING 상태 → 관리자 승인 후 APPROVED
        // seller_status도 PENDING으로 셀러 신청 상태 표시
        Company company = Company.builder()
                .name(request.companyName())
                .businessNumber(request.businessNumber())
                .representativeName(request.representativeName())
                .address(request.address())
                .addressDetail(request.addressDetail())
                .businessLicenseUrl(request.businessLicenseUrl())
                .websiteUrl(request.shopUrl())
                .storeType(CompanyStoreType.valueOf(request.storeType().name()))
                .status(CompanyStatus.PENDING)
                .sellerStatus(SellerStatus.PENDING)
                .build();
        Company savedCompany = companyRepository.save(company);

        // 3. Brand 생성 (브랜드명 입력했을 때만)
        if (request.brandName() != null && !request.brandName().isBlank()) {
            Brand brand = Brand.builder()
                    .company(savedCompany)
                    .brandName(request.brandName())
                    .build();
            brandRepository.save(brand);
        }

        // 4. User 생성 (대표자 = 담당자)
        // role은 PRESIDENT, businessRole은 SELLER
        User user = User.builder()
                .company(savedCompany)
                .email(request.managerEmail())
                .password(passwordEncoder.encode(request.password()))
                .name(request.managerName())
                .phone(request.managerPhone())
                .role(UserRole.PRESIDENT)
                .businessRole(BusinessRole.SELLER)
                .status(UserStatus.PENDING)
                .build();
        userRepository.save(user);

        // 5. CompanyBankAccount 생성
        // 첫 계좌이므로 기본 계좌로 설정
        CompanyBankAccount bankAccount = CompanyBankAccount.builder()
                .company(savedCompany)
                .bankName(request.bankName())
                .accountNumber(request.accountNumber())
                .accountHolder(request.accountHolder())
                .isDefault(true)
                .build();
        companyBankAccountRepository.save(bankAccount);

        // 6. CompanyPreferredCategory 생성 (3~5개)
        List<Category> categories = categoryRepository.findAllById(request.preferredCategoryIds());
        if (categories.size() != request.preferredCategoryIds().size()) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        List<UserPreferredCategory> preferredCategories = categories.stream()
                .map(category -> UserPreferredCategory.builder()
                        .category(category)
                        .build())
                .toList();
        userPreferredCategoryRepository.saveAll(preferredCategories);
    }
}