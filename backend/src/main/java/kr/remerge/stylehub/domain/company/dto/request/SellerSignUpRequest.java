package kr.remerge.stylehub.domain.company.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import lombok.Builder;

import java.util.List;

// 셀러 회원가입 통합 요청 DTO
// users + companies + brands + company_bank_accounts + company_preferred_categories
// 한 번에 생성하기 위한 통합 폼
public record SellerSignUpRequest(

        // ─── Step1: 사업자 정보 ───
        @NotBlank(message = "사업자등록번호를 입력해주세요.")
        String businessNumber,

        @NotBlank(message = "회사명을 입력해주세요.")
        String companyName,

        @NotBlank(message = "대표자명을 입력해주세요.")
        String representativeName,

        @NotBlank(message = "사업장 주소를 입력해주세요.")
        String address,

        String addressDetail,

        // 파일은 별도 업로드 API로 먼저 올리고 URL만 받는 방식 추천
        String businessLicenseUrl,

        // ─── Step2: 매장 정보 ───
        String brandName,

        @NotNull(message = "매장 타입을 선택해주세요.")
        CompanyStoreType storeType,  // OFFLINE / ONLINE / BOTH

        String shopUrl,

        // ─── Step3: 담당자 정보 (= User 정보) ───
        @NotBlank(message = "담당자 이름을 입력해주세요.")
        String managerName,

        @NotBlank(message = "담당자 연락처를 입력해주세요.")
        String managerPhone,

        @NotBlank(message = "담당자 이메일을 입력해주세요.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String managerEmail,

        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        // ─── Step3: 정산 계좌 정보 ───
        @NotBlank(message = "은행을 선택해주세요.")
        String bankName,

        @NotBlank(message = "계좌번호를 입력해주세요.")
        String accountNumber,

        @NotBlank(message = "예금주명을 입력해주세요.")
        String accountHolder,

        // ─── Step4: 선호 카테고리 ───
        @NotEmpty(message = "선호 카테고리를 선택해주세요.")
        @Size(min = 3, max = 5, message = "선호 카테고리는 3개에서 5개 사이여야 합니다.")
        List<Integer> preferredCategoryIds
) {}