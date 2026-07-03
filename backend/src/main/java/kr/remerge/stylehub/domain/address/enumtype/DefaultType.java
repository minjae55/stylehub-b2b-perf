package kr.remerge.stylehub.domain.address.enumtype;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DefaultType {
    RETURN,     // 회사 공통 기본 반품지
    SHIPPING,   // 내 기본 출고지
    RECEIVING;  // 내 기본 수령지

    // 프론트엔드가 던져준 소문자 문자열을 대문자 Enum 객체로 안전하게 변환해 줍니다.
    @JsonCreator
    public static DefaultType from(String value) {
        return DefaultType.valueOf(value.toUpperCase());
    }

    // 백엔드에서 다시 프론트엔드로 나갈 때 소문자로 직렬화하고 싶다면 추가
    @JsonValue
    public String toValue() {
        return this.name().toLowerCase();
    }
}