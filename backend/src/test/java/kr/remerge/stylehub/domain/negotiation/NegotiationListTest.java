package kr.remerge.stylehub.domain.negotiation;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationListResponse;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class NegotiationListTest extends NegotiationTestBase {

    private User buyer1;
    private User buyer2;
    private User seller1;
    private User seller2;

    private Negotiation n1;
    private Negotiation n2;
    private Negotiation n3;

    @BeforeEach
    void setUp() {
        Company buyerCompany = fixtures.createCompany("바이어컴퍼니", "111-11-11111");
        Company sellerCompany = fixtures.createCompany("셀러컴퍼니", "222-22-22222");

        buyer1 = fixtures.createUser("buyer1@test.com", "바이어일", buyerCompany, BusinessRole.BUYER);
        buyer2 = fixtures.createUser("buyer2@test.com", "바이어이", buyerCompany, BusinessRole.BUYER);
        seller1 = fixtures.createUser("seller1@test.com", "셀러일", sellerCompany, BusinessRole.SELLER);
        seller2 = fixtures.createUser("seller2@test.com", "셀러이", sellerCompany, BusinessRole.SELLER);

        Quote quoteA = fixtures.createQuote(buyer1, seller1, "Q-A", "A 상품");
        Quote quoteB = fixtures.createQuote(buyer1, seller2, "Q-B", "B 상품");
        Quote quoteC = fixtures.createQuote(buyer2, seller1, "Q-C", "C 상품");

        n1 = createNegotiation(quoteA, buyer1, seller1, "A 견적 조건 협의",at(1, 10));
        n2 = createNegotiation(quoteB, buyer1, seller2, "B 견적 조건 협의",at(3, 10));
        n3 = createNegotiation(quoteC, buyer2, seller1, "C 견적 조건 협의",at(2, 10));

        flushAndClear();
    }

    @Test
    @DisplayName("바이어로 조회하면 본인이 바이어인 협의만 최신순으로 반환한다")
    void 바이어로_조회() {
        List<NegotiationListResponse> result =
                negotiationService.getNegotiationList(buyer1.getUserId(), 0, 20);

        assertThat(result)
                .extracting(NegotiationListResponse::negotiationId)
                .containsExactly(n2.getNegotiationId(), n1.getNegotiationId());
    }

    @Test
    @DisplayName("셀러로 조회하면 본인이 셀러인 협의만 최신순으로 반환한다")
    void 셀러로_조회() {
        List<NegotiationListResponse> result =
                negotiationService.getNegotiationList(seller1.getUserId(), 0, 20);

        assertThat(result)
                .extracting(NegotiationListResponse::negotiationId)
                .containsExactly(n3.getNegotiationId(), n1.getNegotiationId());
    }

    @Test
    @DisplayName("목록 응답에 협의 유형, 양측 id와 이름이 담긴다")
    void 응답_정보_확인() {

        NegotiationListResponse response = negotiationService
                .getNegotiationList(buyer1.getUserId(), 0, 20).stream()
                .filter(r -> r.negotiationId().equals(n1.getNegotiationId()))
                .findFirst().orElseThrow();

        assertThat(response.negotiationType()).isEqualTo("QUOTE");

        assertThat(response.buyerId()).isEqualTo(buyer1.getUserId());
        assertThat(response.sellerId()).isEqualTo(seller1.getUserId());

        assertThat(response.buyerName()).isEqualTo(buyer1.getName());
        assertThat(response.sellerName()).isEqualTo(seller1.getName());


    }

    @Test
    @DisplayName("관리자가 배정된 협의는 관리자 이름이 담기고, 배정 전이면 null이다")
    void 관리자_이름() {

        User admin = fixtures.createUser("admin@test.com", "관리자", null, UserRole.ADMIN, BusinessRole.BUYER);
        em.find(Negotiation.class, n1.getNegotiationId()).assignAdmin(admin);
        flushAndClear();

        List<NegotiationListResponse> result =
                negotiationService.getNegotiationList(buyer1.getUserId(), 0, 20);

        assertThat(result)
                .filteredOn(r -> r.negotiationId().equals(n1.getNegotiationId()))
                .extracting(NegotiationListResponse::adminName)
                .containsExactly("관리자");
        assertThat(result)
                .filteredOn(r -> r.negotiationId().equals(n2.getNegotiationId()))
                .extracting(NegotiationListResponse::adminName)
                .containsExactly((String) null);
    }
}
