package kr.remerge.stylehub.domain.category.dto.response;

import kr.remerge.stylehub.domain.category.entity.Category;

public record CategoryResponse(
        Integer id,
        String name,
        String group
) {
    public static CategoryResponse from(Category category) {
        // ID나 이름을 기반으로 프론트 UI용 group("의류" / "잡화")을 지정해 줍니다.
        String resolvedGroup = resolveGroup(category.getCategoryName());

        return new CategoryResponse(
                category.getCategoryId(),
                category.getCategoryName(),
                resolvedGroup
        );
    }

    private static String resolveGroup(String categoryName) {
        // 간단한 분기 처리 예시 (실제 대분류 구성에 맞게 매핑하시면 됩니다)
        if (categoryName.matches("상의|하의|아우터|원피스.*")) {
            return "의류";
        }
        return "잡화";
    }
}