package kr.remerge.stylehub.global.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsService {
    public void sendSms(String phone, String message) {
        // 우선 콘솔 로그로만 인증번호가 출력되도록 만듭니다.
        log.info("[SMS 발송 수신처: {}] 내용: {}", phone, message);
    }
}