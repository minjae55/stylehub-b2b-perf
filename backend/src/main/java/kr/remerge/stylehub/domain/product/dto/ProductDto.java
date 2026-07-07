package kr.remerge.stylehub.domain.product.dto;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductImage;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.product.entity.ProductOptionValue;
import kr.remerge.stylehub.domain.product.entity.ProductCertification;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

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
            Integer restockAlertQuantity,
            List<OptionValueRequest> optionValues // 옵션 name/value 쌍 목록 (예: 색상-옐로우, 마루세트-상의만)
    ) {}

    // ───────────────────────────────────────────
    // [CREATE] 옵션 name/value 쌍 요청
    // ───────────────────────────────────────────
    public record OptionValueRequest(
            String optionName,
            String optionValue
    ) {}

    // ───────────────────────────────────────────
    // [UPDATE] 상품 수정 요청
    // ───────────────────────────────────────────
    public record UpdateRequest(
            Integer categoryId,        // [추가] null이면 카테고리 변경 안 함
            Integer brandId,           // [추가] null이면 브랜드 변경 안 함
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
            List<String> imageUrls,                 // [추가] null이면 이미지 변경 안 함, 값이 있으면 전체 교체
            List<OptionRequest> options,             // [추가] null이면 옵션 변경 안 함, 값이 있으면 전체 교체
            List<CertificationRequest> certifications // [추가] null이면 인증서 변경 안 함, 값이 있으면 전체 교체
    ) {}

    // ───────────────────────────────────────────
    // [UPDATE] 판매 중지/재개 요청 [추가]
    // ───────────────────────────────────────────
    public record SetActiveRequest(
            Boolean isActive
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
            List<OptionResponse> options,
            List<CertificationResponse> certifications,
            Boolean isActive
    ) {
        public static DetailResponse from(Product p, List<ProductCertification> certifications) {
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
                    p.getOptions().stream().map(OptionResponse::from).toList(),
                    certifications.stream().map(CertificationResponse::from).toList(),
                    p.getIsActive()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 인증서
    // ───────────────────────────────────────────
    public record CertificationResponse(
            String certName,
            String fileUrl,
            Integer expiryYear,
            Integer expiryMonth
    ) {
        public static CertificationResponse from(ProductCertification cert) {
            return new CertificationResponse(
                    cert.getCertName(),
                    cert.getFileUrl(),
                    cert.getExpiryYear(),
                    cert.getExpiryMonth()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 상품 목록용 요약
    // ───────────────────────────────────────────
    public record SummaryResponse(
            Integer productId,
            String productName,
            String productEngName,
            Integer brandId,
            String brandName,
            Integer categoryId,
            String categoryName,
            Integer parentCategoryId,
            String parentCategoryName,
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
                    cat.getCategoryName(),
                    parent != null ? parent.getCategoryId() : null,
                    parent != null ? parent.getCategoryName() : null,
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
    // [RESPONSE] 셀러 상품 관리 페이지 전용 요약 [추가]
    // ───────────────────────────────────────────
    public record ManageResponse(
            Integer productId,
            String productName,
            String brandName,
            String categoryName,
            Long unitPrice,
            Integer moq,
            Integer totalStock,
            Integer stockAlertThreshold,
            Boolean isLowStock,
            String mainImageUrl,
            LocalDateTime createdAt,
            Integer certExpiryYear,
            Integer certExpiryMonth,
            Boolean isActive
    ) {
        public static ManageResponse from(Product p, List<ProductCertification> certs) {
            int totalStock = p.getOptions().stream()
                    .mapToInt(o -> o.getStockQuantity() != null ? o.getStockQuantity() : 0)
                    .sum();

            Integer alertThreshold = p.getOptions().stream()
                    .map(ProductOption::getRestockAlertQuantity)
                    .filter(Objects::nonNull)
                    .min(Integer::compareTo)
                    .orElse(null);

            boolean isLowStock = alertThreshold != null && totalStock <= alertThreshold;

            String mainImageUrl = p.getOptions().stream()
                    .flatMap(opt -> opt.getImages().stream())
                    .filter(ProductImage::getIsMain)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(null);

            // 가장 임박한 인증서 만료 (연/월 기준)
            ProductCertification nearest = certs.stream()
                    .filter(c -> c.getExpiryYear() != null && c.getExpiryMonth() != null)
                    .min(Comparator.comparingInt(c -> c.getExpiryYear() * 100 + c.getExpiryMonth()))
                    .orElse(null);

            return new ManageResponse(
                    p.getProductId(),
                    p.getProductName(),
                    p.getBrand().getBrandName(),
                    p.getCategory().getCategoryName(),
                    p.getUnitPrice(),
                    p.getMoq(),
                    totalStock,
                    alertThreshold,
                    isLowStock,
                    mainImageUrl,
                    p.getCreatedAt(),
                    nearest != null ? nearest.getExpiryYear() : null,
                    nearest != null ? nearest.getExpiryMonth() : null,
                    p.getIsActive()
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
            List<ImageResponse> images,
            List<OptionValueResponse> optionValues
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
                    opt.getImages().stream().map(ImageResponse::from).toList(),
                    opt.getOptionValues().stream().map(OptionValueResponse::from).toList()
            );
        }
    }

    // ───────────────────────────────────────────
    // [RESPONSE] 옵션 name/value 쌍
    // ───────────────────────────────────────────
    public record OptionValueResponse(
            String optionName,
            String optionValue,
            Integer sortOrder
    ) {
        public static OptionValueResponse from(ProductOptionValue ov) {
            return new OptionValueResponse(
                    ov.getOptionName(),
                    ov.getOptionValue(),
                    ov.getSortOrder()
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