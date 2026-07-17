package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import static kr.remerge.stylehub.seed.SeedUtils.pick;

@Component
@RequiredArgsConstructor
public class CartSeeder {

    private final CartRepository cartRepository;

    public void seed(List<User> buyerUsers, List<ProductOption> options) {
        List<CartItem> toSave = new ArrayList<>();

        for (User buyer : buyerUsers) {
            Set<Integer> usedOptionIds = new HashSet<>();
            int added = 0;
            int attempts = 0;

            while (added < 2 && attempts < 20) {
                attempts++;
                ProductOption option = pick(options);
                int moq = option.getProduct().getMoq();

                if (option.getStockQuantity() < moq) {
                    continue;
                }
                if (!usedOptionIds.add(option.getProductOptionId())) {
                    continue;
                }

                int maxQuantity = Math.min(option.getStockQuantity(), moq + 50);
                int quantity = ThreadLocalRandom.current().nextInt(moq, maxQuantity + 1);

                toSave.add(new CartItem(buyer, option, quantity, CartType.NORMAL));
                added++;
            }
        }
        cartRepository.saveAll(toSave);
    }
}
