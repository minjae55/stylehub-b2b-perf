package kr.remerge.stylehub.domain.inquiry.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.inquiry.enumtype.InquiryStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "inquiries")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_id")
    private Integer inquiryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_sender_id")
    private User lastSender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InquiryStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id")
    private User assignedAdmin;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    public Inquiry(
            Company company,
            User createdByUser,
            String category,
            String title
    ) {
        this.company = company;
        this.createdByUser = createdByUser;
        this.category = category;
        this.title = title;
        this.status = InquiryStatus.OPEN;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void assignAdmin(User admin) {
        this.assignedAdmin = admin;
    }

    public void updateLastMessage(User sender) {
        this.lastSender = sender;
        this.lastMessageAt = LocalDateTime.now();

        if (sender.equals(this.assignedAdmin)) {
            this.status = InquiryStatus.ANSWERED;
        } else {
            this.status = InquiryStatus.WAITING;
        }
    }

    public void close() {
        this.status = InquiryStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
    }
}