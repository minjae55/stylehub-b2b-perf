package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.enumtype.BusinessRole;
import kr.remerge.stylehub.domain.user.enumtype.UserRole;
import kr.remerge.stylehub.domain.user.enumtype.UserStatus;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker(new Locale("ko"));

    public record Users(List<User> buyers, List<User> sellers) {
    }

    public Users seed(List<Company> companies) {
        String encodedPassword = passwordEncoder.encode("Password1234!");
        List<User> toSave = new ArrayList<>();
        int emailSeq = 0;

        for (Company company : companies) {
            for (int i = 0; i < 3; i++) {
                BusinessRole businessRole = ThreadLocalRandom.current().nextBoolean()
                        ? BusinessRole.BUYER : BusinessRole.SELLER;

                toSave.add(User.builder()
                        .company(company)
                        .email("user" + (emailSeq++) + "@stylehub-test.com")
                        .password(encodedPassword)
                        .name(faker.name().fullName())
                        .phone(faker.phoneNumber().phoneNumber())
                        .role(i == 0 ? UserRole.PRESIDENT : UserRole.EMPLOYEE)
                        .businessRole(businessRole)
                        .status(UserStatus.APPROVED)
                        .build());
            }
        }

        List<User> saved = userRepository.saveAll(toSave);
        List<User> buyers = new ArrayList<>();
        List<User> sellers = new ArrayList<>();
        for (User user : saved) {
            if (user.getBusinessRole() == BusinessRole.BUYER) {
                buyers.add(user);
            } else {
                sellers.add(user);
            }
        }
        return new Users(buyers, sellers);
    }
}
