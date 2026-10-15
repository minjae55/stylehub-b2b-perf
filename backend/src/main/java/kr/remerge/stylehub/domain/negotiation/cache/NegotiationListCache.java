package kr.remerge.stylehub.domain.negotiation.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class NegotiationListCache {

    private static final String KEY_PREFIX = "negotiationList:";
    private static final Duration TTL = Duration.ofSeconds(60);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    private String key(Integer userId) {
        return KEY_PREFIX + userId;
    }

    private String field(int page, int size) {
        return page + " : " + size;
    }

    public Optional<List<NegotiationListResponse>> get(Integer userId, int page, int size) {

        try {
            Object json = redis.opsForHash().get(key(userId), field(page, size));

            if (json == null) {
                return Optional.empty();
            }

            List<NegotiationListResponse> value = objectMapper.readValue(
                    (String) json, new TypeReference<List<NegotiationListResponse>>() {
                    });

            return Optional.of(value);
        } catch (Exception e) {
            log.warn("협의 목록 캐시 조회 실패 userId={}", userId, e);
            return Optional.empty();
        }

    }

    public void put(Integer userId, int page, int size, List<NegotiationListResponse> value) {
        try {
            String key = key(userId);
            redis.opsForHash().put(key, field(page, size),
                    objectMapper.writeValueAsString(value));

            Long ttl = redis.getExpire(key);

            if (ttl == null || ttl < 0) {
                redis.expire(key, TTL);
            }

        } catch (Exception e) {
            log.warn("협의 목록 캐시 저장 실패 userId={}", userId, e);
        }

    }

    public void evict(Integer... userIds) {
        try {
            for (Integer userId : userIds) {
                redis.delete(key(userId));
            }
        } catch (Exception e) {
            log.warn("협의 목록 캐시 삭제 실패 userIds={}", (Object) userIds, e);
        }
    }

}
