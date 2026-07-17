package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.address.AddressRepository;
import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class FoundationSeeder {

    private final CategoryRepository categoryRepository;
    private final CompanyRepository companyRepository;
    private final BrandRepository brandRepository;
    private final AddressRepository addressRepository;
    private final Faker faker = new Faker(new Locale("ko"));

    public record Foundation(List<Category> categories, List<Company> companies, List<Brand> brands, List<Address> addresses) {
    }

    public Foundation seed() {
        List<Category> categories = createCategories(20);
        List<Company> companies = createCompanies(200);
        List<Brand> brands = createBrands(companies);
        List<Address> addresses = createAddresses(companies);
        return new Foundation(categories, companies, brands, addresses);
    }

    private List<Category> createCategories(int count) {
        List<Category> categories = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            categories.add(Category.builder()
                    .categoryName(faker.commerce().department())
                    .depth(0)
                    .sortOrder(i)
                    .isActive(true)
                    .build());
        }
        return categoryRepository.saveAll(categories);
    }

    private List<Company> createCompanies(int count) {
        List<Company> companies = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            companies.add(Company.builder()
                    .name(faker.company().name())
                    .businessNumber(String.format("%03d-%02d-%05d", 100 + i, 80 + i, 10000 + i))
                    .representativeName(faker.name().fullName())
                    .status(CompanyStatus.APPROVED)
                    .sellerStatus(SellerStatus.APPROVED)
                    .storeType(CompanyStoreType.ONLINE)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return companyRepository.saveAll(companies);
    }

    private List<Brand> createBrands(List<Company> companies) {
        List<Brand> brands = new ArrayList<>();
        for (Company company : companies) {
            brands.add(Brand.builder()
                    .company(company)
                    .brandName(company.getName() + " 브랜드")
                    .build());
        }
        return brandRepository.saveAll(brands);
    }

    private List<Address> createAddresses(List<Company> companies) {
        List<Address> addresses = new ArrayList<>();
        for (Company company : companies) {
            addresses.add(Address.builder()
                    .company(company)
                    .addressName("본사")
                    .zipcode("06134")
                    .address(faker.address().fullAddress())
                    .build());
        }
        return addressRepository.saveAll(addresses);
    }
}
