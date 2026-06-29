package kr.remerge.stylehub.global.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private Long targetUserId;
    private String type;       // ex) "QUOTE_SUBMITTED", "QUOTE_APPROVED"
    private String message;    // 화면에 표시할 텍스트
    private Long requestId;    // 관련 소싱 요청 ID (optional)
}
