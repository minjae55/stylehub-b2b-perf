package kr.remerge.stylehub.domain.dispute.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.dispute.enumtype.ResponderRole;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "dispute_responses",
        indexes = {
                @Index(name = "idx_dispute_created", columnList = "dispute_id, created_at"),
                @Index(name = "idx_responder", columnList = "responder_id")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DisputeResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_response_id")
    private Integer disputeResponseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", nullable = false)
    private User responder;

    @Enumerated(EnumType.STRING)
    @Column(name = "responder_role", nullable = false)
    private ResponderRole responderRole;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public DisputeResponse(
            Dispute dispute,
            User responder,
            ResponderRole responderRole,
            String status,
            String content
    ) {
        this.dispute = dispute;
        this.responder = responder;
        this.responderRole = responderRole;
        this.status = status;
        this.content = content;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}