package kr.remerge.stylehub.global.notification.controller;

import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.notification.SseEmitterManager;
import kr.remerge.stylehub.global.notification.dto.NotificationPageResult;
import kr.remerge.stylehub.global.notification.entity.Notification;
import kr.remerge.stylehub.global.notification.service.NotificationService;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SseEmitterManager emitterManager;
    private final NotificationService notificationService;

    // SSE 연결 — JWT에서 userId, companyId, role 추출
    // role: ADMIN 브로드캐스트 용도 (ADMIN / PRESIDENT / EMPLOYEE). businessRole(BUYER/SELLER/BOTH)과 혼동 금지.
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@LoginUser AuthUser authUser) {
        return emitterManager.add(
                authUser.userId(),
                authUser.companyId(),
                authUser.role()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPageResult>> getNotifications(
            @LoginUser AuthUser authUser,
            @RequestParam(required = false) Integer cursor,
            @RequestParam(defaultValue = "20") int size
    ) {
        NotificationPageResult result = notificationService.getNotifications(
                authUser.userId(),
                authUser.companyId(),
                authUser.role(),
                cursor,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // 읽지 않은 알림 수
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @LoginUser AuthUser authUser
    ) {
        long count = notificationService.countUnread(
                authUser.userId(),
                authUser.companyId(),
                authUser.role()
        );
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    // 단건 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @LoginUser AuthUser authUser,
            @PathVariable Integer notificationId
    ) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 전체 읽음 처리
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @LoginUser AuthUser authUser
    ) {
        notificationService.markAllAsRead(
                authUser.userId(),
                authUser.companyId(),
                authUser.role()
        );
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}