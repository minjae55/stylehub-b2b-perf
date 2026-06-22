package kr.remerge.stylehub.domain.user.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Address;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    // 소속 회사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    // 기본 출고지
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_shipping_address_id")
    private Address defaultShippingAddress;

    // 기본 수령지
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_receiving_address_id")
    private Address defaultReceivingAddress;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(length = 20)
    private String name;

    @Column(length = 20)
    private String phone;

    // ADMIN / PRESIDENT / EMPLOYEE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    // BUYER / SELLER / BOTH
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private BusinessRole businessRole;

    @Column(length = 2000)
    private String profileImageUrl;

    // PENDING / APPROVED / SUSPENDED / DELETED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    private LocalDateTime lastLoginAt;

    private LocalDateTime deletedAt;

    @Column(length = 45)
    private String lastLoginIp;

    @Column(nullable = false, columnDefinition = "tinyint default 0")
    @Builder.Default
    private int failedLoginAttempts = 0;

    // ───────────────────────────────────────────
    // 로그인 관련 상태 변경 메서드
    // ───────────────────────────────────────────

    // 로그인 성공 시 호출
    public void onLoginSuccess(String clientIp) {
        this.failedLoginAttempts = 0;
        this.lastLoginAt = LocalDateTime.now();
        this.lastLoginIp = clientIp;
    }

    // 로그인 실패 시 호출
    public void onLoginFailed() {
        this.failedLoginAttempts++;
    }

    // 정보 수정
    public void update(String name, String phone, String profileImageUrl) {
        this.name = name;
        this.phone = phone;
        this.profileImageUrl = profileImageUrl;
    }

    // 회원 탈퇴 (소프트 삭제)
    public void delete() {
        this.status = UserStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

    public void updateDefaultReceivingAddress(Address address) {
        this.defaultReceivingAddress = address;
    }
}