package kr.remerge.stylehub.global.notification.dto;

import kr.remerge.stylehub.global.notification.entity.Notification;

import java.util.List;

public record NotificationPageResult(
        List<Notification> items,
        Integer nextCursor,
        boolean hasNext
) {}