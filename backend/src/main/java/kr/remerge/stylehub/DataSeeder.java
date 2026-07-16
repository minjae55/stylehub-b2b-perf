package kr.remerge.stylehub;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.category.repository.CategoryRepository;
import kr.remerge.stylehub.domain.company.entity.Brand;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStatus;
import kr.remerge.stylehub.domain.company.enumtype.CompanyStoreType;
import kr.remerge.stylehub.domain.company.enumtype.SellerStatus;
import kr.remerge.stylehub.domain.company.repository.BrandRepository;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.repository.ProductRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("local")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductRepository productRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final NegotiationRepository negotiationRepository;
    private final ContractRepository contractRepository;
    private final ContractItemRepository contractItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private final Faker faker = new Faker(new Locale("ko"));

    @Override
    public void run(String... args) throws Exception {

        if (companyRepository.count() > 0) {
            System.out.println("[DataSeeder] 이미 데이터가 있어 건너뜁니다.");
            return;
        }

        List<Category> categories = createCategories(20);
        List<Company> companies = createCompanies(200);
        List<Brand> brands = createBrands(companies);

        List<User> buyerUsers = new ArrayList<>();
        List<User> sellerUsers = new ArrayList<>();
        createUsers(companies, buyerUsers, sellerUsers);

        List<Product> products = createProducts(sellerUsers, brands, categories, 10000);

        List<SourcingRequest> sourcingRequests = createSourcingRequests(buyerUsers, categories, 3000);
        List<Quote> quotes = createQuote(sourcingRequests, sellerUsers, 5000);

        createQuoteItems(quotes);
        createNegotiations(quotes, 0.4);

        List<Contract> contracts = createContracts(quotes, 0.3);
        createContractItems(contracts, products);
        createOrders(buyerUsers, products, 20000);
    }

    private void createOrders(List<User> buyerUsers, List<Product> products, int count) {

        List<OrderStatus> statuses = List.of(
                OrderStatus.CONFIRMED, OrderStatus.PREPARING,
                OrderStatus.SHIPPED, OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
        );

        List<Order> orders = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            User buyer = pick(buyerUsers);
            Product product = pick(products);
            Company sellerCompany = product.getCompany();

            orders.add(Order.builder()
                    .orderNo("ORD-" + String.format("%06d", i))
                    .buyer(buyer)
                    .sellerCompany(sellerCompany)
                    .sellerCompanyName(sellerCompany.getName())
                    .orderType(OrderType.NORMAL)
                    .status(pick(statuses))
                    .subtotalAmount(500000L)
                    .platformFee(15000L)
                    .shippingFee(3000L)
                    .totalAmount(518000L)
                    .receiverName(buyer.getName())
                    .receiverPhone(buyer.getPhone())
                    .receiverAddress(faker.address().fullAddress())
                    .build());
        }

        List<Order> savedOrders = orderRepository.saveAll(orders);
        createOrderItems(savedOrders, products);
    }

    private void createOrderItems(List<Order> orders, List<Product> products) {
        List<OrderItem> toSave = new ArrayList<>();

        for (Order order : orders) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4);

            for (int i = 0; i < itemCount; i++) {
                Product product = pick(products);
                int quantity = ThreadLocalRandom.current().nextInt(1, 20);
                long unitPrice = product.getUnitPrice();

                toSave.add(OrderItem.builder()
                        .order(order)
                        .product(product)
                        .assignedUser(product.getSeller())
                        .productName(product.getProductName())
                        .optionSummary("컬러: " + faker.color().name())
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .totalPrice(unitPrice * quantity)
                        .build());
            }
        }
        orderItemRepository.saveAll(toSave);
    }

    private void createContractItems(List<Contract> contracts, List<Product> products) {
        List<ContractItem> toSave = new ArrayList<>();

        for (Contract contract : contracts) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4); // 1~3개
            for (int j = 0; j < itemCount; j++) {
                Product product = pick(products);
                int quantity = ThreadLocalRandom.current().nextInt(50, 300);

                toSave.add(new ContractItem(
                        contract,
                        product,
                        null,
                        product.getProductName(),
                        "컬러: " + faker.color().name(),
                        product.getMainMaterial(),
                        quantity,
                        product.getUnitPrice()
                ));
            }
        }
        contractItemRepository.saveAll(toSave);
    }

    private List<Contract> createContracts(List<Quote> quotes, double ratio) {
        List<Contract> toSave = new ArrayList<>();
        int i = 0;

        for (Quote quote : quotes) {
            if (Math.random() > ratio) continue;

            Contract contract = Contract.createDraftFromQuote(
                    quote,
                    "CT-" + String.format("%06d", i++),
                    quote.getProductName() + " 계약",
                    quote.getTotalAmount(),
                    LocalDate.now().plusDays(30),
                    "선금 30% / 잔금 70% 출고 시 지급",
                    "수령 후 7일 이내 초기 불량만 교환 가능",
                    null
            );

            if (Math.random() < 0.5) {
                contract.sellerSign();
                contract.buyerSign();
                contract.complete();
            }

            toSave.add(contract);
        }
        return contractRepository.saveAll(toSave);
    }

    private void createNegotiations(List<Quote> quotes, double ratio) {

        List<Negotiation> toSave = new ArrayList<>();

        for (Quote quote : quotes) {
            if (Math.random() > ratio) continue;

            toSave.add(new Negotiation(
                    "QUOTE",
                    quote,
                    null,
                    quote.getBuyer(),
                    quote.getSeller(),
                    quote.getProductName() + " 견적 협의"
            ));
        }
        negotiationRepository.saveAll(toSave);
    }


    private void createQuoteItems(List<Quote> quotes) {
        List<QuoteItem> toSave = new ArrayList<>();

        for (Quote quote : quotes) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4); // 1~3개
            for (int j = 0; j < itemCount; j++) {
                int quantity = ThreadLocalRandom.current().nextInt(50, 500);
                long unitPrice = ThreadLocalRandom.current().nextInt(5000, 50000);

                toSave.add(QuoteItem.builder()
                        .quote(quote)
                        .optionSummary("컬러: " + faker.color().name())
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .totalPrice(unitPrice * quantity)
                        .createdAt(LocalDateTime.now())
                        .isSample(false)
                        .build());
            }
        }
        quoteItemRepository.saveAll(toSave);
    }

    private List<Quote> createQuote(List<SourcingRequest> sourcingRequests, List<User> sellerUsers, int count) {
        List<Quote> toSave = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            SourcingRequest sourcingRequest = pick(sourcingRequests);
            User seller = pick(sellerUsers);
            Company company = seller.getCompany();
            User buyer = sourcingRequest.getBuyer();
            LocalDateTime now = LocalDateTime.now();

            toSave.add(Quote.builder()
                    .quoteNo("QT-" + String.format("%06d", i))
                    .sourcingRequest(sourcingRequest)
                    .buyer(buyer)
                    .seller(seller)
                    .company(company)
                    .companyName(company.getName())
                    .buyerName(buyer.getName())
                    .sellerName(seller.getName())
                    .version(1)
                    .productName(sourcingRequest.getProductName())
                    .material(sourcingRequest.getMainMaterial())
                    .leadTimeDays(ThreadLocalRandom.current().nextInt(1, 14))
                    .shippingFee(3000L)
                    .validUntil(now.plusDays(14))
                    .sampleAvailable("AVAILABLE")
                    .subtotalAmount(500000L)
                    .totalAmount(503000L)
                    .status(QuoteStatusCode.SUBMITTED)
                    .createdAt(now)
                    .submittedAt(now)
                    .build());
        }
        return quoteRepository.saveAll(toSave);
    }

    private List<SourcingRequest> createSourcingRequests(List<User> buyerUsers, List<Category> categories, int count) {
        List<SourcingRequest> toSave = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            User buyer = pick(buyerUsers);
            Category category = pick(categories);

            toSave.add(SourcingRequest.builder()
                    .sourcingNo("SRC-" + String.format("%06d", i))
                    .buyer(buyer)
                    .buyerCompanyId(buyer.getCompany().getCompanyId())
                    .type(ThreadLocalRandom.current().nextBoolean() ? "READY" : "CUSTOM")
                    .status(SourcingStatus.TRADING)
                    .productName(faker.commerce().productName())
                    .needSample("N")
                    .mainMaterial(faker.commerce().material())
                    .unitPrice((long) ThreadLocalRandom.current().nextInt(5000, 100000))
                    .deliveryDate(LocalDate.now().plusDays(ThreadLocalRandom.current().nextInt(7, 60)))
                    .expiryDate(LocalDate.now().plusDays(30))
                    .totalBudget((long) ThreadLocalRandom.current().nextInt(1_000_000, 50_000_000))
                    .categoryId(category.getCategoryId())
                    .detail(faker.lorem().sentence())
                    .build());
        }
        return sourcingRequestRepository.saveAll(toSave);
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

    private <T>T pick(List<T> list) {
        return list.get(ThreadLocalRandom.current().nextInt(list.size()));
    }

    private void createUsers(List<Company> companies, List<User> buyerUsers, List<User> sellerUsers) {
        String encodedPassword = passwordEncoder.encode("Password1234!");
        List<User> toSave = new ArrayList<>();
        int emailSeq = 0;

        for (Company company : companies) {
            for (int i = 0; i < 3; i++) {
                BusinessRole businessRole = ThreadLocalRandom.current().nextBoolean()
                        ? BusinessRole.BUYER : BusinessRole.SELLER;

                User user = User.builder()
                        .company(company)
                        .email("user" + (emailSeq++) + "@stylehub-test.com")
                        .password(encodedPassword)
                        .name(faker.name().fullName())
                        .phone(faker.phoneNumber().phoneNumber())
                        .role(i == 0 ? UserRole.PRESIDENT : UserRole.EMPLOYEE)
                        .businessRole(businessRole)
                        .status(UserStatus.APPROVED)
                        .build();
                toSave.add(user);
            }
        }

        List<User> saved = userRepository.saveAll(toSave);
        for (User user : saved) {
            if (user.getBusinessRole() == BusinessRole.BUYER) {
                buyerUsers.add(user);
            } else {
                sellerUsers.add(user);
            }
        }
    }

    private List<Brand> createBrands(List<Company> companies) {
        
        List<Brand> brands = new ArrayList<>();

        for (Company company : companies) {
            brands.add(Brand.builder()
                    .company(company)
                    .brandName(company.getName() + " 브랜드")
                    .build()
            );
        }
        return brandRepository.saveAll(brands);
    }

    private List<Company> createCompanies(int count) {

        List<Company> companies = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            companies.add(Company.builder()
                    .name(faker.company().name())
                    .businessNumber(String.format("%03d-%02d-%05d", 100 + i,
                            80 + i, 10000 + i))
                    .representativeName(faker.name().fullName())
                    .status(CompanyStatus.APPROVED)
                    .sellerStatus(SellerStatus.APPROVED)
                    .storeType(CompanyStoreType.ONLINE)
                    .createdAt(LocalDateTime.now())
                    .build(
                    ));
        }

        return companyRepository.saveAll(companies);

    }

    private List<Category> createCategories(int count) {

        List<Category> categories = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            categories.add(Category.builder()
                    .categoryName(faker.commerce().department())
                    .depth(0)
                    .sortOrder(i)
                    .isActive(true)
                    .build()
            );
        }
        return categoryRepository.saveAll(categories);
    }

}
