import api from "@/api/axios";

// 백엔드 Notification 엔티티 필드 기준
export interface NotificationResponse {
    notificationId: number;
    type: string;
    message: string;
    referenceId: number | null;
    referenceType: string | null;
    targetUserId: number | null;
    targetCompanyId: number | null;
    targetRole: string | null;
    isRead: boolean;
    createdAt: string;
}

// 백엔드 NotificationPageResult 기준 (커서 기반 페이지네이션)
export interface NotificationPageResponse {
    items: NotificationResponse[];
    nextCursor: number | null;
    hasNext: boolean;
}

// ───────────────────────────────────────────
// 알림
// ───────────────────────────────────────────

// cursor 없이 호출하면 최신 알림부터 size개, 이후 페이지는 이전 응답의 nextCursor를 넘겨서 호출
export const getNotifications = async (
    cursor?: number,
    size: number = 20
): Promise<NotificationPageResponse> => {
    return await api.get<NotificationPageResponse>("/notifications", {
        params: { cursor, size },
    });
};

export const getUnreadCount = async (): Promise<number> => {
    return await api.get<number>("/notifications/unread-count");
};

export const markAsRead = async (notificationId: number): Promise<void> => {
    await api.patch<void>(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
    await api.patch<void>("/notifications/read-all");
};
