package kr.remerge.stylehub.global.notification;


import kr.remerge.stylehub.global.config.RedisConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisPublisher {

    private final RedisTemplate<String, String> redisTemplate;

    public void publish(String message) {
        redisTemplate.convertAndSend(RedisConfig.NOTIFICATION_CHANNEL, message);
    }
}
