package kr.remerge.stylehub.domain.user.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.global.entity.BaseEntity;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_shipping_address_id")
    private Address defaultShippingAddress;

    // 기본 수령지
    @ManyToOne(fetch = FetchType.LAZY)
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

    // 비밀번호 변경 메서드
    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    // 정보 수정
    public void update(String email, String phone, String profileImageUrl) {
        if (name != null) {
            this.email = email;
        }
        if (phone != null) {
            this.phone = phone;
        }
        // 이미지를 바꾸지 않았을 때(null일 때) 기존 값을 유지하기 위함
        if (profileImageUrl != null) {
            this.profileImageUrl = profileImageUrl;
        }
    }

    // 회원 탈퇴 (소프트 삭제)
    public void delete() {
        this.status = UserStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

    public void updateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException(ErrorCode.UNVERIFIED_EMAIL);
        }
        this.email = email;
    }

    public void updatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException(ErrorCode.UNVERIFIED_PHONE);
        }
        this.phone = phone.replaceAll("[^0-9]", "");
    }

    public void updateProfileImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new BusinessException(ErrorCode.EMPTY_FILE);
        }
        this.profileImageUrl = imageUrl;
    }

    // ───────────────────────────────────────────
    // 기본 주소지 변경 비즈니스 메서드
    // ───────────────────────────────────────────

    /**
     * 기본 출고지(배송지) 변경
     */
    public void updateDefaultShippingAddress(Address address) {
        this.defaultShippingAddress = address;
    }

    /**
     * 기본 수령지 변경
     */
    public void updateDefaultReceivingAddress(Address address) {
        this.defaultReceivingAddress = address;
    }

    /**
     * 직원 권한 및 거래 유형 선택적 변경 (비즈니스 메서드)
     */
    public void updateRoles(UserRole newRole, BusinessRole newBusinessRole) {
        if (newRole != null) {
            this.role = newRole;
        }
        if (newBusinessRole != null) {
            this.businessRole = newBusinessRole;
        }
    }

    /**
     * 직원 상태 선택적 변경 (비즈니스 메서드)
     */
    public void updateStatus(UserStatus newStatus) {
        if (newStatus != null) {
            this.status = newStatus;

            // 💡 상태가 DELETED(탈퇴)로 변경될 때 자동으로 탈퇴 일시를 기록합니다.
            if (newStatus == UserStatus.DELETED) {
                this.deletedAt = LocalDateTime.now();
            } else {
                // 만약 탈퇴했다가 복구되는 케이스가 기획상 존재한다면, 기존 탈퇴 시간을 초기화해줍니다.
                this.deletedAt = null;
            }
        }
    }
}