package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.address.AddressRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.order.dto.contract.ContractOrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.contract.ContractOrderCreateResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractOrderService {

    private static final List<OrderStatus> ACTIVE_ORDER_STATUSES = List.of(
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED,
            OrderStatus.DISPUTE
    );

    private final UserReader userReader;
    private final ContractRepository contractRepository;
    private final ContractItemRepository contractItemRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderLogRepository orderLogRepository;

    @Transactional
    public ContractOrderCreateResponse createOrder(
            Integer userId,
            ContractOrderCreateRequest request
    ) {
        User buyer = userReader.getCompanyUser(userId);
        Contract contract = findCompletedBuyerContract(
                request.contractId(),
                buyer.getUserId()
        );

        Order pendingOrder = orderRepository
                .findFirstByContract_ContractIdAndBuyer_UserIdAndStatusOrderByCreatedAtDesc(
                        contract.getContractId(),
                        buyer.getUserId(),
                        OrderStatus.PENDING
                )
                .orElse(null);

        if (pendingOrder != null) {
            return ContractOrderCreateResponse.from(pendingOrder);
        }

        if (orderRepository.existsActiveContractOrder(
                contract.getContractId(),
                buyer.getUserId(),
                ACTIVE_ORDER_STATUSES
        )) {
            throw new BusinessException(
                    ErrorCode.CONTRACT_ORDER_ALREADY_EXISTS
            );
        }

        Address address = addressRepository
                .findActiveCompanyAddress(
                        request.addressId(),
                        buyer.getCompany().getCompanyId()
                )
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.ADDRESS_NOT_FOUND)
                );

        List<ContractItem> contractItems = contractItemRepository
                .findByContract_ContractIdOrderByContractItemIdAsc(
                        contract.getContractId()
                );

        // 같은 견적으로 샘플 주문을 먼저 진행했을 수 있으므로, 있으면 본생산 주문의
        // parentOrder로 연결해 "어느 샘플 주문에서 이어진 본주문인지" 추적할 수 있게 한다.
        // 샘플을 거치지 않고 바로 계약까지 간 경우도 있으므로 없으면 null로 둔다.
        Order sampleOrder = orderRepository
                .findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleTrueOrderByCreatedAtDesc(
                        List.of(contract.getQuote().getQuoteId()),
                        buyer.getUserId()
                )
                .stream()
                .findFirst()
                .orElse(null);

        Order order = orderRepository.save(
                buildOrder(buyer, contract, address, request, sampleOrder)
        );

        orderItemRepository.saveAll(
                buildOrderItems(order, contract, contractItems)
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

        return ContractOrderCreateResponse.from(order);
    }

    private Contract findCompletedBuyerContract(
            Integer contractId,
            Integer buyerId
    ) {
        Contract contract = contractRepository
                .findByContractIdAndQuote_Buyer_UserId(contractId, buyerId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CONTRACT_NOT_FOUND)
                );

        if (contract.getStatus() != ContractStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.INVALID_CONTRACT_STATUS);
        }

        return contract;
    }

    private Order buildOrder(
            User buyer,
            Contract contract,
            Address address,
            ContractOrderCreateRequest request,
            Order sampleOrder
    ) {
        Company sellerCompany = contract.getCompany();

        return Order.builder()
                .orderNo(createOrderNo())
                .buyer(buyer)
                .sellerCompany(sellerCompany)
                .parentOrder(sampleOrder)
                .contract(contract)
                .quote(contract.getQuote())
                .orderType(OrderType.CUSTOM)
                .status(OrderStatus.PENDING)
                .sellerCompanyName(contract.getSellerCompanyName())
                .isSample(false)
                .subtotalAmount(
                        contract.getContractAmount()
                                - contract.getShippingFee()
                )
                .platformFee(0L)
                .shippingFee(contract.getShippingFee())
                .totalAmount(contract.getContractAmount())
                .paymentMethod(request.paymentMethod())
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .receiverZipcode(address.getZipcode())
                .receiverAddress(address.getAddress())
                .receiverAddressDetail(address.getAddressDetail())
                .receiverMemo(request.receiverMemo())
                .senderName(sellerCompany.getName())
                .senderPhone(sellerCompany.getRepresentativePhone())
                .senderAddress(sellerCompany.getAddress())
                .senderAddressDetail(sellerCompany.getAddressDetail())
                .build();
    }

    private List<OrderItem> buildOrderItems(
            Order order,
            Contract contract,
            List<ContractItem> contractItems
    ) {
        return contractItems.stream()
                .map(item -> OrderItem.builder()
                        .order(order)
                        .product(item.getProduct())
                        .productOption(item.getProductOption())
                        .assignedUser(contract.getQuote().getSeller())
                        .productName(item.getProductName())
                        .optionSummary(item.getOptionSummary())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .additionalPrice(0L)
                        .totalPrice(item.getTotalPrice())
                        .build()
                )
                .toList();
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
}