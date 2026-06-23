package kr.remerge.stylehub.global.common;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@RequiredArgsConstructor
public class RedisRepository {

    private final StringRedisTemplate redisTemplate;

    /**
     * 데이터 저장 (만료 시간 설정 가능)
     * OTP 발송, 임시 토큰 저장 등에 사용
     */
    public void save(String key, String value, Duration timeout) {
        redisTemplate.opsForValue().set(key, value, timeout);
    }

    /**
     * 데이터 조회
     */
    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * 데이터 삭제 (OTP 인증 완료 후 파기, 로그아웃 등)
     */
    public boolean delete(String key) {
        return redisTemplate.delete(key);
    }
}