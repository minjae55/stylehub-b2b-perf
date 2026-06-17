package kr.remerge.stylehub.domain.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;

// 회원가입 요청 DTO
public record SignUpRequest(

        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        @NotBlank(message = "이름을 입력해주세요.")
        @Size(max = 20, message = "이름은 20자 이하여야 합니다.")
        String name,

        @Size(max = 20, message = "휴대폰 번호는 20자 이하여야 합니다.")
        String phone,

        // ADMIN / PRESIDENT / EMPLOYEE
        @NotNull(message = "역할을 선택해주세요.")
        UserRole role,

        // BUYER / SELLER / BOTH
        @NotNull(message = "비즈니스 역할을 선택해주세요.")
        BusinessRole businessRole
) {}