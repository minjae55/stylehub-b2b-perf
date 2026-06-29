package kr.remerge.stylehub.global.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SseEmitterManager emitterManager;

    /**
     * SSE 연결
     * JWT 붙기 전까지는 userId를 쿼리파라미터로 받음
     * TODO: JWT 연동 후 토큰에서 userId 추출로 변경
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam Long userId) {
        return emitterManager.add(userId);
    }
}
