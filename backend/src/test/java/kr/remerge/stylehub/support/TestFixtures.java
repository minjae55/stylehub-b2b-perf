package kr.remerge.stylehub.support;

import jakarta.persistence.EntityManager;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;

import java.time.LocalDateTime;

public class TestFixtures {

    private final EntityManager em;

    public TestFixtures(EntityManager em) {
        this.em = em;
    }

    public Company createCompany(String name, String businessNumber) {
        Company company = Company.builder()
                .name(name)
                .businessNumber(businessNumber)
                .createdAt(LocalDateTime.now())
                .build();
        em.persist(company);
        return company;
    }

    public User createUser(String email, String name, Company company, BusinessRole businessRole) {
        return createUser(email, name, company, UserRole.PRESIDENT, businessRole);
    }

    public User createUser(String email, String name, Company company, UserRole role, BusinessRole businessRole) {
        User user = User.builder()
                .email(email)
                .name(name)
                .company(company)
                .role(role)
                .businessRole(businessRole)
                .build();
        em.persist(user);
        return user;
    }

    public Quote createQuote(User buyer, User seller, String quoteNo, String productName) {
        SourcingRequest sourcing = SourcingRequest.builder()
                .sourcingNo("SRC-" + quoteNo)
                .buyer(buyer)
                .buyerCompanyId(buyer.getCompany().getCompanyId())
                .type("CUSTOM")
                .status(SourcingStatus.QUOTED)
                .productName(productName)
                .needSample("N")
                .build();
        em.persist(sourcing);

        LocalDateTime now = LocalDateTime.now();
        Quote quote = Quote.builder()
                .quoteNo(quoteNo)
                .sourcingRequest(sourcing)
                .buyer(buyer)
                .seller(seller)
                .company(seller.getCompany())
                .productName(productName)
                .leadTimeDays(14)
                .validUntil(now.plusDays(30))
                .createdAt(now)
                .submittedAt(now)
                .build();
        em.persist(quote);
        return quote;
    }
}