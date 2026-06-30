package kr.remerge.stylehub.global.common.service;

import jakarta.mail.internet.MimeMessage;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * 공통 HTML 메일 발송 메서드
     */
    public void sendHtmlEmail(String to, String subject, String content) {
        log.info("[메일 발송 요청] 수신처: {}, 제목: {}", to, subject);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            // true: 멀티파트 메시지 지원 (HTML 및 이미지/첨부 등)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true); // true를 주어야 HTML 태그가 정상 렌더링됩니다.

            mailSender.send(message);
            log.info("[메일 발송 완료] 수신처: {}", to);

        } catch (Exception e) {
            log.error("[메일 발송 실패] 수신처: {}, 에러: {}", to, e.getMessage(), e);
            // 메일 발송 실패 시 커스텀 예외 발생
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }
}