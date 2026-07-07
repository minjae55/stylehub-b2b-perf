package kr.remerge.stylehub.domain.banktransfer.service;

import kr.remerge.stylehub.domain.banktransfer.dto.CreateBankTransferRequest;
import kr.remerge.stylehub.domain.banktransfer.dto.WaitingDepositResponse;
import kr.remerge.stylehub.domain.banktransfer.entity.BankTransferPayment;
import kr.remerge.stylehub.domain.banktransfer.entity.DepositAccount;
import kr.remerge.stylehub.domain.banktransfer.enums.BankTransferStatus;
import kr.remerge.stylehub.domain.banktransfer.repository.BankTransferPaymentRepository;
import kr.remerge.stylehub.domain.banktransfer.repository.DepositAccountRepository;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.order.service.OrderStatusService;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BankTransferPaymentService {

    private static final int DEPOSIT_DEADLINE_DAYS = 3;

    private final BankTransferPaymentRepository bankTransferPaymentRepository;
    private final DepositAccountRepository depositAccountRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusService orderStatusService;

    @Transactional
    public void create(CreateBankTransferRequest request) {
        DepositAccount account = depositAccountRepository.findById(request.depositAccountId())
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다."));

        List<Order> orders = orderRepository.findAllById(request.orderIds());
        if (orders.size() != request.orderIds().size()) {
            throw new IllegalArgumentException("존재하지 않는 주문이 포함되어 있습니다.");
        }

        boolean hasInvalidStatus = orders.stream()
                .anyMatch(order -> order.getStatus() != OrderStatus.PENDING);
        if (hasInvalidStatus) {
            throw new IllegalStateException("결제 대기 상태가 아닌 주문이 포함되어 있습니다.");
        }

        BankTransferPayment payment = BankTransferPayment.builder()
                .orderIds(new ArrayList<>(request.orderIds()))
                .depositAccount(account)
                .depositorName(request.depositorName())
                .depositDeadline(LocalDateTime.now().plusDays(DEPOSIT_DEADLINE_DAYS))
                .build();

        bankTransferPaymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<WaitingDepositResponse> getWaitingDeposits() {
        List<BankTransferPayment> payments = bankTransferPaymentRepository.findByStatus(BankTransferStatus.WAITING);

        return payments.stream().map(payment -> {
            List<Order> orders = orderRepository.findAllById(payment.getOrderIds());

            long totalAmount = orders.stream()
                    .mapToLong(Order::getTotalAmount)
                    .sum();

            return new WaitingDepositResponse(
                    payment.getId(),
                    payment.getOrderIds(),
                    payment.getDepositorName(),
                    payment.getDepositAccount().getBankName(),
                    payment.getDepositAccount().getAccountNumber(),
                    payment.getDepositDeadline(),
                    BigDecimal.valueOf(totalAmount)
            );
        }).toList();
    }

    // 관리자 - 입금확인 처리 (bankTransferPaymentId 기준 — 단건/다건 모두 이 하나의 레코드로 처리됨)
    @Transactional
    public void confirmDeposit(Long bankTransferPaymentId) {
        BankTransferPayment payment = bankTransferPaymentRepository.findById(bankTransferPaymentId)
                .orElseThrow(() -> new IllegalArgumentException("무통장입금 정보를 찾을 수 없습니다."));

        if (payment.getStatus() != BankTransferStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 입금 건입니다.");
        }

        List<Order> orders = orderRepository.findAllById(payment.getOrderIds());
        if (orders.size() != payment.getOrderIds().size()) {
            throw new IllegalArgumentException("주문을 찾을 수 없습니다.");
        }

        boolean hasInvalidStatus = orders.stream()
                .anyMatch(order -> order.getStatus() != OrderStatus.PENDING);
        if (hasInvalidStatus) {
            throw new IllegalStateException("입금 확인이 불가능한 주문 상태가 포함되어 있습니다.");
        }

        // 다건이어도 Toss와 동일하게 전부 같은 buyer 소속이어야 함
        User buyer = orders.get(0).getBuyer();
        boolean sameBuyer = orders.stream()
                .allMatch(order -> order.getBuyer().getUserId().equals(buyer.getUserId()));
        if (!sameBuyer) {
            throw new IllegalStateException("서로 다른 구매자의 주문이 섞여 있습니다.");
        }

        // Toss confirm 성공 시 호출하던 것과 동일한 지점 — Order 상태를 PENDING → CONFIRMED로 전이
        orderStatusService.confirmPayments(orders, buyer);

        payment.confirm();
    }
}