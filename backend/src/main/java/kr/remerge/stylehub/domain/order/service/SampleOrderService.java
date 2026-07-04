package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.address.AddressRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.order.dto.SampleOrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.SampleOrderCreateResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SampleOrderService {

    private static final String SAMPLE_AVAILABLE = "AVAILABLE";

    private static final List<OrderStatus> ACTIVE_ORDER_STATUSES = List.of(
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.DISPUTE
    );

    private final UserReader userReader;
    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderLogRepository orderLogRepository;

    @Transactional
    public SampleOrderCreateResponse createSampleOrder(
            Integer userId,
            SampleOrderCreateRequest request
    ) {

        User buyer = userReader.getCompanyUser(userId);
        Quote quote = findBuyerQuote(request.quoteId(), buyer.getUserId());

        validateQuote(quote);
        validateDuplicateOrder(quote.getQuoteId(), buyer.getUserId());

        Address address = findBuyerAddress(
                request.addressId(),
                buyer.getCompany().getCompanyId()
        );

        List<QuoteItem> sampleItems =
                findSampleItems(quote.getQuoteId());

        long productAmount = sampleItems.stream()
                .mapToLong(QuoteItem::getTotalPrice)
                .sum();

        long shippingFee = quote.getShippingFee();
        long totalAmount = productAmount + shippingFee;

        Order order = orderRepository.save(
                buildOrder(
                        buyer,
                        quote,
                        address,
                        request,
                        productAmount,
                        shippingFee,
                        totalAmount
                )
        );

        orderItemRepository.saveAll(
                buildOrderItems(order, quote, sampleItems)
        );

        orderLogRepository.save(
                OrderLog.createStatusLog(
                        order,
                        null,
                        OrderStatus.PENDING,
                        buyer,
                        OrderLogMemo.ORDER_CREATED
                )
        );

        return SampleOrderCreateResponse.from(order);
    }

    private List<OrderItem> buildOrderItems(Order order, Quote quote, List<QuoteItem> quoteItems) {
        return quoteItems.stream()
                .map(item -> OrderItem.builder()
                        .order(order)
                        .assignedUser(quote.getSeller())
                        .productName(quote.getProductName())
                        .optionSummary(item.getOptionSummary())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .additionalPrice(0L)
                        .totalPrice(item.getTotalPrice())
                        .build()
                )
                .toList();
    }

    private Order buildOrder(User buyer, Quote quote, Address address, SampleOrderCreateRequest request, long productAmount, long shippingFee, long totalAmount) {

        Company sellerCompany = quote.getCompany();


        return Order.builder()
                .orderNo(createOrderNo())
                .buyer(buyer)
                .sellerCompany(sellerCompany)
                .quote(quote)
                .orderType(OrderType.CUSTOM)
                .status(OrderStatus.PENDING)
                .sellerCompanyName(sellerCompany.getName())
                .isSample(true)
                .subtotalAmount(productAmount)
                .platformFee(0L)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .paymentMethod(request.paymentMethod())
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .receiverZipcode(address.getZipcode())
                .receiverAddress(address.getAddress())
                .receiverAddressDetail(address.getAddressDetail())
                .receiverMemo(request.receiverMemo())
                .build();
    }

    private String createOrderNo() {
        String date = LocalDate.now()
                .format(DateTimeFormatter.BASIC_ISO_DATE);

        String random = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        return "ORD-" + date + "-" + random;
    }

    private List<QuoteItem> findSampleItems(Integer quoteId) {

        List<QuoteItem> sampleItems =
                quoteItemRepository
                        .findByQuote_QuoteIdAndIsSampleTrue(quoteId);

        if (sampleItems.isEmpty()) {
            throw new BusinessException(ErrorCode.QUOTE_SAMPLE_ITEM_NOT_FOUND);
        }

        return sampleItems;
    }

    private Address findBuyerAddress(Integer addressId, Integer companyId) {
        return addressRepository
                .findActiveCompanyAddress(addressId, companyId)
                .orElseThrow(
                        () -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND)
                );
    }

    private void validateDuplicateOrder(Integer quoteId, Integer buyerId) {

        boolean exists = orderRepository.existsActiveSampleOrder(
                quoteId,
                buyerId,
                ACTIVE_ORDER_STATUSES
        );

        if (exists) {
            throw new BusinessException(ErrorCode.SAMPLE_ORDER_ALREADY_EXISTS);
        }
    }

    private void validateQuote(Quote quote) {

        if (!QuoteStatusCode.SAMPLE_REQUESTED.equals(quote.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_QUOTE_STATUS);
        }

        if (!SAMPLE_AVAILABLE.equals(quote.getSampleAvailable())) {
            throw new BusinessException(ErrorCode.QUOTE_SAMPLE_NOT_AVAILABLE);
        }

        if (quote.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.QUOTE_EXPIRED);
        }
    }

    private Quote findBuyerQuote(Integer quoteId, Integer buyerId) {

        return quoteRepository
                .findByQuoteIdAndBuyer_UserId(quoteId, buyerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND)
                );

    }

}
