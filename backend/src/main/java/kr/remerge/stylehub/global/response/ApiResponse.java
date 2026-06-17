package kr.remerge.stylehub.global.response;

import lombok.Getter;

// 성공 응답 시 클라이언트에게 반환하는 공통 형식
@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;

    private ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    // 데이터 있는 성공 응답
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    // 데이터 없는 성공 응답 (삭제, 수정 등)
    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, null);
    }

    // 메시지만 있는 성공 응답
    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, null, message);
    }
}