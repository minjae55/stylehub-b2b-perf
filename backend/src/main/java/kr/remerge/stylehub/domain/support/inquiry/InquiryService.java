package kr.remerge.stylehub.domain.support.inquiry;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository; // 프로젝트 실제 경로에 맞춤
import kr.remerge.stylehub.domain.support.enumtype.FaqCategory;
import kr.remerge.stylehub.domain.support.inquiry.dto.request.CreateInquiryRequest;
import kr.remerge.stylehub.domain.support.inquiry.dto.request.InquiryMessageRequest;
import kr.remerge.stylehub.domain.support.inquiry.dto.response.InquiryMessageResponse;
import kr.remerge.stylehub.domain.support.inquiry.dto.response.InquiryResponse;
import kr.remerge.stylehub.domain.support.inquiry.entity.Inquiry;
import kr.remerge.stylehub.domain.support.inquiry.entity.InquiryMessage;
import kr.remerge.stylehub.domain.support.inquiry.entity.InquiryMessageRead;
import kr.remerge.stylehub.domain.support.inquiry.enumtype.InquiryStatus;
import kr.remerge.stylehub.domain.support.inquiry.repository.InquiryMessageReadRepository;
import kr.remerge.stylehub.domain.support.inquiry.repository.InquiryMessageRepository;
import kr.remerge.stylehub.domain.support.inquiry.repository.InquiryRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository; // 프로젝트 실제 경로에 맞춤
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.notification.SseEmitterManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryMessageRepository inquiryMessageRepository;
    private final InquiryMessageReadRepository inquiryMessageReadRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final SseEmitterManager sseEmitterManager;

    /**
     * 1. 1:1 문의 내역 리스트 조회
     * - ADMIN     → 전체 회사의 모든 문의 조회
     * - PRESIDENT → 자기 회사 소속 전체 문의 조회 (본인 + 소속 직원)
     * - EMPLOYEE  → 본인이 생성한 문의만 조회
     */
    public List<InquiryResponse> getInquiries(AuthUser loginUser) {
        List<Inquiry> inquiries;

        if ("ADMIN".equals(loginUser.role())) {
            inquiries = inquiryRepository.findAllOrderByLastMessageAtOrCreatedAt();
        } else if ("PRESIDENT".equals(loginUser.role())) {
            inquiries = inquiryRepository.findByCompanyId(loginUser.companyId());
        } else { // EMPLOYEE
            inquiries = inquiryRepository.findByCreatedByUserId(loginUser.userId());
        }

        return inquiries.stream()
                .map(inquiry -> {
                    // 유저별 안 읽은 메시지 개수 구하기
                    Long unreadCount = countUnreadMessages(inquiry.getInquiryId(), loginUser.userId());
                    return InquiryResponse.of(inquiry, unreadCount);
                })
                .collect(Collectors.toList());
    }

    /**
     * 2. 특정 문의방 단건/상세 조회 및 권한 검증
     */
    public InquiryResponse getInquiryDetail(Integer inquiryId, AuthUser loginUser) {
        Inquiry inquiry = getInquiryWithVerification(inquiryId, loginUser);
        Long unreadCount = countUnreadMessages(inquiryId, loginUser.userId());
        return InquiryResponse.of(inquiry, unreadCount);
    }

    /**
     * 3. 새 1:1 문의방 생성 (최초 등록)
     */
    @Transactional
    public InquiryResponse createInquiry(CreateInquiryRequest request, AuthUser loginUser) {
        User user = userRepository.findById(loginUser.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Company company = companyRepository.findById(loginUser.companyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        FaqCategory faqCategory = FaqCategory.valueOf(request.category());

        Inquiry inquiry = Inquiry.builder()
                .company(company)
                .createdByUser(user)
                .category(faqCategory)
                .title(request.title())
                .status(InquiryStatus.OPEN)
                .build();

        Inquiry savedInquiry = inquiryRepository.save(inquiry);
        return InquiryResponse.of(savedInquiry, 0L);
    }

    /**
     * 4. 특정 문의방의 과거 메시지 대화 내역 전체 조회
     */
    public List<InquiryMessageResponse> getInquiryMessages(Integer inquiryId, AuthUser loginUser) {
        // 권한 체크 선행
        getInquiryWithVerification(inquiryId, loginUser);

        List<InquiryMessage> messages = inquiryMessageRepository.findByInquiry_InquiryIdOrderByCreatedAtAsc(inquiryId);
        return messages.stream()
                .map(InquiryMessageResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 5. 문의방 실시간 채팅 메시지 저장 (웹소켓 전용 + SSE 실시간 목록 알림 동시 발송)
     */
    @Transactional
    public InquiryMessageResponse saveChatMessage(Integer inquiryId, InquiryMessageRequest request, AuthUser loginUser) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의방입니다."));

        User sender = userRepository.getReferenceById(loginUser.userId());

        // ADMIN이 아닌 경우, 본인 소속 회사의 방인지 정밀 권한 검증
        if (!"ADMIN".equals(loginUser.role()) && !inquiry.getCompany().getCompanyId().equals(loginUser.companyId())) {
            throw new IllegalArgumentException("해당 문의방에 메시지를 보낼 권한이 없습니다.");
        }

        // 최초로 ADMIN이 답변을 작성하는 시점이라면 해당 ADMIN을 담당자로 지정
        if ("ADMIN".equals(loginUser.role()) && inquiry.getAssignedAdmin() == null) {
            inquiry.assignAdmin(sender);
        }

        // 1) 메시지 객체 생성 및 저장 (엔티티 빌더 패턴 반영)
        InquiryMessage chatMessage = InquiryMessage.builder()
                .inquiry(inquiry)
                .sender(sender)
                .message(request.message())
                .build();
        InquiryMessage savedMessage = inquiryMessageRepository.save(chatMessage);

        // 2) Inquiry 엔티티 내재 비즈니스 메서드로 상태 전환 (WAITING or ANSWERED) 및 시간 갱신
        inquiry.updateLastMessage(sender, request.message());

        // 3) 보낸 사람은 자동으로 읽음 처리 기록 생성
        InquiryMessageRead messageRead = new InquiryMessageRead(savedMessage, sender);
        inquiryMessageReadRepository.save(messageRead);

        // 4) 프론트엔드가 사용할 최종 응답 DTO 생성 (record 정적 팩토리 메서드 호출)
        InquiryMessageResponse response = InquiryMessageResponse.from(savedMessage);

        // 🌟 5) 상대방의 채팅방 목록을 실시간 갱신하기 위한 SSE 알림 발송 (정석 버전)
        sendChatListUpdateNotification(inquiry, response, loginUser);

        return response;
    }

    /**
     * 6. 문의방 읽음 처리 (채팅방 진입 시 unreadCount 초기화)
     */
    @Transactional
    public void markAsRead(Integer inquiryId, AuthUser loginUser) {
        Inquiry inquiry = getInquiryWithVerification(inquiryId, loginUser);
        User user = userRepository.getReferenceById(loginUser.userId());
        // 이 방에 작성된 메시지 중 '내가 읽지 않은 메시지 목록'을 추출
        List<InquiryMessage> unreadMessages = inquiryMessageRepository.findUnreadMessagesByInquiryAndUser(inquiryId, loginUser.userId());

        // 읽음 처리 벌크 인서트 혹은 순회 저장
        for (InquiryMessage msg : unreadMessages) {
            if (!inquiryMessageReadRepository.existsByMessageAndUser(msg.getMessageId(), user.getUserId())) {
                inquiryMessageReadRepository.save(new InquiryMessageRead(msg, user));
            }
        }
    }

    /**
     * [공통 내부 메서드] 문의방 권한 유효성 검증 로직
     */
    private Inquiry getInquiryWithVerification(Integer inquiryId, AuthUser loginUser) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의방입니다."));

        if ("ADMIN".equals(loginUser.role())) {
            return inquiry;
        }
        if ("PRESIDENT".equals(loginUser.role())) {
            if (!inquiry.getCompany().getCompanyId().equals(loginUser.companyId())) {
                throw new IllegalArgumentException("해당 소속 회사의 문의만 조회할 수 있습니다.");
            }
            return inquiry;
        }
        // EMPLOYEE
        if (!inquiry.getCreatedByUser().getUserId().equals(loginUser.userId())) {
            throw new IllegalArgumentException("본인이 작성한 문의만 접근할 수 있습니다.");
        }
        return inquiry;
    }

    /**
     * [공통 내부 메서드] 안 읽은 메시지 수 수식 계산
     * 전체 메시지 개수 - (해당 유저가 읽은 기록이 매핑된 메시지 개수)
     */
    private Long countUnreadMessages(Integer inquiryId, Integer userId) {
        Long totalMessages = inquiryMessageRepository.countByInquiryInquiryId(inquiryId);
        Long readMessages = inquiryMessageReadRepository.countByInquiryIdAndUserId(inquiryId, userId);
        return Math.max(0L, totalMessages - readMessages);
    }

    /**
     * 🌟 [추가 메서드] 채팅방 목록 실시간 업데이트 알림 발송 분기 로직
     */
    private void sendChatListUpdateNotification(Inquiry inquiry, InquiryMessageResponse response, AuthUser sender) {
        try {
            // 프론트엔드 Inquiry.tsx의 수신 이벤트명("CHAT_LIST_UPDATE")과 완벽히 일치시킴
            org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder sseEvent =
                    org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                            .name("CHAT_LIST_UPDATE")
                            .id(String.valueOf(response.messageId()))
                            .data(response); // JSON 구조로 자동 직렬화되어 클라이언트로 전송됨

            // 상황 A) 일반 직원(EMPLOYEE)이나 사장(PRESIDENT)이 문의 메시지를 보낸 경우 -> 전체 ADMIN(관리자)들에게 실시간 목록 갱신 푸시
            if ("EMPLOYEE".equals(sender.role()) || "PRESIDENT".equals(sender.role())) {
                sseEmitterManager.sendToRole("ADMIN", sseEvent);
            }

            // 상황 B) 관리자(ADMIN)가 답변 메시지를 보낸 경우 -> 해당 문의를 만든 유저와 사장님에게 푸시
            else if ("ADMIN".equals(sender.role())) {
                Integer createdByUserId = inquiry.getCreatedByUser().getUserId();
                Integer companyId = inquiry.getCompany().getCompanyId();

                // 1. 문의글 작성자(EMPLOYEE 혹은 사장님 본인)에게 실시간 전송
                sseEmitterManager.send(createdByUserId, sseEvent);

                // 2. UserRepository에 추가한 메서드를 사용해 사장님(PRESIDENT) 유저를 찾아 발송
                userRepository.findPresidentByCompanyId(companyId).ifPresent(president -> {
                    // 문의 작성자 본인이 사장님이 아닐 때만 (중복 발송 방지) 사장님 채널로도 전송
                    if (!createdByUserId.equals(president.getUserId())) {
                        sseEmitterManager.send(president.getUserId(), sseEvent);
                    }
                });
            }
        } catch (Exception e) {
            // 알림 실패가 메인 비즈니스 로직(채팅 저장 및 트랜잭션)에 영향을 주지 않도록 예외 차단
            System.err.println("실시간 채팅방 목록 SSE 알림 발송 실패: " + e.getMessage());
        }
    }
}