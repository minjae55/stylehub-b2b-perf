package kr.remerge.stylehub.domain.quote.service;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateRequest;
import kr.remerge.stylehub.domain.quote.dto.QuoteCreateResponse;
import kr.remerge.stylehub.domain.quote.dto.QuoteDetailResponse;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingSupplier;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final UserRepository userRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingSupplierRepository sourcingSupplierRepository;

    @Transactional
    public QuoteCreateResponse createQuote(
            Integer userId,
            QuoteCreateRequest request
    ) {

        User seller = findSeller(userId);
        Company company = seller.getCompany();

        SourcingRequest sourcingRequest =
                findSourcingRequest(request.sourcingRequestId());

        SourcingSupplier supplier =
                findAssignedSupplier(sourcingRequest.getSourcingRequestId(),
                        company.getCompanyId()
                );

        QuoteAmounts amounts =
                validateAndCalculateAmounts(request);

        LocalDateTime now = LocalDateTime.now();

        Quote quote = quoteRepository.save(
                buildQuote(
                        request,
                        sourcingRequest,
                        seller,
                        company,
                        amounts,
                        now
                )
        );

        quoteItemRepository.saveAll(
                buildQuoteItems(
                        request.items(),
                        quote,
                        now
                )
        );

        supplier.quote(quote);

        // 이 공급사의 배정 상태(SourcingSupplier)뿐 아니라 요청 전체 상태(SourcingRequest)도
        // 첫 견적이 들어온 시점에 PENDING -> QUOTED로 전이해야 바이어 쪽에 "견적수신"으로 표시됨.
        if (sourcingRequest.getStatus() == SourcingStatus.PENDING) {
            sourcingRequest.quote();
        }
        return QuoteCreateResponse.from(quote);

    }

    public QuoteDetailResponse getQuoteDetail(
            Integer userId,
            Integer quoteId
    ) {
        User user = userRepository.findByIdWithCompany(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));

        validateQuoteAccess(user, quote);

        List<QuoteItem> items
                = quoteItemRepository.findByQuote_QuoteId(quoteId);

        return QuoteDetailResponse.from(quote, items);
    }

    private void validateQuoteAccess(User user, Quote quote) {

        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        boolean isBuyer = Objects.equals(
                quote.getBuyer().getUserId(),
                user.getUserId()
        );

        boolean isSeller = Objects.equals(
                quote.getSeller().getUserId(),
                user.getUserId()
        );

        boolean isSellerCompanyPresident =
                user.getRole() == UserRole.PRESIDENT
                        && user.getCompany() != null
                        && Objects.equals(
                        quote.getCompany().getCompanyId(),
                        user.getCompany().getCompanyId()
                );

        boolean allowed =  isAdmin
                || isBuyer
                || isSeller
                || isSellerCompanyPresident;

        if (!allowed) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }



    }

    private List<QuoteItem> buildQuoteItems(
            List<QuoteCreateRequest.Item> items,
            Quote quote,
            LocalDateTime now
    ) {

        return items.stream()
                .map(item -> QuoteItem.builder()
                        .quote(quote)
                        .optionSummary(item.optionSummary())
                        .quantity(item.quantity())
                        .unitPrice(item.unitPrice())
                        .totalPrice(
                                item.unitPrice() * item.quantity()
                        )
                        .isSample(item.sample())
                        .createdAt(now)
                        .build()
                )
                .toList();


    }

    private Quote buildQuote(QuoteCreateRequest request, SourcingRequest sourcingRequest, User seller, Company company, QuoteAmounts amounts, LocalDateTime now) {
        return Quote.builder()
                .quoteNo(createQuoteNo(now))
                .sourcingRequest(sourcingRequest)
                .buyer(sourcingRequest.getBuyer())
                .seller(seller)
                .company(company)
                .companyName(company.getName())
                .buyerName(
                        sourcingRequest.getBuyer().getName()
                )
                .sellerName(seller.getName())
                .brandName(request.brandName())
                .productName(request.productName())
                .categoryName(request.categoryName())
                .material(request.material())
                .leadTimeDays(request.leadTimeDays())
                .deliveryCompany(request.deliveryCompany())
                .shippingFee(request.shippingFee())
                .validUntil(request.validUntil())
                .sampleAvailable(
                        Boolean.TRUE.equals(
                                request.sampleAvailable()
                        )
                                ? "AVAILABLE"
                                : "UNAVAILABLE"
                )
                .sellerMemo(request.sellerMemo())
                .subtotalAmount(
                        amounts.subtotalAmount()
                )
                .totalAmount(amounts.totalAmount())
                .status(QuoteStatusCode.SUBMITTED)
                .createdAt(now)
                .submittedAt(now)
                .build();
    }

    private String createQuoteNo(LocalDateTime now) {
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        String randomValue = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        return "QT-" + date + "-" + randomValue;

    }

    private QuoteAmounts validateAndCalculateAmounts(
            QuoteCreateRequest request
    ) {
        long subtotalAmount = 0L;
        boolean hasSampleItem = false;

        for (QuoteCreateRequest.Item item : request.items()) {
            long itemTotalPrice =
                    item.unitPrice() * item.quantity();

            subtotalAmount += itemTotalPrice;

            if (Boolean.TRUE.equals(item.sample())) {
                hasSampleItem = true;
            }
        }

        if (!Boolean.TRUE.equals(request.sampleAvailable())
                && hasSampleItem) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        long totalAmount =
                subtotalAmount + request.shippingFee();

        return new QuoteAmounts(
                subtotalAmount,
                totalAmount
        );
    }

    private SourcingSupplier findAssignedSupplier(
            Integer sourcingRequestId,
            Integer companyId
    ) {
        return sourcingSupplierRepository
                .findBySourcingRequest_SourcingRequestIdAndSellerCompanyIdAndStatusIn(
                        sourcingRequestId,
                        companyId,
                        List.of(
                                SourcingSupplierStatus.SUGGESTED,
                                SourcingSupplierStatus.RECOMMENDED
                        )
                )
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.FORBIDDEN)
                );
    }

    private SourcingRequest findSourcingRequest(
            Integer sourcingRequestId
    ) {
        return sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.SOURCING_NOT_FOUND)
                );
    }

    private User findSeller(Integer userId) {
        User seller = userRepository.findByIdWithCompany(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        if (seller.getCompany() == null) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
        }

        return seller;
    }

    private record QuoteAmounts(
            long subtotalAmount,
            long totalAmount
    ) {
    }
}
