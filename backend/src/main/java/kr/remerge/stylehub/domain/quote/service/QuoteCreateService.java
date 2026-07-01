package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateRequest;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuoteCreateService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    // TODO: JWT 연동 후 SecurityContext에서 꺼내는 걸로 교체
    private static final Integer DUMMY_SELLER_USER_ID = 10;
    private static final Integer DUMMY_SELLER_COMPANY_ID = 11;

    @Transactional
    public QuoteCreateResponse createQuote(QuoteCreateRequest request) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(request.getSourcingId())
                .orElseThrow(() -> new IllegalArgumentException("소싱 요청을 찾을 수 없습니다."));

        // TODO: JWT 연동 후 실제 로그인 seller로 교체
        User seller = userRepository.findById(DUMMY_SELLER_USER_ID)
                .orElseThrow(() -> new IllegalArgumentException("셀러를 찾을 수 없습니다."));

        Company company = companyRepository.findById(DUMMY_SELLER_COMPANY_ID)
                .orElseThrow(() -> new IllegalArgumentException("회사를 찾을 수 없습니다."));

        LocalDateTime now = LocalDateTime.now();

        Quote quote = Quote.builder()
                .quoteNo(generateQuoteNo())
                .sourcingRequest(sourcingRequest)
                .buyer(sourcingRequest.getBuyer())
                .seller(seller)
                .company(company)
                .companyName("임시회사명")                  // TODO: JWT 연동 후 실제 company name으로 교체
                .buyerName(sourcingRequest.getBuyer().getName())
                .sellerName(seller.getName())
                .brandName(request.getBrandName())
                .productName(request.getProductName())
                .categoryName(request.getCategoryName())
                .material(request.getMaterial())
                .leadTimeDays(request.getLeadTimeDays())
                .deliveryCompany(request.getDeliveryCompany())
                .shippingFee(request.getShippingFee() != null ? request.getShippingFee() : 0L)
                .validUntil(LocalDateTime.parse(request.getValidUntil(), DateTimeFormatter.ISO_DATE_TIME))
                .sampleAvailable(request.getSampleAvailable())
                .sellerMemo(request.getSellerMemo())
                .subtotalAmount(request.getSubtotalAmount() != null ? request.getSubtotalAmount() : 0L)
                .totalAmount(request.getTotalAmount() != null ? request.getTotalAmount() : 0L)
                .status("SUBMITTED")
                .createdAt(now)
                .submittedAt(now)
                .build();

        Quote savedQuote = quoteRepository.save(quote);

        List<QuoteItem> allItems = new ArrayList<>();

        if (request.getQuoteItems() != null) {
            for (QuoteCreateRequest.QuoteItemDto dto : request.getQuoteItems()) {
                allItems.add(QuoteItem.builder()
                        .quote(savedQuote)
                        .optionSummary(dto.getOptionSummary())
                        .quantity(dto.getQuantity() != null ? dto.getQuantity() : 0)
                        .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : 0L)
                        .totalPrice(dto.getTotalPrice() != null ? dto.getTotalPrice() : 0L)
                        .isSample(false)
                        .createdAt(now)
                        .build());
            }
        }

        if (request.getSampleItems() != null) {
            for (QuoteCreateRequest.SampleItemDto dto : request.getSampleItems()) {
                allItems.add(QuoteItem.builder()
                        .quote(savedQuote)
                        .optionSummary(buildSampleSummary(dto))
                        .quantity(dto.getQuantity() != null ? dto.getQuantity() : 0)
                        .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : 0L)
                        .totalPrice(dto.getTotalPrice() != null ? dto.getTotalPrice() : 0L)
                        .isSample(true)
                        .createdAt(now)
                        .build());
            }
        }

        List<QuoteItem> savedItems = quoteItemRepository.saveAll(allItems);

        // ── 견적 제출 시 SourcingSupplier 상태를 QUOTED로 변경 ──────────────
        updateSourcingSupplierToQuoted(sourcingRequest.getSourcingRequestId(), savedQuote);

        return QuoteCreateResponse.from(savedQuote, savedItems);
    }

    private void updateSourcingSupplierToQuoted(Integer sourcingRequestId, Quote quote) {
        List<SourcingSupplier> suppliers = sourcingSupplierRepository
                .findAllBySourcingRequest_SourcingRequestId(sourcingRequestId);

        suppliers.stream()
                .filter(s -> s.getSellerCompanyId().equals(DUMMY_SELLER_COMPANY_ID))
                .filter(s -> s.getStatus() == SourcingSupplierStatus.RECOMMENDED)
                .findFirst()
                .ifPresentOrElse(
                        supplier -> {
                            supplier.quote(null, quote);

                            // SourcingRequest 상태도 QUOTED로 업데이트
                            SourcingRequest sourcingRequest = sourcingRequestRepository
                                    .findById(sourcingRequestId)
                                    .orElseThrow(() -> new IllegalArgumentException("소싱 요청 없음: " + sourcingRequestId));
                            sourcingRequest.quote();
                        },
                        () -> {
                            throw new IllegalStateException(
                                    "해당 셀러에게 배정된(RECOMMENDED) 소싱 요청이 아닙니다. sourcingRequestId=" + sourcingRequestId);
                        }
                );
    }

    private String generateQuoteNo() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uniquePart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "QT-" + datePart + "-" + uniquePart;
    }

    private String buildSampleSummary(QuoteCreateRequest.SampleItemDto dto) {
        StringBuilder sb = new StringBuilder();
        if (dto.getSampleName() != null && !dto.getSampleName().isBlank()) {
            sb.append(dto.getSampleName());
        }
        if (dto.getMemo() != null && !dto.getMemo().isBlank()) {
            if (!sb.isEmpty()) sb.append(" / ");
            sb.append(dto.getMemo());
        }
        return sb.toString();
    }
}
