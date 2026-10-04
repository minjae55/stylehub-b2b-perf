package kr.remerge.stylehub.domain.negotiation;

import jakarta.persistence.EntityManager;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.service.ContractService;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.negotiation.service.NegotiationService;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.service.QuoteService;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.common.ImageUploadService;
import kr.remerge.stylehub.global.config.JpaConfig;
import kr.remerge.stylehub.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3308/stylehub_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul",
        "spring.datasource.username=root",
        "spring.datasource.password=local1234",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
@Import({NegotiationService.class, UserReader.class, JpaConfig.class})

abstract class NegotiationTestBase {

    @MockitoBean
    protected QuoteService quoteService;

    @MockitoBean
    protected ContractService contractService;

    @MockitoBean
    protected ImageUploadService imageUploadService;

    @Autowired
    protected EntityManager em;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected NegotiationService negotiationService;

    protected TestFixtures fixtures;

    @BeforeEach
    void initFixtures() {
        fixtures = new TestFixtures(em);
    }

    protected void flushAndClear() {
        em.flush();
        em.clear();
    }

    protected Negotiation createNegotiation(Quote quote, User buyer, User seller,
                                            String title, LocalDateTime updatedAt) {

        Negotiation negotiation = new Negotiation("QUOTE", quote, null, buyer, seller, title);

        em.persist(negotiation);
        em.flush();
        jdbc.update("UPDATE negotiations SET updated_at = ? WHERE negotiation_id = ?",
                Timestamp.valueOf(updatedAt), negotiation.getNegotiationId());

        return negotiation;
    }

    protected NegotiationRequest createRequest(Negotiation negotiation, Quote quote, String content) {
        NegotiationRequest request =
                new NegotiationRequest(negotiation, quote, null, content, null, null);

        em.persist(request);
        return request;
    }

    protected LocalDateTime at(int day, int hour) {
        return LocalDateTime.of(2026, 1, day, hour, 0);
    }
}
