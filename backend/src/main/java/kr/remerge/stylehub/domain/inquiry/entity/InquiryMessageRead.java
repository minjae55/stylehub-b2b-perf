package kr.remerge.stylehub.domain.inquiry.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "inquiry_message_reads")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryMessageRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_read_id")
    private Integer messageReadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private InquiryMessage message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public InquiryMessageRead(
            InquiryMessage message,
            User user
    ) {
        this.message = message;
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        this.readAt = LocalDateTime.now();
    }
}