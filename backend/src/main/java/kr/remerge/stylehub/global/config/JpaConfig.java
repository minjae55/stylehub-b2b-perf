package kr.remerge.stylehub.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// JPA 설정 클래스
// @EnableJpaAuditing : @CreatedDate, @LastModifiedDate 자동 주입 활성화
// BaseEntity의 createdAt, updatedAt이 동작하려면 반드시 필요
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}