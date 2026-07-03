// ==========================================
// [성공 응답 예시] GET /api/users/me 성공 시
// ==========================================
// {
//   "success": true,
//   "data": { "userId": 1, "email": "test@test.com", "businessRole": "BUYER" }
// }

// ==========================================
// [@Valid 검증 실패 응답 예시] POST /api/users/signup/buyer
// ==========================================
// {
//   "success": false,
//   "code": "COMMON_001",              // ErrorCode.INVALID_INPUT의 고유 코드
//   "message": "잘못된 입력값입니다.",
//   "data": {
//     "email": "이메일 형식이 올바르지 않습니다.",
//     "password": "비밀번호는 8자 이상이어야 합니다."
//   }
// }

// ==========================================
// [일반 비즈니스 에러 응답 예시] POST /api/auth/login
// ==========================================
// {
//   "success": false,
//   "code": "USER_002",                // ErrorCode.INVALID_PASSWORD의 고유 코드
//   "message": "비밀번호가 올바르지 않습니다."
// }

// ───────────────────────────────────────────
// 공통 응답 타입 (백엔드 ApiResponse와 1:1 매핑)
// ───────────────────────────────────────────

/** 모든 성공 응답 스펙 */
export interface ApiResponse<T> {
    success: true;
    data: T;            // 실제 백엔드에서 내려주는 데이터 (제네릭)
    message?: string | null;
    code?: string | null;
}

/** 4xx, 5xx 에러 발생 시 백엔드가 내려주는 공통 에러 스펙 */
export interface ErrorResponse {
    success: false;
    code: string;                          // 백엔드 ErrorCode (예: USER_001, COMMON_001)
    message: string;                       // 사용자에게 노출할 한국어 에러 메시지
    data?: Record<string, string> | any | null; // @Valid 검증 실패 시 { 필드명: 에러메시지 } 형태의 맵 혹은 커스텀 에러 DTO
}