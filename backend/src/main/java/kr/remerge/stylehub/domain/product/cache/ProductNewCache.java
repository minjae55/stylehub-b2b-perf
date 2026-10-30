package kr.remerge.stylehub.domain.product.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.remerge.stylehub.domain.product.dto.ProductDto;
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
public class ProductNewCache {

    private static final String KEY = "products:new";
    private static final Duration TTL = Duration.ofHours(1);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public Optional<List<ProductDto.SummaryResponse>> get() {

        try {
            String json = redis.opsForValue().get(KEY);
            if (json == null) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(
                    json, new TypeReference<List<ProductDto.SummaryResponse>>() {
                    }));
        } catch (Exception e) {
            log.warn("신규 상품 캐시 조회 실패", e);
            return Optional.empty();
        }
    }

    public void put(List<ProductDto.SummaryResponse> value) {

        try {
            redis.opsForValue().set(KEY, objectMapper.writeValueAsString(value), TTL);
        } catch (Exception e) {
            log.warn("신규 상품 캐시 저장 실패", e);
        }
    }

    public void evict() {
        try {
            redis.delete(KEY);
        } catch (Exception e) {
            log.warn("신규 상품 캐시 삭제 실패", e);
        }
    }
}
