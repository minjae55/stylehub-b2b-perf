package kr.remerge.stylehub.domain.product.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import kr.remerge.stylehub.domain.product.dto.ProductDto;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;

@Component
public class ProductNewLocalCache {

    private static final String KEY = "products:new";

    private final Cache<String, List<ProductDto.SummaryResponse>> cache =
            Caffeine.newBuilder()
                    .maximumSize(1)
                    .expireAfterWrite(Duration.ofMinutes(5))
                    .build();

    public List<ProductDto.SummaryResponse> get() {
        return cache.getIfPresent(KEY);
    }

    public void put(List<ProductDto.SummaryResponse> value) {
        cache.put(KEY, value);
    }

    public void evict() {
        cache.invalidate(KEY);
    }

    public List<ProductDto.SummaryResponse> getOrLoad(Supplier<List<ProductDto.SummaryResponse>> loader) {
        return cache.get(KEY, key -> loader.get());
    }
}
