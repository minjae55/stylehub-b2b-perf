package kr.remerge.stylehub.domain.company.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Integer addressId;

    // 소속 회사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "address_name", nullable = false, length = 50)
    private String addressName;

    @Column(length = 20)
    private String zipcode;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ───────────────────────────────────────────
    // 상태 변경 메서드
    // ───────────────────────────────────────────

    // 주소 소프트 삭제
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    // 주소 수정
    public void update(String addressName, String zipcode,
                       String address, String addressDetail) {
        this.addressName = addressName;
        this.zipcode = zipcode;
        this.address = address;
        this.addressDetail = addressDetail;
    }
}