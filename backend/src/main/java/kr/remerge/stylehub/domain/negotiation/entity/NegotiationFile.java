package kr.remerge.stylehub.domain.negotiation.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "negotiation_files")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NegotiationFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "negotiation_file_id")
    private Integer negotiationFileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negotiation_request_id", nullable = false)
    private NegotiationRequest negotiationRequest;

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

    public NegotiationFile(
            NegotiationRequest negotiationRequest,
            User uploadedBy,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize
    ) {
        this.negotiationRequest = negotiationRequest;
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