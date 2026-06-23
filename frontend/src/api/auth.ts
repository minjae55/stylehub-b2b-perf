import api from "./axios";
import {
    BuyerSignUpRequest,
    EmployeeSignUpRequest,
    FindIdSendOtpRequest,
    FindIdVerifyOtpRequest,
    FindIdResponse,
    FindPwRequest,
    LoginRequest,
    SellerSignUpRequest,
    UserResponse
} from "@/api/auth.types";

/*
## API 통신 규칙

1. 모든 API 요청은 `src/api/axios.ts`의 `api` 인스턴스를 사용합니다.
    import api from "@/api/axios";

2. fetch, axios.create()를 새로 만들지 않습니다.
(토큰 재발급, 쿠키 설정이 이미 axios.ts에 구현되어 있음)

3. 도메인별로 src/api/{domain}.ts 파일을 만들어 함수를 작성합니다.
    예: api/user.ts, api/product.ts, api/order.ts

4. 응답 타입은 ApiResponse<T> 제네릭을 사용합니다.
    const { data } = await api.get<ApiResponse<UserResponse>>("/users/me");
return data.data;
*/

// ───────────────────────────────────────────
// 로그인
// ───────────────────────────────────────────

// 로그인 성공 시 서버가 쿠키로 토큰 발급
// 서버가 내려주는 메시지를 반환 (토스트 등에 사용 가능)
export const login = async (request: LoginRequest): Promise<void> => {
    await api.post<void>("/auth/login", request);
};

// ───────────────────────────────────────────
// 회원가입
// ───────────────────────────────────────────
// ───────────────────────────────────────────
// 바이어 회원가입
// ───────────────────────────────────────────
/**
 * 백엔드 @PostMapping("/signup/buyer")와 매핑되는 바이어 회원가입 요청입니다.
 */
export const signUpBuyer = async (request: BuyerSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/buyer", request);
};

/**
 * 백엔드 @PostMapping("/signup/seller")와 매핑되는 셀러 회원가입 요청입니다.
 */
export const signUpSeller = async (request: SellerSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/seller", request);
};

export const signUpEmployee = async (request: EmployeeSignUpRequest): Promise<void> => {
    await api.post<void>("/users/signup/employee", request);
}

// ───────────────────────────────────────────
// 로그아웃
// ───────────────────────────────────────────

export const logout = async (): Promise<void> => {
    // 백엔드의 @PostMapping("/logout")을 호출하여 서버가 쿠키 만료 헤더(maxAge=0)를 보내게 합니다.
    await api.post("/auth/logout");
};

// ───────────────────────────────────────────
// 내 정보 조회
// ───────────────────────────────────────────

export const getMe = async (): Promise<UserResponse> => {
    // 인터셉터가 .data.data를 이미 깠기 때문에,
    // 이제 여기서 data.data를 또 쓰지 않고 바로 받아온 결과(UserResponse)를 리턴합니다.
    return await api.get<UserResponse>("/users/me");
};

// ───────────────────────────────────────────
// 아이디 찾기 (휴대폰 본인인증)
// ───────────────────────────────────────────
/**
 * 이름 + 휴대폰 번호로 인증번호(OTP) 발송을 요청합니다.
 * "재전송" 버튼도 동일한 엔드포인트를 재호출하면 됩니다.
 */
export const sendFindIdOtp = async (request: FindIdSendOtpRequest): Promise<void> => {
    await api.post<void>("/auth/find-id/otp", request);
};

/**
 * 발송된 인증번호를 검증합니다.
 * 성공 시 마스킹된 이메일과 가입일을 반환받습니다.
 * (틀린 번호 입력 시 axios.ts 인터셉터가 백엔드 메시지를 error.message에 꽂아줍니다)
 */
export const verifyFindIdOtp = async (request: FindIdVerifyOtpRequest): Promise<FindIdResponse> => {
    return await api.post<FindIdResponse>("/auth/find-id/otp/verify", request);
};

// ───────────────────────────────────────────
// 비밀번호 찾기
// ───────────────────────────────────────────
/**
 * 이메일 + 이름이 일치하면 비밀번호 재설정 링크를 이메일로 발송합니다.
 */
export const requestFindPassword = async (request: FindPwRequest): Promise<void> => {
    await api.post<void>("/auth/find-pw", request);
};

// ───────────────────────────────────────────
// 공통 파일 업로드
// ───────────────────────────────────────────
/**
 * 파일을 multipart/form-data 형태로 백엔드에 업로드하고 저장된 S3 URL을 반환받습니다.
 */
export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    // API 규칙 4번 준수: ApiResponse<T> 형태로 받기
    // 백엔드가 업로드 성공 시 URL 문자열을 주거나 객체에 담아준다면 그에 맞춰 <string> 혹은 <{fileUrl: string}> 등으로 타입을 지정하세요.
    return await api.post<string>("/common/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }); // 업로드된 S3 URL 경로 반환
};