package kr.remerge.stylehub.global.common.service;

import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsService {

    private final DefaultMessageService messageService;

    @Value("${coolsms.api.from}")
    private String fromNumber;

    // 생성자에서 더 이상 StringRedisTemplate을 받지 않습니다. 깔끔하게 제거!
    public SmsService(
            @Value("${coolsms.api.key}") String apiKey,
            @Value("${coolsms.api.secret}") String apiSecret
    ) {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    /**
     * 오직 들어온 번호와 조립된 문자 내용을 CoolSMS로 전송만 하는 단순 메서드
     * 성공하면 true, 실패하면 false를 리턴하여 UserService가 흐름을 제어할 수 있게 만듭니다.
     */
    public boolean sendSms(String phone, String messageContent) {
        // 1. CoolSMS 메시지 객체 생성 및 세팅
        Message message = new Message();
        message.setFrom(fromNumber);
        message.setTo(phone);
        message.setText(messageContent);

        try {
            // 2. 문자 발송 API 호출
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("[SMS 발송 성공] 수신처: {}, 결과 코드: {}", phone, response.getStatusCode());
            return true;
        } catch (Exception e) {
            log.error("[SMS 발송 실패] 수신처: {}, 에러 원인: {}", phone, e.getMessage(), e);
            return false;
        }
    }
}