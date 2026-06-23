package kr.remerge.stylehub.domain.order.checkout.service;

import kr.remerge.stylehub.domain.cart.dto.CartResponse;
import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.cart.repository.CartRepository;
import kr.remerge.stylehub.domain.company.entity.Address;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.AddressRepository;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressCreateRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.AddressResponse;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutRequest;
import kr.remerge.stylehub.domain.order.checkout.dto.CheckoutResponse;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;

    public CheckoutResponse getCheckout(Integer userId, CheckoutRequest checkoutRequest) {

        List<Integer> cartItemIds = checkoutRequest.cartItemIds().stream()
                .distinct()
                .toList();

        List<CartItem> cartItems = cartRepository.findByCartItemIdInAndUser_UserIdAndCartType(
                cartItemIds,
                userId,
                checkoutRequest.cartType()
        );

        if (cartItems.size() != cartItemIds.size()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        for (CartItem cartItem : cartItems) {
            validateCartItem(cartItem);
        }

        List<CartResponse> items = cartItems.stream()
                .map(CartResponse::from)
                .toList();

        long productAmount = items.stream()
                .mapToLong(CartResponse::totalPrice)
                .sum();

        long shippingFee = calculateShippingFee(items);


        return new CheckoutResponse(
                checkoutRequest.cartType(),
                items,
                productAmount,
                shippingFee,
                productAmount + shippingFee
        );

    }

    private void validateCartItem(CartItem cartItem) {

        ProductOption option = cartItem.getProductOption();
        Product product = option.getProduct();

        int quantity = cartItem.getQuantity();

        if (!option.getIsActive()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (quantity > option.getStockQuantity()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }

        if (cartItem.getCartType() == CartType.NORMAL
                && quantity < product.getMoq()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (cartItem.getCartType() == CartType.SAMPLE) {
            if (!product.getSampleAvailable()) {
                throw new BusinessException(ErrorCode.SAMPLE_OPTION_NOT_CONFIGURED);
            }

            if (option.getSamplePrice() == null
                    || option.getSampleMaxQuantity() == null) {
                throw new BusinessException(ErrorCode.SAMPLE_OPTION_NOT_CONFIGURED);
            }

            if (quantity > option.getSampleMaxQuantity()) {
                throw new BusinessException(ErrorCode.SAMPLE_OPTION_NOT_CONFIGURED);
            }
        }
    }

    private long calculateShippingFee(List<CartResponse> items) {

        Map<Integer, List<CartResponse>> itemsByCompany = items.stream()
                .collect(groupingBy(CartResponse::companyId));

        long totalShippingFee = 0L;

        for (List<CartResponse> companyItems : itemsByCompany.values()) {
            CartResponse firstItem = companyItems.get(0);
            long companyProductAmount = companyItems.stream()
                    .mapToLong(CartResponse::totalPrice)
                    .sum();

            Long freeShippingThreshold = firstItem.freeShippingThreshold();

            boolean isFreeShipping = freeShippingThreshold != null
                    && companyProductAmount >= freeShippingThreshold;

            if (!isFreeShipping) {
                totalShippingFee += firstItem.baseShippingFee();
            }
        }

        return totalShippingFee;
    }

    public List<AddressResponse> getAddress(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Integer companyId = user.getCompany().getCompanyId();

        Integer defaultAddressId = user.getDefaultReceivingAddress() == null
                ? null
                : user.getDefaultReceivingAddress().getAddressId();

        return addressRepository
                .findByCompany_CompanyIdAndDeletedAtIsNull(companyId)
                .stream()
                .map(address -> AddressResponse.from(
                        address,
                        address.getAddressId().equals(defaultAddressId)
                ))
                .toList();
    }

    @Transactional
    public AddressResponse createAddress(Integer userId, AddressCreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Company company = user.getCompany();

        if (company == null) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
        }

        Address address = Address.builder()
                .company(company)
                .addressName(request.addressName())
                .zipcode(request.zipcode())
                .address(request.address())
                .addressDetail(request.addressDetail())
                .build();

        Address savedAddress = addressRepository.save(address);

        boolean isDefault = user.getDefaultReceivingAddress() == null;

        if (isDefault) {
            user.updateDefaultReceivingAddress(savedAddress);
        }

        return AddressResponse.from(savedAddress, isDefault);
    }
}
