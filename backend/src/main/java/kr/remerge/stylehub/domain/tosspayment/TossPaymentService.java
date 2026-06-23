package kr.remerge.stylehub.domain.tosspayment;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.order.entity.Order; 
import kr.remerge.stylehub.domain.tosspayment.entity.TossPayments;
import kr.remerge.stylehub.domain.tosspayment.enumtype.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TossPaymentService {
    private final TossPaymentRepository tosspaymentRepository;
    private final TossPaymentsClient tossPaymentsClient;

    @PersistenceContext
    private final EntityManager em;

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest dto) {
        try { // 💡 어디서 터지는지 정확히 잡기 위해 전체 로그 트래킹 시작
            
            // 1. 토스 페이먼츠 승인 외부 API 호출
            PaymentResult tossResult = tossPaymentsClient.confirm(dto);

            // 2. ✨ [수정] 21억이 넘는 주문번호 숫자를 안전하게 Long으로 파싱합니다.
            String numericIdStr = dto.orderId().replaceAll("[^0-9]", ""); 
            Long realOrderPk = Long.parseLong(numericIdStr); 

            // 3. 만약 타인이 만든 Order 엔티티의 @Id 타입이 Integer(int)라면 내부적으로 한 번 더 가공해줍니다.
            // 만약 원래 Order의 PK가 Integer라면: realOrderPk.intValue()
            // 원래 Order의 PK가 Long이라면: realOrderPk 그대로 대입
            // (여기서는 에러 방지를 위해 가짜 프록시 객체 생성 시 타입을 유연하게 맞춥니다)
            Object orderIdParam = realOrderPk; 
            
            // 💡 만약 컴파일 에러가 나면 Order 엔티티 ID 타입에 맞춰 아래 주석 중 하나를 선택하세요.
            // Order proxyOrder = em.getReference(Order.class, realOrderPk.intValue()); // Integer일 때
            Order proxyOrder = em.getReference(Order.class, realOrderPk);             // Long일 때

            // 4. 데이터 빌드 및 인서트
            TossPayments tossPayments = TossPayments.builder()
                    .tossPaymentKey(dto.paymentKey()) 
                    .tossOrderId(dto.orderId())       
                    .order(proxyOrder)                
                    .status("DONE")                   
                    .amount(dto.amount())             
                    .method(tossResult.method())      
                    .requestedAt(LocalDateTime.now()) 
                    .approvedAt(OffsetDateTime.parse(tossResult.approvedAt()).toLocalDateTime()) 
                    .build();

            tosspaymentRepository.save(tossPayments);

            return new PaymentResponse(tossPayments.getTossPaymentKey(), tossPayments.getTossOrderId(), "DONE");

        } catch (Exception e) {
            // 🚨 500 에러가 발생하면 콘솔창에 진짜 범인이 누구인지 빨간 글씨로 에러를 강제 출력합니다.
            System.err.println("=== 토스 결제 승인 중 백엔드 에러 발생 ===");
            e.printStackTrace(); 
            throw e; // 기존 예외 구조 유지
        }
    }

    @Transactional
    public PaymentResponse cancelPayment(String paymentKey, PaymentCancelRequest request) {
        TossPayments tossPayments = tosspaymentRepository.findById(paymentKey)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        tossPaymentsClient.cancel(paymentKey, request);
        tossPayments.updateStatus(PaymentStatus.CANCELED);
        
        return new PaymentResponse(tossPayments.getTossPaymentKey(), tossPayments.getTossOrderId(), "CANCELED");
    }
}