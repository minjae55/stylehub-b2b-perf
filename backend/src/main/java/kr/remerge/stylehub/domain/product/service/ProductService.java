package kr.remerge.stylehub.domain.product.service;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.product.dto.ProductDto;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductCertification;
import kr.remerge.stylehub.domain.product.entity.ProductImage;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.product.repository.ProductCertificationRepository;
import kr.remerge.stylehub.domain.product.repository.ProductImageRepository;
import kr.remerge.stylehub.domain.product.repository.ProductOptionRepository;
import kr.remerge.stylehub.domain.product.repository.ProductRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductOptionRepository productOptionRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductCertificationRepository productCertificationRepository;

    // [CREATE] 상품 등록
    @Transactional
    public ProductDto.DetailResponse create(CustomUserDetails userDetails, ProductDto.CreateRequest request) {
        User seller = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));
        Brand brand = brandRepository.findById(request.brandId())
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));

        Product product = Product.builder()
                .seller(seller)
                .company(seller.getCompany())
                .category(category)
                .brand(brand)
                .productName(request.productName())
                .productEngName(request.productEngName())
                .returnPolicy(request.returnPolicy())
                .season(request.season())
                .moq(request.moq())
                .unitPrice(request.unitPrice())
                .leadTimeDays(request.leadTimeDays())
                .mainMaterial(request.mainMaterial())
                .materialCert(request.materialCert())
                .description(request.description())
                .careInstruction(request.careInstruction())
                .productUrl(request.productUrl())
                .oemAvailable(request.oemAvailable() != null ? request.oemAvailable() : false)
                .sampleAvailable(request.sampleAvailable() != null ? request.sampleAvailable() : false)
                .whiteLabel(request.whiteLabel() != null ? request.whiteLabel() : false)
                .build();

        Product savedProduct = productRepository.save(product);

        // 옵션 저장 후 첫 번째 옵션에 이미지 연결
        ProductOption firstSavedOption = null;
        if (request.options() != null && !request.options().isEmpty()) {
            for (ProductDto.OptionRequest optReq : request.options()) {
                ProductOption option = ProductOption.builder()
                        .product(savedProduct)
                        .optionLabel(optReq.optionLabel())
                        .sku(optReq.sku())
                        .stockQuantity(optReq.stockQuantity() != null ? optReq.stockQuantity() : 0)
                        .additionalPrice(optReq.additionalPrice() != null ? optReq.additionalPrice() : 0L)
                        .restockAlertQuantity(optReq.restockAlertQuantity())
                        .build();
                ProductOption saved = productOptionRepository.save(option);
                if (firstSavedOption == null) firstSavedOption = saved;
            }
        }

        if (request.imageUrls() != null && !request.imageUrls().isEmpty() && firstSavedOption != null) {
            for (int i = 0; i < request.imageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .productOption(firstSavedOption)
                        .imageUrl(request.imageUrls().get(i))
                        .sortOrder(i)
                        .isMain(i == 0)
                        .build();
                productImageRepository.save(image);
            }
        }

        // 인증서 저장
        if (request.certifications() != null && !request.certifications().isEmpty()) {
            for (ProductDto.CertificationRequest cert : request.certifications()) {
                if (cert.fileUrls() != null) {
                    for (String fileUrl : cert.fileUrls()) {
                        productCertificationRepository.save(
                                ProductCertification.builder()
                                        .product(savedProduct)
                                        .certName(cert.certName())
                                        .fileUrl(fileUrl)
                                        .expiryYear(cert.expiryYear())
                                        .expiryMonth(cert.expiryMonth())
                                        .build()
                        );
                    }
                }
            }
        }

        return ProductDto.DetailResponse.from(savedProduct);
    }

    // [READ] 전체 상품 목록
    public List<ProductDto.SummaryResponse> getAll() {
        return productRepository.findAll()
                .stream()
                .map(ProductDto.SummaryResponse::from)
                .toList();
    }

    // [READ] 상품 단건 조회 (조회수 증가)
    @Transactional
    public ProductDto.DetailResponse getById(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        product.increaseViewCount();
        return ProductDto.DetailResponse.from(product);
    }

    // [READ] 내 상품 목록 (셀러용)
    public List<ProductDto.SummaryResponse> getMy(CustomUserDetails userDetails) {
        return productRepository.findBySeller_UserId(userDetails.getUserId())
                .stream()
                .map(ProductDto.SummaryResponse::from)
                .toList();
    }

    // [READ] 신규 상품 (최근 등록순 6개)
    public List<ProductDto.SummaryResponse> getNewProducts() {
        return productRepository.findTop6ByOrderByCreatedAtDesc()
                .stream()
                .map(ProductDto.SummaryResponse::from)
                .toList();
    }

    // [READ] 인기 상품 (7일 내 조회수 높은 순 5개)
    public List<ProductDto.SummaryResponse> getPopularProducts() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        return productRepository.findTop5ByViewCountSince(since, PageRequest.of(0, 5))
                .stream()
                .map(ProductDto.SummaryResponse::from)
                .toList();
    }

    // [UPDATE] 상품 수정
    @Transactional
    public ProductDto.DetailResponse update(Integer productId, ProductDto.UpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        product.update(request);
        return ProductDto.DetailResponse.from(product);
    }

    // [DELETE] 상품 삭제
    @Transactional
    public void delete(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        productRepository.delete(product);
    }
}
