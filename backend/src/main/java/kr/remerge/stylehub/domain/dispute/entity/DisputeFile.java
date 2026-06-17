package kr.remerge.stylehub.domain.dispute.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "dispute_files",
        indexes = {
                @Index(name = "idx_dispute_file", columnList = "dispute_id"),
                @Index(name = "idx_dispute_response_file", columnList = "dispute_response_id")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DisputeFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_file_id")
    private Integer disputeFileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_response_id")
    private DisputeResponse disputeResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private User uploadedBy;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 2000)
    private String fileUrl;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public DisputeFile(
            Dispute dispute,
            DisputeResponse disputeResponse,
            User uploadedBy,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize
    ) {
        this.dispute = dispute;
        this.disputeResponse = disputeResponse;
        this.uploadedBy = uploadedBy;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}