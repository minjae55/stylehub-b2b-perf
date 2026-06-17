package kr.remerge.stylehub.domain.contract.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.contract.enumtype.SignerRole;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "contract_signatures")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContractSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_signature_id")
    private Integer contractSignatureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signer_id", nullable = false)
    private User signer;

    @Enumerated(EnumType.STRING)
    @Column(name = "signer_role", nullable = false)
    private SignerRole signerRole;

    @Column(name = "signature_text", length = 100)
    private String signatureText;

    @Column(name = "signature_image_url", length = 2000)
    private String signatureImageUrl;

    @Column(name = "signature_hash", length = 255)
    private String signatureHash;

    @Column(name = "signed_ip", length = 45)
    private String signedIp;

    @Column(name = "signed_user_agent", length = 500)
    private String signedUserAgent;

    @Column(name = "signed_at", nullable = false)
    private LocalDateTime signedAt;

    public ContractSignature(
            Contract contract,
            User signer,
            SignerRole signerRole,
            String signatureText,
            String signatureImageUrl,
            String signatureHash,
            String signedIp,
            String signedUserAgent
    ) {
        this.contract = contract;
        this.signer = signer;
        this.signerRole = signerRole;
        this.signatureText = signatureText;
        this.signatureImageUrl = signatureImageUrl;
        this.signatureHash = signatureHash;
        this.signedIp = signedIp;
        this.signedUserAgent = signedUserAgent;
    }

    @PrePersist
    protected void onCreate() {
        this.signedAt = LocalDateTime.now();
    }
}