package kr.remerge.stylehub.domain.product.dto;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductImage;
import kr.remerge.stylehub.domain.product.entity.ProductOption;

import java.time.LocalDateTime;
import java.util.List;

public class ProductDto {

    // ───────────────────────────────────────────
    // [CREATE] 인증서 요청
    // ───────────────────────────────────────────
    public record CertificationRequest(
            String certName,
            List<String> fileUrls,
            Integer expiryYear,
            Integer expiryMonth
    ) {}

    // ───────────────────────────────────────────
    // [CREATE] 상품 등록 요청
    // ───────────────────────────────────────────
    public record CreateRequest(
            Integer categoryId,
            Integer brandId,
            String productName,
            String productEngName,
            String returnPolicy,
            String season,
            Integer moq,
            Long unitPrice,
            Integer leadTimeDays,
            String mainMaterial,
            String materialCert,
            String description,
            String careInstruction,
            String productUrl,
            Boolean oemAvailable,
            Boolean sampleAvailable,
            Boolean whiteLabel,
            List<String> imageUrls,
            List<OptionRequest> options,
            List<CertificationRequest> certifications
    ) {}

    // ───────────────────────────────────────────
    // [CREATE] 옵션 요청
    // ───────────────────────────────────────────
    public record OptionRequest(
            String optionLabel,
            String sku,
            Integer stockQuantity,
            Long additionalPrice,
            Integer restockAlertQuantity
    ) {}

    // ───────────────────────────────────────────
    // [UPDATE] 상품 수정 요청
    // ───────────────────────────────────────────
    public record UpdateRequest(
            String productName,
            String productEngName,
            String returnPolicy,
            String season,
            Integer moq,
            Long unitPrice,
            Integer leadTimeDays,
            String mainMaterial,
            String materialCert,
            String description,
            String careInstruction,
            String productUrl,
            Boolean oemAvailable,
            Boolean sampleAvailable,
            Boolean whiteLabel
    ) {}

    // ───────────────────────────────────────────
    // [RESPONSE] 상품 단건 상세
    // ───────────────────────────────────────────
    public record DetailResponse(
            Integer productId,
            Integer sellerId,
            Integer companyId,
            Integer categoryId,
            String categoryName,
            Integer brandId,
            String brandName,
            String productName,
            String productEngName,
            String returnPolicy,
            Integer viewCount,
            String season,
            Integer moq,
            Long unitPrice,
            Integer leadTimeDays,
            String mainMaterial,
            String materialCert,
            String description,
            String careInstruction,
            String productUrl,
            Boolean oemAvailable,
            Boolean sampleAvailable,
            Boolean whiteLabel,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<OptionResponse> options
    ) {
        public static DetailResponse from(Product p) {
            return new DetailResponse(
                    p.getProductId(),
                    p.getSeller().getUserId(),
                    p.getCompany() != null ? p.getCompany().getCompanyId() : null,
                    p.getCategory().getCategoryId(),
                    p.getCategory().getCategoryName(),
                    p.getBrand().getBrandId(),
                    p.getBrand().getBrandName(),
                    p.getProductName(),
                    p.getProductEngName(),
                    p.getReturnPolicy(),
                    p.getViewCount(),
                    p.getSeason(),
                    p.getMoq(),
                    p.getUnitPrice(),
                    p.getLeadTimeDays(),
                    p.getMainMaterial(),
                    p.getMaterialCert(),
                    p.getDescription(),
                    p.getCareInstruction(),
                    p.getProductUrl(),
                    p.getOemAvailable(),
                    p.getSampleAvailable(),
                    p.getWhiteLabel(),
                    p.getCreatedAt(),
                    p.getUpdatedAt(),
                    p.getOptions().stream().map(OptionResponse::from).toList()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 상품 목록용 요약 [수정]
    // ───────────────────────────────────────────
    public record SummaryResponse(
            Integer productId,
            String productName,
            String productEngName,
            Integer brandId,
            String brandName,
            Integer categoryId,
            String categoryName,        // [추가]
            Integer parentCategoryId,   // [추가] null이면 자기자신이 대분류
            String parentCategoryName,  // [추가]
            Long unitPrice,
            Integer moq,
            Boolean oemAvailable,
            Boolean sampleAvailable,
            String mainImageUrl,
            LocalDateTime createdAt
    ) {
        public static SummaryResponse from(Product p) {
            String mainImageUrl = p.getOptions().stream()
                    .flatMap(opt -> opt.getImages().stream())
                    .filter(ProductImage::getIsMain)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(null);

            Category cat = p.getCategory();
            Category parent = cat.getParent();

            return new SummaryResponse(
                    p.getProductId(),
                    p.getProductName(),
                    p.getProductEngName(),
                    p.getBrand().getBrandId(),
                    p.getBrand().getBrandName(),
                    cat.getCategoryId(),
                    cat.getCategoryName(),                                    // [추가]
                    parent != null ? parent.getCategoryId() : null,           // [추가]
                    parent != null ? parent.getCategoryName() : null,         // [추가]
                    p.getUnitPrice(),
                    p.getMoq(),
                    p.getOemAvailable(),
                    p.getSampleAvailable(),
                    mainImageUrl,
                    p.getCreatedAt()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 옵션
    // ───────────────────────────────────────────
    public record OptionResponse(
            Integer productOptionId,
            String optionLabel,
            String sku,
            Integer stockQuantity,
            Long additionalPrice,
            Integer restockAlertQuantity,
            Boolean isActive,
            List<ImageResponse> images
    ) {
        public static OptionResponse from(ProductOption opt) {
            return new OptionResponse(
                    opt.getProductOptionId(),
                    opt.getOptionLabel(),
                    opt.getSku(),
                    opt.getStockQuantity(),
                    opt.getAdditionalPrice(),
                    opt.getRestockAlertQuantity(),
                    opt.getIsActive(),
                    opt.getImages().stream().map(ImageResponse::from).toList()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 이미지
    // ───────────────────────────────────────────
    public record ImageResponse(
            Integer productImageId,
            String imageUrl,
            Integer sortOrder,
            Boolean isMain
    ) {
        public static ImageResponse from(ProductImage img) {
            return new ImageResponse(
                    img.getProductImageId(),
                    img.getImageUrl(),
                    img.getSortOrder(),
                    img.getIsMain()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] Cart 연동 DTO
    // ───────────────────────────────────────────
    public record CartDto(
            Integer productId,
            String productName,
            String productEngName,
            Long unitPrice,
            Integer moq,
            Boolean oemAvailable,
            Boolean sampleAvailable,
            String mainImageUrl,
            SelectedOption selectedOption
    ) {
        public record SelectedOption(
                Integer productOptionId,
                String optionLabel,
                Long additionalPrice,
                Integer stockQuantity
        ) {}

        public static CartDto from(Product p, ProductOption opt) {
            String mainImageUrl = opt.getImages().stream()
                    .filter(ProductImage::getIsMain)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(null);

            return new CartDto(
                    p.getProductId(),
                    p.getProductName(),
                    p.getProductEngName(),
                    p.getUnitPrice(),
                    p.getMoq(),
                    p.getOemAvailable(),
                    p.getSampleAvailable(),
                    mainImageUrl,
                    new SelectedOption(
                            opt.getProductOptionId(),
                            opt.getOptionLabel(),
                            opt.getAdditionalPrice(),
                            opt.getStockQuantity()
                    )
            );
        }
    }
}
