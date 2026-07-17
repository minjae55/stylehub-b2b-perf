package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.product.repository.ProductOptionRepository;
import kr.remerge.stylehub.domain.product.repository.ProductRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

import static kr.remerge.stylehub.seed.SeedUtils.pick;

@Component
@RequiredArgsConstructor
public class ProductSeeder {

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final Faker faker = new Faker(new Locale("ko"));

    public record Products(List<Product> products, List<ProductOption> options) {
    }

    public Products seed(List<User> sellerUsers, List<Brand> brands,
                          List<Category> categories, int count) {
        List<Product> products = createProducts(sellerUsers, brands, categories, count);
        List<ProductOption> options = createProductOptions(products);
        return new Products(products, options);
    }

    private List<Product> createProducts(List<User> sellerUsers, List<Brand> brands,
                                          List<Category> categories, int count) {

        List<Product> toSave = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            User seller = pick(sellerUsers);
            Company company = seller.getCompany();
            Brand brand = brands.stream()
                    .filter(b ->
                            b.getCompany().getCompanyId().equals(company.getCompanyId()))
                    .findFirst()
                    .orElseThrow();

            Category category = pick(categories);

            toSave.add(Product.builder()
                    .seller(seller)
                    .company(company)
                    .category(category)
                    .brand(brand)
                    .productName(faker.commerce().productName())
                    .moq(ThreadLocalRandom.current().nextInt(10, 200))
                    .unitPrice((long) ThreadLocalRandom.current().nextInt(5000, 100000))
                    .leadTimeDays(ThreadLocalRandom.current().nextInt(1, 14))
                    .mainMaterial(faker.commerce().material())
                    .description(faker.lorem().sentence())
                    .sampleAvailable(true)
                    .isActive(true)
                    .build());
        }
        return productRepository.saveAll(toSave);
    }

    private List<ProductOption> createProductOptions(List<Product> products) {
        List<ProductOption> toSave = new ArrayList<>();

        for (Product product : products) {
            for (int j = 0; j < 3; j++) {
                toSave.add(ProductOption.builder()
                        .product(product)
                        .optionLabel("옵션" + (j + 1))
                        .sku("SKU-" + product.getProductId() + "-" + (j + 1))
                        .stockQuantity(ThreadLocalRandom.current().nextInt(0, 1000))
                        .additionalPrice(0L)
                        .isActive(true)
                        .build());
            }
        }
        return productOptionRepository.saveAll(toSave);
    }
}
