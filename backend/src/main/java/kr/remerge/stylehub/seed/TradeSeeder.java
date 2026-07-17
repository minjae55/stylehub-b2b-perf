package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.category.entity.Category;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

import static kr.remerge.stylehub.seed.SeedUtils.pick;

@Component
@RequiredArgsConstructor
public class TradeSeeder {

    private final SourcingRequestRepository sourcingRequestRepository;
    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final NegotiationRepository negotiationRepository;
    private final ContractRepository contractRepository;
    private final ContractItemRepository contractItemRepository;
    private final Faker faker = new Faker(new Locale("ko"));

    public record Trade(List<SourcingRequest> sourcingRequests, List<Quote> quotes, List<Contract> contracts) {
    }

    public Trade seed(List<User> buyerUsers, List<User> sellerUsers,
                       List<Category> categories, List<Product> products) {
        List<SourcingRequest> sourcingRequests = createSourcingRequests(buyerUsers, categories, 3000);
        List<Quote> quotes = createQuotes(sourcingRequests, sellerUsers, 5000);
        createQuoteItems(quotes);
        createNegotiations(quotes, 0.4);
        List<Contract> contracts = createContracts(quotes, 0.3);
        createContractItems(contracts, products);
        return new Trade(sourcingRequests, quotes, contracts);
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

    private List<Quote> createQuotes(List<SourcingRequest> sourcingRequests, List<User> sellerUsers, int count) {
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

    private void createQuoteItems(List<Quote> quotes) {
        List<QuoteItem> toSave = new ArrayList<>();

        for (Quote quote : quotes) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4);
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

    private void createContractItems(List<Contract> contracts, List<Product> products) {
        List<ContractItem> toSave = new ArrayList<>();

        for (Contract contract : contracts) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4);
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
}
