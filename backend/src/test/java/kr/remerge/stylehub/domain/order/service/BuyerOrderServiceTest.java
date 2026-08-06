package kr.remerge.stylehub.domain.order.service;

import kr.remerge.stylehub.domain.address.Address;
import kr.remerge.stylehub.domain.address.AddressRepository;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.order.dto.OrderCreateRequest;
import kr.remerge.stylehub.domain.order.dto.OrderCreateResponse;
import kr.remerge.stylehub.domain.order.entity.Order;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.order.pdf.OrderPdfGenerator;
import kr.remerge.stylehub.domain.order.repository.OrderItemRepository;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.order.validation.CartOrderValidator;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.product.repository.ProductOptionRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuyerOrderServiceTest {

    @Mock
    private UserReader userReader;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private AddressRepository addressRepository;
    @Mock
    private OrderLogRepository orderLogRepository;
    @Mock
    private CartOrderValidator cartOrderValidator;
    @Mock
    private OrderPdfGenerator orderPdfGenerator;
    @Mock
    private ProductOptionRepository productOptionRepository;

    @InjectMocks
    private BuyerOrderService buyerOrderService;

    private User buyer;
    private Company sellerCompany;
    private Product product;
    private ProductOption productOption;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        buyer = mock(User.class);
        Company buyerCompany = mock(Company.class);
        lenient().when(buyerCompany.getCompanyId()).thenReturn(999);
        lenient().when(buyer.getCompany()).thenReturn(buyerCompany);

        sellerCompany = mock(Company.class);
        lenient().when(sellerCompany.getCompanyId()).thenReturn(1);
        lenient().when(sellerCompany.getName()).thenReturn("셀러회사");
        lenient().when(sellerCompany.getBaseShippingFee()).thenReturn(3000L);
        lenient().when(sellerCompany.getFreeShippingThreshold()).thenReturn(null);

        product = mock(Product.class);
        lenient().when(product.getCompany()).thenReturn(sellerCompany);
        lenient().when(product.getUnitPrice()).thenReturn(10000L);
        lenient().when(product.getProductName()).thenReturn("테스트 상품");

        productOption = mock(ProductOption.class);
        lenient().when(productOption.getProductOptionId()).thenReturn(100);
        lenient().when(productOption.getProduct()).thenReturn(product);
        lenient().when(productOption.getAdditionalPrice()).thenReturn(0L);
        lenient().when(productOption.getOptionLabel()).thenReturn("블랙 / M");
        lenient().when(productOption.getImages()).thenReturn(List.of());

        cartItem = mock(CartItem.class);
        lenient().when(cartItem.getProductOption()).thenReturn(productOption);
        lenient().when(cartItem.getQuantity()).thenReturn(2);
        lenient().when(cartItem.getCartType()).thenReturn(CartType.NORMAL);
    }

    // ===== confirmOrder =====

    @Test
    void confirmOrder_배송완료상태에서_확정하면_주문이완료처리된다() {
        // given
        Order order = mock(Order.class);
        given(order.getStatus()).willReturn(OrderStatus.DELIVERED);
        given(orderRepository.findByOrderIdAndBuyer_UserId(1, 10))
                .willReturn(Optional.of(order));
        given(userReader.getUser(10)).willReturn(buyer);

        // when
        buyerOrderService.confirmOrder(10, 1);

        // then
        verify(order).agree();
        verify(orderLogRepository).save(any());
    }

    @Test
    void confirmOrder_주문이존재하지않으면_ORDER_NOT_FOUND_예외발생() {
        // given
        given(orderRepository.findByOrderIdAndBuyer_UserId(1, 10))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> buyerOrderService.confirmOrder(10, 1))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ORDER_NOT_FOUND);
    }

    @Test
    void confirmOrder_배송완료상태가아니면_INVALID_ORDER_STATUS_예외발생() {
        // given
        Order order = mock(Order.class);
        given(order.getStatus()).willReturn(OrderStatus.PENDING);
        given(orderRepository.findByOrderIdAndBuyer_UserId(1, 10))
                .willReturn(Optional.of(order));

        // when & then
        assertThatThrownBy(() -> buyerOrderService.confirmOrder(10, 1))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER_STATUS);

        verify(order, never()).agree();
    }

    // ===== createOrder =====

    @Test
    void createOrder_재고가충분하면_정상적으로주문이생성된다() {
        // given
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1), 99, CartType.NORMAL
        );
        Address address = mock(Address.class);
        lenient().when(address.getZipcode()).thenReturn("12345");

        given(userReader.getCompanyUser(10)).willReturn(buyer);
        given(cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                List.of(1), 10, CartType.NORMAL))
                .willReturn(List.of(cartItem));
        given(productOptionRepository.decreaseStock(100, 2)).willReturn(1);
        given(addressRepository.findActiveCompanyAddress(any(), any()))
                .willReturn(Optional.of(address));
        given(orderRepository.save(any(Order.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        // when
        OrderCreateResponse response = buyerOrderService.createOrder(10, request);

        // then
        assertThat(response.orderNos()).hasSize(1);
        verify(cartRepository).deleteAll(List.of(cartItem));
    }

    @Test
    void createOrder_여러판매자상품이섞여있으면_판매자별로주문이분리생성된다() {
        // given: 카트에 서로 다른 판매자(회사)의 상품이 섞여 있는 상황
        Company otherCompany = mock(Company.class);
        lenient().when(otherCompany.getCompanyId()).thenReturn(2);
        lenient().when(otherCompany.getName()).thenReturn("다른셀러회사");
        lenient().when(otherCompany.getBaseShippingFee()).thenReturn(2500L);
        lenient().when(otherCompany.getFreeShippingThreshold()).thenReturn(null);

        Product otherProduct = mock(Product.class);
        lenient().when(otherProduct.getCompany()).thenReturn(otherCompany);
        lenient().when(otherProduct.getUnitPrice()).thenReturn(20000L);
        lenient().when(otherProduct.getProductName()).thenReturn("다른 상품");

        ProductOption otherOption = mock(ProductOption.class);
        lenient().when(otherOption.getProductOptionId()).thenReturn(200);
        lenient().when(otherOption.getProduct()).thenReturn(otherProduct);
        lenient().when(otherOption.getAdditionalPrice()).thenReturn(0L);
        lenient().when(otherOption.getOptionLabel()).thenReturn("화이트 / L");
        lenient().when(otherOption.getImages()).thenReturn(List.of());

        CartItem otherCartItem = mock(CartItem.class);
        lenient().when(otherCartItem.getProductOption()).thenReturn(otherOption);
        lenient().when(otherCartItem.getQuantity()).thenReturn(1);
        lenient().when(otherCartItem.getCartType()).thenReturn(CartType.NORMAL);

        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1, 2), 99, CartType.NORMAL
        );
        Address address = mock(Address.class);
        lenient().when(address.getZipcode()).thenReturn("12345");

        given(userReader.getCompanyUser(10)).willReturn(buyer);
        given(cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                List.of(1, 2), 10, CartType.NORMAL))
                .willReturn(List.of(cartItem, otherCartItem));
        given(productOptionRepository.decreaseStock(100, 2)).willReturn(1);
        given(productOptionRepository.decreaseStock(200, 1)).willReturn(1);
        given(addressRepository.findActiveCompanyAddress(any(), any()))
                .willReturn(Optional.of(address));
        given(orderRepository.save(any(Order.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        // when
        OrderCreateResponse response = buyerOrderService.createOrder(10, request);

        // then: 판매자(회사)가 2곳이므로 주문도 2건으로 분리 생성돼야 한다
        assertThat(response.orderNos()).hasSize(2);
        verify(orderRepository, times(2)).save(any(Order.class));
    }

    @Test
    void createOrder_장바구니아이템이비어있으면_CART_ITEM_EMPTY_예외발생() {
        // given
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(), 99, CartType.NORMAL
        );
        given(userReader.getCompanyUser(10)).willReturn(buyer);

        // when & then
        assertThatThrownBy(() -> buyerOrderService.createOrder(10, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CART_ITEM_EMPTY);
    }

    @Test
    void createOrder_cartType이없으면_INVALID_CART_TYPE_예외발생() {
        // given
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1), 99, null
        );
        given(userReader.getCompanyUser(10)).willReturn(buyer);

        // when & then
        assertThatThrownBy(() -> buyerOrderService.createOrder(10, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_CART_TYPE);
    }

    @Test
    void createOrder_요청한장바구니아이템일부를찾을수없으면_CART_ITEM_NOT_FOUND_예외발생() {
        // given
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1, 2), 99, CartType.NORMAL
        );
        given(userReader.getCompanyUser(10)).willReturn(buyer);
        given(cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                List.of(1, 2), 10, CartType.NORMAL))
                .willReturn(List.of(cartItem)); // 1개만 조회됨 (요청은 2개)

        // when & then
        assertThatThrownBy(() -> buyerOrderService.createOrder(10, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    @Test
    void createOrder_재고가부족하면_OUT_OF_STOCK_예외발생하고_주문이생성되지않는다() {
        // given: 오버셀 버그 수정의 핵심 - decreaseStock이 0을 반환(재고 부족)하면 주문 자체를 막아야 한다
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1), 99, CartType.NORMAL
        );
        given(userReader.getCompanyUser(10)).willReturn(buyer);
        given(cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                List.of(1), 10, CartType.NORMAL))
                .willReturn(List.of(cartItem));
        given(productOptionRepository.decreaseStock(100, 2)).willReturn(0);

        // when & then
        assertThatThrownBy(() -> buyerOrderService.createOrder(10, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OUT_OF_STOCK);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_배송지를찾을수없으면_ADDRESS_NOT_FOUND_예외발생() {
        // given
        OrderCreateRequest request = new OrderCreateRequest(
                List.of(1), 99, CartType.NORMAL
        );
        given(userReader.getCompanyUser(10)).willReturn(buyer);
        given(cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                List.of(1), 10, CartType.NORMAL))
                .willReturn(List.of(cartItem));
        given(productOptionRepository.decreaseStock(100, 2)).willReturn(1);
        given(addressRepository.findActiveCompanyAddress(any(), any()))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> buyerOrderService.createOrder(10, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ADDRESS_NOT_FOUND);
    }
}
