package kr.remerge.stylehub.domain.negotiation;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationCreateRequest;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NegotiationCreateTest extends NegotiationTestBase {

    private User buyer;
    private User seller;
    private User outsider;
    private Quote quote;

    @BeforeEach
    void setUp() {
        Company buyerCompany = fixtures.createCompany("바이어컴퍼니", "111-11-11111");
        Company sellerCompany = fixtures.createCompany("셀러컴퍼니", "222-22-22222");

        buyer = fixtures.createUser("buyer@test.com", "바이어일", buyerCompany, BusinessRole.BUYER);
        seller = fixtures.createUser("seller@test.com", "셀러일", sellerCompany, BusinessRole.SELLER);
        outsider = fixtures.createUser("outsider@test.com", "외부인", buyerCompany, BusinessRole.BUYER);

        quote = fixtures.createQuote(buyer, seller, "Q-A", "A 상품");

        flushAndClear();
    }

    private NegotiationCreateRequest quoteRequest(String content) {
        return new NegotiationCreateRequest(quote.getQuoteId(), null, content, 9000L, 10, "QUOTE");
    }

    private Integer countNegotiations() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM negotiations", Integer.class);
    }

    private Integer countRequests() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM negotiation_requests", Integer.class);
    }

    @Test
    @DisplayName("바이어가 견적에 협의를 요청하면 바이어와 셀러가 기록된 협의와 첫 요청이 만들어진다")
    void 협의_생성() {
        negotiationService.createNegotiation(buyer.getUserId(), quoteRequest("단가를 낮춰주세요"));
        flushAndClear();

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT buyer_id, seller_id, quote_id, status, title FROM negotiations");

        assertThat(row.get("buyer_id")).isEqualTo(buyer.getUserId());
        assertThat(row.get("seller_id")).isEqualTo(seller.getUserId());
        assertThat(row.get("quote_id")).isEqualTo(quote.getQuoteId());
        assertThat(row.get("status")).isEqualTo("OPEN");
        assertThat(row.get("title")).isEqualTo("A 상품 견적 조건 협의");
        assertThat(countRequests()).isEqualTo(1);
    }

    @Test
    @DisplayName("협의를 요청하면 견적 상태가 NEGOTIATING으로 바뀐다")
    void 견적_상태_변경() {
        negotiationService.createNegotiation(buyer.getUserId(), quoteRequest("단가를 낮춰주세요"));
        flushAndClear();

        String status = jdbc.queryForObject(
                "SELECT status FROM quotes WHERE quote_id = ?", String.class, quote.getQuoteId());

        assertThat(status).isEqualTo(QuoteStatusCode.NEGOTIATING);
    }

    @Test
    @DisplayName("같은 견적에 다시 요청하면 새 협의를 만들지 않고 기존 협의에 요청이 추가된다")
    void 기존_협의_재사용() {
        negotiationService.createNegotiation(buyer.getUserId(), quoteRequest("단가를 낮춰주세요"));
        flushAndClear();

        negotiationService.createNegotiation(buyer.getUserId(), quoteRequest("납기도 줄여주세요"));
        flushAndClear();

        assertThat(countNegotiations()).isEqualTo(1);
        assertThat(countRequests()).isEqualTo(2);
    }

    @Test
    @DisplayName("본인이 바이어가 아닌 견적에는 협의를 요청할 수 없다")
    void 남의_견적_거부() {
        assertThatThrownBy(() ->
                negotiationService.createNegotiation(outsider.getUserId(), quoteRequest("단가를 낮춰주세요")))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.QUOTE_NOT_FOUND);

        assertThat(countNegotiations()).isZero();
    }

    @Test
    @DisplayName("협의할 수 없는 상태의 견적에는 요청할 수 없다")
    void 협의_불가_상태_거부() {
        em.find(Quote.class, quote.getQuoteId()).changeStatus(QuoteStatusCode.APPROVED);
        flushAndClear();

        assertThatThrownBy(() ->
                negotiationService.createNegotiation(buyer.getUserId(), quoteRequest("단가를 낮춰주세요")))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.QUOTE_NOT_NEGOTIABLE);
    }
}
