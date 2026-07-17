package kr.remerge.stylehub.seed;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.entity.OrderItem;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.enumtype.OrderType;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

import static kr.remerge.stylehub.seed.SeedUtils.pick;

@Component
@RequiredArgsConstructor
public class OrderSeeder {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final Faker faker = new Faker(new Locale("ko"));

    public void seed(List<User> buyerUsers, List<Product> products, int count) {
        List<OrderStatus> statuses = List.of(
                OrderStatus.CONFIRMED, OrderStatus.PREPARING,
                OrderStatus.SHIPPED, OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
        );

        List<Order> orders = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            User buyer = pick(buyerUsers);
            Product product = pick(products);
            Company sellerCompany = product.getCompany();

            orders.add(Order.builder()
                    .orderNo("ORD-" + String.format("%06d", i))
                    .buyer(buyer)
                    .sellerCompany(sellerCompany)
                    .sellerCompanyName(sellerCompany.getName())
                    .orderType(OrderType.NORMAL)
                    .status(pick(statuses))
                    .subtotalAmount(500000L)
                    .platformFee(15000L)
                    .shippingFee(3000L)
                    .totalAmount(518000L)
                    .receiverName(buyer.getName())
                    .receiverPhone(buyer.getPhone())
                    .receiverAddress(faker.address().fullAddress())
                    .build());
        }

        List<Order> savedOrders = orderRepository.saveAll(orders);
        createOrderItems(savedOrders, products);
    }

    private void createOrderItems(List<Order> orders, List<Product> products) {
        List<OrderItem> toSave = new ArrayList<>();

        for (Order order : orders) {
            int itemCount = ThreadLocalRandom.current().nextInt(1, 4);
            for (int i = 0; i < itemCount; i++) {
                Product product = pick(products);
                int quantity = ThreadLocalRandom.current().nextInt(1, 20);
                long unitPrice = product.getUnitPrice();

                toSave.add(OrderItem.builder()
                        .order(order)
                        .product(product)
                        .assignedUser(product.getSeller())
                        .productName(product.getProductName())
                        .optionSummary("컬러: " + faker.color().name())
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .totalPrice(unitPrice * quantity)
                        .build());
            }
        }
        orderItemRepository.saveAll(toSave);
    }
}
