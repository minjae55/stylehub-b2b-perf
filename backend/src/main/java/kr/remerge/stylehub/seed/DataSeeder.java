package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final FoundationSeeder foundationSeeder;
    private final UserSeeder userSeeder;
    private final ProductSeeder productSeeder;
    private final TradeSeeder tradeSeeder;
    private final OrderSeeder orderSeeder;
    private final CartSeeder cartSeeder;

    @Override
    public void run(String... args) {
        if (companyRepository.count() > 0) {
            System.out.println("[DataSeeder] 이미 데이터가 있어 건너뜁니다.");
            return;
        }

        FoundationSeeder.Foundation foundation = foundationSeeder.seed();
        UserSeeder.Users users = userSeeder.seed(foundation.companies());
        ProductSeeder.Products products = productSeeder.seed(
                users.sellers(), foundation.brands(), foundation.categories(), 10000);

        tradeSeeder.seed(users.buyers(), users.sellers(), foundation.categories(), products.products());
        orderSeeder.seed(users.buyers(), products.products(), 20000);
        cartSeeder.seed(users.buyers(), products.options());
    }
}
