package kr.remerge.stylehub.domain.support.entity;


import jakarta.persistence.*;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

@Entity
@Table(name = "faqs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Faq extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "faq_id")
    private Integer faqId;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false, length = 1000)
    private String answer;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
