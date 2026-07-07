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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final JdbcTemplate jdbcTemplate;

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

        return ProductDto.DetailResponse.from(savedProduct, savedCertifications, java.util.Collections.emptyMap());
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

        // [추가] 각 옵션이 주문/장바구니에서 참조 중인지 미리 계산 (프론트에서 수정 잠금 표시용)
        java.util.Map<Integer, Boolean> hasOrdersByOptionId = product.getOptions().stream()
                .collect(java.util.stream.Collectors.toMap(
                        ProductOption::getProductOptionId,
                        opt -> isOptionReferencedInOrdersOrCarts(opt.getProductOptionId())
                ));

        return ProductDto.DetailResponse.from(product, certifications, hasOrdersByOptionId);
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

        // [수정] 옵션이 전달되면 "조합(옵션값 세트)"을 키로 매칭해서
        //  - 기존에 있던 조합 → 그대로 두고 필드(재고/가격/SKU 등)만 갱신
        //  - 새로 추가된 조합 → 새로 생성
        //  - 목록에서 빠진 조합 → 삭제 시도, 주문/장바구니에서 참조 중이라 FK로 막히면 삭제 대신 비활성화(is_active=false)
        // 이렇게 하면 이미 주문/장바구니에 걸린 옵션이 있어도 다른 필드(설명, 가격 등) 수정이 막히지 않음
        if (request.options() != null) {
            Map<String, ProductOption> existingByComboKey = product.getOptions().stream()
                    .collect(Collectors.toMap(this::buildComboKeyFromEntity, o -> o, (a, b) -> a));

            java.util.Set<Integer> matchedOptionIds = new java.util.HashSet<>();
            ProductOption imageCarrierOption = null; // 이미지들을 붙일 대표 옵션 (기존 이미지 있는 옵션 우선)

            for (ProductDto.OptionRequest optReq : request.options()) {
                String comboKey = buildComboKeyFromRequest(optReq.optionValues());
                ProductOption existing = existingByComboKey.get(comboKey);

                if (existing != null) {
                    // 기존 조합 → 필드만 갱신 (row 자체는 유지되므로 FK 참조 안전)
                    existing.updateFields(
                            optReq.optionLabel(),
                            optReq.sku(),
                            optReq.stockQuantity() != null ? optReq.stockQuantity() : 0,
                            optReq.additionalPrice() != null ? optReq.additionalPrice() : 0L,
                            optReq.restockAlertQuantity()
                    );
                    existing.setActive(true); // 다시 살아난 조합이면 활성화
                    matchedOptionIds.add(existing.getProductOptionId());
                    if (imageCarrierOption == null && !existing.getImages().isEmpty()) {
                        imageCarrierOption = existing;
                    }
                } else {
                    // 새로운 조합 → 신규 생성
                    ProductOption newOption = ProductOption.builder()
                            .product(product)
                            .optionLabel(optReq.optionLabel())
                            .sku(optReq.sku())
                            .stockQuantity(optReq.stockQuantity() != null ? optReq.stockQuantity() : 0)
                            .additionalPrice(optReq.additionalPrice() != null ? optReq.additionalPrice() : 0L)
                            .restockAlertQuantity(optReq.restockAlertQuantity())
                            .build();
                    ProductOption saved = productOptionRepository.save(newOption);
                    matchedOptionIds.add(saved.getProductOptionId());

                    if (optReq.optionValues() != null) {
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
                    if (imageCarrierOption == null) imageCarrierOption = saved;
                }
            }

            // 목록에서 빠진(=더 이상 조합에 없는) 기존 옵션 처리
            // [수정] "일단 삭제 시도 → 실패하면 catch"는 flush 실패 시 세션(트랜잭션)이 불안정해질 수 있어 위험함.
            // 대신 삭제 전에 미리 cart_items/order_items에 참조가 있는지 확인해서 분기함 (더 안전)
            for (ProductOption opt : new ArrayList<>(product.getOptions())) {
                if (matchedOptionIds.contains(opt.getProductOptionId())) continue;

                if (isOptionReferencedInOrdersOrCarts(opt.getProductOptionId())) {
                    // 주문/장바구니에서 참조 중 → 삭제하지 않고 비활성화만 처리
                    opt.setActive(false);
                } else {
                    productImageRepository.deleteAll(opt.getImages());
                    productOptionValueRepository.deleteAll(opt.getOptionValues());
                    productOptionRepository.delete(opt);
                }
            }

            // 이미지는 대표 옵션(imageCarrierOption)에만 재연결
            if (request.imageUrls() != null && imageCarrierOption != null) {
                productImageRepository.deleteAll(imageCarrierOption.getImages());
                for (int i = 0; i < request.imageUrls().size(); i++) {
                    productImageRepository.save(
                            ProductImage.builder()
                                    .productOption(imageCarrierOption)
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

        // [추가] 응답을 만들 때도 최신 옵션 목록 기준으로 hasOrders 재계산
        java.util.Map<Integer, Boolean> hasOrdersByOptionId = product.getOptions().stream()
                .collect(Collectors.toMap(
                        ProductOption::getProductOptionId,
                        opt -> isOptionReferencedInOrdersOrCarts(opt.getProductOptionId())
                ));

        return ProductDto.DetailResponse.from(product, certifications, hasOrdersByOptionId);
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

    // [추가] 이 옵션이 order_items 또는 cart_items에서 참조되고 있는지 확인 (삭제 가능 여부 사전 판단용)
    private boolean isOptionReferencedInOrdersOrCarts(Integer productOptionId) {
        Integer orderCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_items WHERE product_option_id = ?", Integer.class, productOptionId);
        Integer cartCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM cart_items WHERE product_option_id = ?", Integer.class, productOptionId);
        return (orderCount != null && orderCount > 0) || (cartCount != null && cartCount > 0);
    }

    // [추가] 기존 옵션(DB)의 옵션값 조합을 정렬해서 키 문자열로 변환 (예: "색상:블랙|사이즈:M")
    private String buildComboKeyFromEntity(ProductOption option) {
        return option.getOptionValues().stream()
                .sorted(Comparator.comparing(ProductOptionValue::getOptionName))
                .map(v -> v.getOptionName() + ":" + v.getOptionValue())
                .collect(Collectors.joining("|"));
    }

    // [추가] 요청으로 들어온 옵션값 조합을 같은 방식으로 키 문자열로 변환 (매칭용, 위 메서드와 반드시 동일 로직 유지)
    private String buildComboKeyFromRequest(List<ProductDto.OptionValueRequest> optionValues) {
        if (optionValues == null) return "";
        return optionValues.stream()
                .sorted(Comparator.comparing(ProductDto.OptionValueRequest::optionName))
                .map(v -> v.optionName() + ":" + v.optionValue())
                .collect(Collectors.joining("|"));
    }
}
