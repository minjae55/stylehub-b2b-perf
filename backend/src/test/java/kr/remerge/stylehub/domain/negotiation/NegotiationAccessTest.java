package kr.remerge.stylehub.domain.negotiation;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationFileResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRequestDetailResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRespondRequest;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRespondRequest.Item;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationFile;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NegotiationAccessTest extends NegotiationTestBase {

    private User buyer1;
    private User seller1;
    private User outsider;

    private Negotiation n1;

    private NegotiationRequest request;

    @BeforeEach
    void setUp() {

        Company buyerCompany = fixtures.createCompany("바이어컴퍼니", "111-11-11111");
        Company sellerCompany = fixtures.createCompany("셀러컴퍼니", "222-22-22222");
        Company outsiderCompany = fixtures.createCompany("테스트컴퍼니", "333-33-33333");

        buyer1 = fixtures.createUser("buyer1@test.com", "바이어일", buyerCompany, BusinessRole.BUYER);
        seller1 = fixtures.createUser("seller1@test.com", "셀러일", sellerCompany, BusinessRole.SELLER);
        outsider = fixtures.createUser("outsider@test.com", "외부인", outsiderCompany, BusinessRole.BUYER);

        Quote quoteA = fixtures.createQuote(buyer1, seller1, "Q-A", "A 상품");

        n1 = createNegotiation(quoteA, buyer1, seller1, "A 견적 조건 협의",at(1, 10));

        request = createRequest(n1, quoteA, "협의 내용");

        flushAndClear();
    }

    @Nested
    @DisplayName("요청 목록")
    class 요청_목록 {

        @Test
        @DisplayName("바이어는 요청 목록 조회 가능")
        void 바이어_요청_목록_조회_가능() {

            List<NegotiationRequestDetailResponse> requests = negotiationService.getNegotiationRequests(buyer1.getUserId()
                    , n1.getNegotiationId());

            assertThat(requests)
                    .extracting(NegotiationRequestDetailResponse::negotiationRequestId)
                    .containsExactly(request.getNegotiationRequestId());
        }

        @Test
        @DisplayName("셀러는 요청 목록 조회 가능")
        void 셀러_요청_목록_조회_가능() {

            List<NegotiationRequestDetailResponse> requests = negotiationService.getNegotiationRequests(seller1.getUserId()
                    , n1.getNegotiationId());

            assertThat(requests)
                    .extracting(NegotiationRequestDetailResponse::negotiationRequestId)
                    .containsExactly(request.getNegotiationRequestId());
        }

        @Test
        @DisplayName("당사자가 아니면 협의 요청 목록 볼 수 없음")
        void 제3자_거부 () {

            assertThatThrownBy(() ->
                    negotiationService.getNegotiationRequests(outsider.getUserId(),
                            n1.getNegotiationId()))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                            .isEqualTo(ErrorCode.FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("요청에 대한 응답")
    class 요청_응답 {

        NegotiationRespondRequest respondRequest;
        List<Item> items;

        @Test
        @DisplayName("셀러가 아니면 응답할 수 없다")
        void 셀러가_아니면_응답_불가() {

            respondRequest = new NegotiationRespondRequest("셀러 메모", 3, 1L, LocalDateTime.now(), items, "계약 내용",
                    LocalDate.now(), "결제 조건", "반품 정책", "특약 사항", 3L);

            assertThatThrownBy(() ->
                    negotiationService.respondToNegotiation(buyer1.getUserId(), request.getNegotiationRequestId(), respondRequest)
            ).isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                            .isEqualTo(ErrorCode.FORBIDDEN));

        }
    }

    @Nested
    @DisplayName("첨부 파일 목록 조회")
    class 파일_목록 {

        @BeforeEach
        void uploadOneFile() {
            em.persist(new NegotiationFile(
                    em.getReference(NegotiationRequest.class,
                            request.getNegotiationRequestId()),
                    em.getReference(User.class, buyer1.getUserId()),
                    "도면.png", "https://files.test/도면.png", "image/png", 1024L));
            flushAndClear();

        }

        @Test
        @DisplayName("바이어는 파일 목록 조회가 가능하다")
        void 바이어_허용() {
            List<NegotiationFileResponse> files =
                    negotiationService.getFiles(buyer1.getUserId(), request.getNegotiationRequestId());

            assertThat(files).hasSize(1);
            assertThat(files.get(0).fileName()).isEqualTo("도면.png");
            assertThat(files.get(0).uploadedByName()).isEqualTo("바이어일");
        }

        @Test
        @DisplayName("셀러도 파일 목록 조회가 가능하다")
        void 셀러_허용() {
            List<NegotiationFileResponse> files =
                    negotiationService.getFiles(seller1.getUserId(), request.getNegotiationRequestId());

            assertThat(files).hasSize(1);
            assertThat(files.get(0).fileName()).isEqualTo("도면.png");
        }

        @Test
        @DisplayName("당사자가 아니면 조회 불가능")
        void 제3자_거부() {

            assertThatThrownBy(() ->
                    negotiationService.getFiles(outsider.getUserId(), request.getNegotiationRequestId()
                    )
            ).isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                            .isEqualTo(ErrorCode.FORBIDDEN));


        }


    }



}
