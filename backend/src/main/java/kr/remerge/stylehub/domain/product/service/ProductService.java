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
import kr.remerge.stylehub.domain.product.entity.ProductOptionValue;
import kr.remerge.stylehub.domain.product.repository.ProductCertificationRepository;
import kr.remerge.stylehub.domain.product.repository.ProductImageRepository;
import kr.remerge.stylehub.domain.product.repository.ProductOptionRepository;
import kr.remerge.stylehub.domain.product.repository.ProductOptionValueRepository;
import kr.remerge.stylehub.domain.product.repository.ProductRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final ProductOptionValueRepository productOptionValueRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductCertificationRepository productCertificationRepository;

    // [CREATE] 상품 등록
    @Transactional
    public ProductDto.DetailResponse create(@LoginUser AuthUser userDetails, ProductDto.CreateRequest request) {
        User seller = userRepository.findById(userDetails.userId())
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

                // 옵션 name/value 쌍 저장 (예: 색상-옐로우, 색상-핑크, 마루세트-상의만)
                if (optReq.optionValues() != null && !optReq.optionValues().isEmpty()) {
                    int sortOrder = 0;
                    for (ProductDto.OptionValueRequest ov : optReq.optionValues()) {
                        productOptionValueRepository.save(
                                ProductOptionValue.builder()
                                        .productOption(saved)
                                        .optionName(ov.optionName())
                                        .optionValue(ov.optionValue())
                                        .sortOrder(sortOrder++)
                                        .createdAt(LocalDateTime.now())
                                        .build()
                        );
                    }
                }
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
        List<ProductCertification> savedCertifications = new ArrayList<>();
        if (request.certifications() != null && !request.certifications().isEmpty()) {
            for (ProductDto.CertificationRequest cert : request.certifications()) {
                if (cert.fileUrls() != null) {
                    for (String fileUrl : cert.fileUrls()) {
                        ProductCertification savedCert = productCertificationRepository.save(
                                ProductCertification.builder()
                                        .product(savedProduct)
                                        .certName(cert.certName())
                                        .fileUrl(fileUrl)
                                        .expiryYear(cert.expiryYear())
                                        .expiryMonth(cert.expiryMonth())
                                        .build()
                        );
                        savedCertifications.add(savedCert);
                    }
                }
            }
        }

        return ProductDto.DetailResponse.from(savedProduct, savedCertifications);
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
        List<ProductCertification> certifications = productCertificationRepository.findByProduct_ProductId(productId);
        return ProductDto.DetailResponse.from(product, certifications);
    }

    // [READ] 내 상품 목록 (셀러용)
    public List<ProductDto.SummaryResponse> getMy(@LoginUser AuthUser userDetails) {
        return productRepository.findBySeller_UserId(userDetails.userId())
                .stream()
                .map(ProductDto.SummaryResponse::from)
                .toList();
    }

    // [READ] 내 상품 관리 목록 (재고/인증서 포함, 셀러 상품관리 페이지 전용) [추가]
    public List<ProductDto.ManageResponse> getMyManaged(@LoginUser AuthUser userDetails) {
        return productRepository.findBySeller_UserId(userDetails.userId())
                .stream()
                .map(p -> {
                    List<ProductCertification> certs =
                            productCertificationRepository.findByProduct_ProductId(p.getProductId());
                    return ProductDto.ManageResponse.from(p, certs);
                })
                .toList();
    }

    // [READ] 신규 상품 (최근 등록순 6개)
    // [READ] 신규 상품 (최근 등록순 18개 - 6열 x 3줄)
    public List<ProductDto.SummaryResponse> getNewProducts() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .limit(18)
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

    // [UPDATE] 상품 수정 (카테고리/브랜드/옵션/이미지/인증서 전체 교체 지원)
    @Transactional
    public ProductDto.DetailResponse update(Integer productId, ProductDto.UpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));
        }
        Brand brand = null;
        if (request.brandId() != null) {
            brand = brandRepository.findById(request.brandId())
                    .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        }

        product.update(request, category, brand);

        // [추가] 옵션이 전달되면 기존 옵션(+옵션값+이미지) 전체 삭제 후 새로 저장
        if (request.options() != null) {
            for (ProductOption opt : product.getOptions()) {
                productImageRepository.deleteAll(opt.getImages());
                productOptionValueRepository.deleteAll(opt.getOptionValues());
            }
            productOptionRepository.deleteAll(product.getOptions());
            productOptionRepository.flush(); // [추가] 삭제를 즉시 DB에 반영 (동일 SKU 재사용 시 유니크 제약 충돌 방지)

            ProductOption firstSavedOption = null;
            for (ProductDto.OptionRequest optReq : request.options()) {
                ProductOption option = ProductOption.builder()
                        .product(product)
                        .optionLabel(optReq.optionLabel())
                        .sku(optReq.sku())
                        .stockQuantity(optReq.stockQuantity() != null ? optReq.stockQuantity() : 0)
                        .additionalPrice(optReq.additionalPrice() != null ? optReq.additionalPrice() : 0L)
                        .restockAlertQuantity(optReq.restockAlertQuantity())
                        .build();
                ProductOption saved = productOptionRepository.save(option);
                if (firstSavedOption == null) firstSavedOption = saved;

                if (optReq.optionValues() != null && !optReq.optionValues().isEmpty()) {
                    int sortOrder = 0;
                    for (ProductDto.OptionValueRequest ov : optReq.optionValues()) {
                        productOptionValueRepository.save(
                                ProductOptionValue.builder()
                                        .productOption(saved)
                                        .optionName(ov.optionName())
                                        .optionValue(ov.optionValue())
                                        .sortOrder(sortOrder++)
                                        .createdAt(LocalDateTime.now())
                                        .build()
                        );
                    }
                }
            }

            // [추가] 이미지도 옵션과 함께 전달된 경우에만 재생성 (첫 옵션에 연결)
            if (request.imageUrls() != null && !request.imageUrls().isEmpty() && firstSavedOption != null) {
                for (int i = 0; i < request.imageUrls().size(); i++) {
                    productImageRepository.save(
                            ProductImage.builder()
                                    .productOption(firstSavedOption)
                                    .imageUrl(request.imageUrls().get(i))
                                    .sortOrder(i)
                                    .isMain(i == 0)
                                    .build()
                    );
                }
            }
        }

        // [추가] 인증서가 전달되면 기존 인증서 전체 삭제 후 새로 저장
        if (request.certifications() != null) {
            List<ProductCertification> existingCerts =
                    productCertificationRepository.findByProduct_ProductId(productId);
            productCertificationRepository.deleteAll(existingCerts);

            for (ProductDto.CertificationRequest cert : request.certifications()) {
                if (cert.fileUrls() != null) {
                    for (String fileUrl : cert.fileUrls()) {
                        productCertificationRepository.save(
                                ProductCertification.builder()
                                        .product(product)
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

        List<ProductCertification> certifications = productCertificationRepository.findByProduct_ProductId(productId);
        return ProductDto.DetailResponse.from(product, certifications);
    }

    // [UPDATE] 판매 중지/재개 (실제 삭제 없이 노출만 제어, 주문 이력 있는 상품에도 안전)
    @Transactional
    public void setActive(Integer productId, boolean active) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        product.setActive(active);
    }

    // [DELETE] 상품 삭제 (옵션/이미지/옵션값/인증서까지 함께 삭제)
    @Transactional
    public void delete(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 자식 데이터 먼저 삭제 (FK 제약 위반 방지)
        for (ProductOption opt : product.getOptions()) {
            productImageRepository.deleteAll(opt.getImages());
            productOptionValueRepository.deleteAll(opt.getOptionValues());
        }

        List<ProductCertification> certifications =
                productCertificationRepository.findByProduct_ProductId(productId);
        productCertificationRepository.deleteAll(certifications);

        try {
            productOptionRepository.deleteAll(product.getOptions());
            productOptionRepository.flush();
            productRepository.delete(product);
        } catch (DataIntegrityViolationException e) {
            // 주문/장바구니 등에서 이 상품의 옵션을 참조 중이면 FK 제약으로 삭제 불가
            throw new IllegalStateException("이미 주문된 이력이 있는 상품은 삭제할 수 없습니다. 판매 중지(숨김) 처리를 이용해 주세요.");
        }
    }
}