package kr.remerge.stylehub.domain.wishlist.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class WishlistDto {

    // 폴더 생성 요청
    @Getter
    public static class FolderCreateRequest {
        private String folderName;
    }

    // 폴더 응답
    @Getter
    @Builder
    public static class FolderResponse {
        private Integer wishlistFolderId;
        private String folderName;
        private Boolean isDefault;
        private Integer sortOrder;
        private Integer itemCount;
    }

    // 찜 추가 요청
    @Getter
    public static class AddRequest {
        private Integer productId;
        private Integer wishlistFolderId;
    }

    // 찜 항목 응답
    @Getter
    @Builder
    public static class ItemResponse {
        private Integer wishlistId;
        private Integer productId;
        private String productName;
        private String thumbnailUrl;
        private Long price;
        private String brandName;
        private String folderName;
    }

    // 폴더 + 항목 묶음 응답
    @Getter
    @Builder
    public static class FolderWithItemsResponse {
        private FolderResponse folder;
        private List<ItemResponse> items;
    }
}