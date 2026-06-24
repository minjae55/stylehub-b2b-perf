// 성공 응답 예시
// GET /api/users/me 성공
// {
//   "success": true,
//   "data": { "userId": 1, "email": "test@test.com", ... },
//   "message": null
// }

// @Valid 실패 응답 예시
// POST /api/users/signup/buyer 에서 이메일 형식 틀렸을 때
// {
//   "status": 400,
//   "code": "INVALID_INPUT",
//   "message": "잘못된 입력값입니다.",
//   "fieldErrors": {
//     "email": "이메일 형식이 올바르지 않습니다.",
//     "password": "비밀번호는 8자 이상이어야 합니다."
//   }
// }

// 일반 에러 응답 예시
// POST /api/auth/login 에서 비밀번호 틀렸을 때
// {
//   "status": 401,
//   "code": "INVALID_PASSWORD",
//   "message": "비밀번호가 올바르지 않습니다.",
//   "fieldErrors": null
// }

// ───────────────────────────────────────────
// 공통 응답 타입
// 백엔드 GlobalExceptionHandler, ApiResponse와 1:1 매핑
// 팀 전체가 이 타입을 기준으로 사용
// ───────────────────────────────────────────

// 백엔드 ApiResponse<T>와 동일한 구조
// 모든 성공 응답이 이 형태로 내려옴
// {
//   "success": true,
//   "data": { ... },     ← 실제 데이터 (T)
//   "message": null
// }
export interface ApiResponse<T> {
    success: boolean;   // 요청 성공 여부
    data: T;            // 실제 응답 데이터 (제네릭)
    message: string | null; // 성공 메시지 (주로 null, 로그아웃 등 데이터 없는 응답에서 사용)
}

// 백엔드 ErrorResponse와 동일한 구조
// 4xx, 5xx 에러 발생 시 이 형태로 내려옴
// {
//   "status": 404,
//   "code": "USER_NOT_FOUND",
//   "message": "유저를 찾을 수 없습니다.",
//   "fieldErrors": null
// }
export interface ErrorResponse {
    status: number;     // HTTP 상태 코드 (400, 401, 404, 500 등)
    code: string;       // 백엔드 ErrorCode enum 이름 (예: USER_NOT_FOUND, DUPLICATE_EMAIL)
    message: string;    // 사용자에게 보여줄 한국어 에러 메시지
    fieldErrors: Record<string, string> | null;
    // @Valid 유효성 검사 실패 시 필드별 에러 메시지
    // 예: { "email": "이메일 형식이 올바르지 않습니다.", "password": "8자 이상이어야 합니다." }
    // 일반 에러는 null
}