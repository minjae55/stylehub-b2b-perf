package kr.remerge.stylehub.global.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {
    public void sendHtmlEmail(String to, String subject, String content) {
        log.info("[메일 발송 수신처: {}] 제목: {} / 내용: {}", to, subject, content);
    }
}