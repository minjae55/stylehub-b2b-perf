package kr.remerge.stylehub.domain.tosspayment;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.order.service.OrderStatusService;
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusService orderStatusService;

    @Transactional
    public PaymentResponse confirmPayment(Integer userId, PaymentConfirmRequest request) {

        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

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
                .status(result.status())
                .requestedAt(LocalDateTime.now())
                .approvedAt(
                        result.approvedAt() != null
                                ? OffsetDateTime.parse(result.approvedAt()).toLocalDateTime()
                                : null
                )
                .orderIds(new ArrayList<>(orderNos))
                .vaBankCode(result.virtualAccount() != null ? result.virtualAccount().bankCode() : null)
                .vaAccountNumber(result.virtualAccount() != null ? result.virtualAccount().accountNumber() : null)
                .vaCustomerName(result.virtualAccount() != null ? result.virtualAccount().customerName() : null)
                .vaDueDate(result.virtualAccount() != null ? result.virtualAccount().dueDate() : null)
                .build();

        tosspaymentRepository.save(payment);

        // 카드결제처럼 즉시 완료된 경우에만 Order 상태 전이.
        // 가상계좌 발급 직후(WAITING_FOR_DEPOSIT)는 아직 입금 전이므로 여기서 절대 confirm하지 않음 — 웹훅에서 처리.
        if ("DONE".equals(result.status())) {
            orderStatusService.confirmPayments(orders, buyer);
        }

        log.info(
                "결제 승인 처리: orderId={}, status={}, orderCount={}",
                request.orderId(),
                result.status(),
                orders.size()
        );

        PaymentResponse.VirtualAccountResponse virtualAccountResponse =
                result.virtualAccount() != null
                        ? new PaymentResponse.VirtualAccountResponse(
                        result.virtualAccount().bankCode(),
                        result.virtualAccount().accountNumber(),
                        result.virtualAccount().customerName(),
                        result.virtualAccount().dueDate()
                )
                        : null;

        return new PaymentResponse(
                payment.getTossPaymentId(),
                payment.getTossOrderId(),
                payment.getStatus(),
                virtualAccountResponse
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

        // 저장된 Toss 상태가 아직 DONE이 아니면(가상계좌 입금대기 중) confirm 처리하지 않음
        boolean tossPaymentDone = "DONE".equals(payment.getStatus());

        if (allPending && tossPaymentDone) {
            orderStatusService.confirmPayments(orders, buyer);
        } else if (allPending) {
            // 가상계좌 입금대기 중 재요청 — 아직 결제 미완료, 정상 상황이므로 그대로 안내만
            log.info("가상계좌 입금 대기 중 재요청: paymentKey={}", payment.getTossPaymentId());
        } else if (!allConfirmed) {
            throw new BusinessException(ErrorCode.PAYMENT_ORDER_STATE_MISMATCH);
        }

        PaymentResponse.VirtualAccountResponse virtualAccountResponse =
                payment.getVaAccountNumber() != null
                        ? new PaymentResponse.VirtualAccountResponse(
                        payment.getVaBankCode(),
                        payment.getVaAccountNumber(),
                        payment.getVaCustomerName(),
                        payment.getVaDueDate()
                )
                        : null;

        return new PaymentResponse(
                payment.getTossPaymentId(),
                payment.getTossOrderId(),
                payment.getStatus(),
                virtualAccountResponse
        );
    }
}