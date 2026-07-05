package kr.remerge.stylehub.global.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class SseEmitterManager {

    // userId → emitter 목록 (같은 유저가 여러 탭 열 수 있음)
    private final Map<Integer, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    // companyId → emitter 목록 (회사 단위 브로드캐스트용)
    private final Map<Integer, List<SseEmitter>> companyEmitters = new ConcurrentHashMap<>();

    // role → emitter 목록 (ADMIN 브로드캐스트용)
    private final Map<String, List<SseEmitter>> roleEmitters = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper;

    public SseEmitter add(Integer userId, Integer companyId, String role) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30분 타임아웃

        log.info("[SSE add] userId={}, companyId={}, role={}", userId, companyId, role);

        // 각 맵에 등록
        addToMap(userEmitters, userId, emitter);
        if (companyId != null) addToMap(companyEmitters, companyId, emitter);
        if (role != null) addToMap(roleEmitters, role, emitter);

        emitter.onCompletion(() -> {
            removeFromMap(userEmitters, userId, emitter);
            if (companyId != null) removeFromMap(companyEmitters, companyId, emitter);
            if (role != null) removeFromMap(roleEmitters, role, emitter);
        });
        emitter.onTimeout(() -> {
            removeFromMap(userEmitters, userId, emitter);
            if (companyId != null) removeFromMap(companyEmitters, companyId, emitter);
            if (role != null) removeFromMap(roleEmitters, role, emitter);
        });
        emitter.onError(e -> {
            removeFromMap(userEmitters, userId, emitter);
            if (companyId != null) removeFromMap(companyEmitters, companyId, emitter);
            if (role != null) removeFromMap(roleEmitters, role, emitter);
        });

        // 연결 직후 더미 이벤트 (브라우저 연결 유지용)
        try {
            emitter.send(SseEmitter.event().name("connect").data("connected"));
        } catch (IOException e) {
            removeFromMap(userEmitters, userId, emitter);
            if (companyId != null) removeFromMap(companyEmitters, companyId, emitter);
            if (role != null) removeFromMap(roleEmitters, role, emitter);
        }

        return emitter;
    }

    // Redis subscriber에서 호출 — NotificationMessage 파싱 후 타겟에 맞게 발송
    public void broadcast(String payload) {
        try {
            NotificationMessage msg = objectMapper.readValue(payload, NotificationMessage.class);

            log.info("[Broadcast] targetUserId={}, targetCompanyId={}, targetRole={} / roleEmitters keys={}",
                    msg.getTargetUserId(), msg.getTargetCompanyId(), msg.getTargetRole(), roleEmitters.keySet());

            if (msg.getTargetUserId() != null) {
                sendToEmitters(userEmitters.get(msg.getTargetUserId()), payload);
            } else if (msg.getTargetCompanyId() != null) {
                sendToEmitters(companyEmitters.get(msg.getTargetCompanyId()), payload);
            } else if (msg.getTargetRole() != null) {
                List<SseEmitter> matched = roleEmitters.get(msg.getTargetRole());
                log.info("[Broadcast] matched emitters for role={}: {}", msg.getTargetRole(),
                        matched == null ? "null" : matched.size());
                sendToEmitters(matched, payload);
            }
        } catch (Exception e) {
            log.error("Failed to parse notification payload: {}", payload, e);
        }
    }

    private void sendToEmitters(List<SseEmitter> emitters, String payload) {
        if (emitters == null || emitters.isEmpty()) return;
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    private <K> void addToMap(Map<K, List<SseEmitter>> map, K key, SseEmitter emitter) {
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(emitter);
    }

    private <K> void removeFromMap(Map<K, List<SseEmitter>> map, K key, SseEmitter emitter) {
        List<SseEmitter> list = map.get(key);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) map.remove(key);
        }
    }

    // =========================================================================================================
    // ── 특정 유저(userId) 단건에게 커스텀 SseEventBuilder 발송 ──
    public void send(Integer userId, SseEmitter.SseEventBuilder event) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        executeSend(emitters, event);
    }

    // ── 특정 권한군(role, 예: "ADMIN") 전체에게 커스텀 SseEventBuilder 발송 ──
    public void sendToRole(String role, SseEmitter.SseEventBuilder event) {
        List<SseEmitter> emitters = roleEmitters.get(role);
        executeSend(emitters, event);
    }

    /**
     * SseEventBuilder용 공통 실제 전송 헬퍼 로직 (안전한 동시성 순회)
     */
    private void executeSend(List<SseEmitter> emitters, SseEmitter.SseEventBuilder event) {
        if (emitters == null || emitters.isEmpty()) return;

        // 동시성 오류 방지를 위한 안전한 스냅샷 복사 후 순회
        List<SseEmitter> targetList = new ArrayList<>(emitters);

        for (SseEmitter emitter : targetList) {
            try {
                emitter.send(event);
            } catch (Exception e) {
                log.debug("[SSE] 개별 에미터 전송 실패 (정상적인 브라우저 종료 포함): {}", e.getMessage());
            }
        }
    }
    // =========================================================================================================
}