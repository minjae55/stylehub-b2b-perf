import { useEffect, useRef } from "react";
import toast from "react-hot-toast"; // 또는 원하는 toast 라이브러리

interface NotificationMessage {
  targetUserId: number;
  type: string;
  message: string;
  requestId?: number;
}

// TODO: JWT 연동 후 userId 파라미터 제거
export function useNotification(userId: number | null) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId) return;

    const es = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/notifications/subscribe?userId=${userId}`
    );
    esRef.current = es;

    es.addEventListener("connect", () => {
      console.log("SSE connected");
    });

    es.addEventListener("notification", (e) => {
      try {
        const data: NotificationMessage = JSON.parse(e.data);
        toast(data.message, {
          icon: getIcon(data.type),
          duration: 4000,
        });
      } catch {
        console.error("Failed to parse notification", e.data);
      }
    });

    es.onerror = () => {
      console.warn("SSE connection error, retrying...");
    };

    return () => {
      es.close();
    };
  }, [userId]);
}

function getIcon(type: string): string {
  switch (type) {
    case "QUOTE_SUBMITTED": return "📩";
    case "QUOTE_APPROVED":  return "✅";
    case "QUOTE_DECLINED":  return "❌";
    default:                return "🔔";
  }
}
