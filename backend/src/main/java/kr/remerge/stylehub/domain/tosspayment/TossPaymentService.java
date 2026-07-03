package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.order.service.OrderStatusService;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TossPaymentService {

    private final TossPaymentRepository tosspaymentRepository;
    private final TossPaymentsClient tossPaymentsClient;
    private final OrderRepository orderRepository;
    private final UserReader userReader;
    private final OrderStatusService orderStatusService;

    @Transactional
    public PaymentResponse confirmPayment(Integer userId, PaymentConfirmRequest request) {

        User buyer = userReader.getUser(userId);

        List<String> orderNos = request.orderIds().stream()
                .distinct()
                .toList();

        if (!orderNos.contains(request.orderId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ORDER_MISMATCH);
        }

        List<Order> orders = orderRepository.findByOrderNoInAndBuyer_UserId(
                orderNos,
                buyer.getUserId()
        );

        if (orders.size() != orderNos.size()) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }

        long dbAmount = orders.stream()
                .mapToLong(Order::getTotalAmount)
                .sum();

        if (request.amount() != dbAmount) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        Optional<TossPayments> existing =
                tosspaymentRepository.findById(request.paymentKey());

        if (existing.isPresent()) {
            return handleExistingPayment(
                    existing.get(),
                    orders,
                    buyer,
                    request
            );
        }

        boolean hasInvalidStatus = orders.stream()
                .anyMatch(order ->
                        order.getStatus() != OrderStatus.PENDING
                );

        if (hasInvalidStatus) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }

        PaymentResult result = tossPaymentsClient.confirm(request);
        validateTossResult(result, request, dbAmount);

        TossPayments payment = TossPayments.builder()
                .tossPaymentId(result.paymentKey())
                .tossOrderId(result.orderId())
                .amount(result.totalAmount())
                .method(result.method())
                .status("DONE")
                .requestedAt(LocalDateTime.now())
                .approvedAt(
                        OffsetDateTime.parse(result.approvedAt())
                                .toLocalDateTime()
                )
                .orderIds(new ArrayList<>(orderNos))
                .build();

        tosspaymentRepository.save(payment);
        orderStatusService.confirmPayments(orders, buyer);

        log.info(
                "결제 승인 완료: orderId={}, orderCount={}",
                request.orderId(),
                orders.size()
        );

        return new PaymentResponse(
                payment.getTossPaymentId(),
                payment.getTossOrderId(),
                payment.getStatus()
        );
    }

    private void validateTossResult(PaymentResult result, PaymentConfirmRequest request, long dbAmount) {

        boolean sameOrder =
                request.orderId().equals(result.orderId());

        boolean sameAmount = result.totalAmount() != null
                && result.totalAmount() == dbAmount;

        if (!sameOrder || !sameAmount) {
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_RESULT_MISMATCH);
        }
    }

    private PaymentResponse handleExistingPayment(TossPayments payment, List<Order> orders, User buyer, PaymentConfirmRequest request) {

        if (!payment.getTossOrderId().equals(request.orderId())
                || !payment.getAmount().equals(request.amount())) {

            throw new BusinessException(ErrorCode.PAYMENT_ORDER_MISMATCH);
        }

        boolean allPending = orders.stream()
                .allMatch(order -> order.getStatus() == OrderStatus.PENDING);

        boolean allConfirmed = orders.stream()
                .allMatch(order -> order.getStatus() == OrderStatus.CONFIRMED);

        if (allPending) {
            orderStatusService.confirmPayments(orders, buyer);
        } else if (!allConfirmed) {
            throw new BusinessException(ErrorCode.PAYMENT_ORDER_STATE_MISMATCH);
        }

        return new PaymentResponse(
                payment.getTossPaymentId(),
                payment.getTossOrderId(),
                payment.getStatus()
        );
    }
}
