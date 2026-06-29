package kr.remerge.stylehub.domain.cart.dto;

import kr.remerge.stylehub.domain.cart.entity.CartItem;
import kr.remerge.stylehub.domain.cart.enumtype.CartType;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.entity.ProductOption;

import java.util.List;

public record CartResponse(

        Integer cartItemId,

        Integer productId,
        Integer productOptionId,
        Integer companyId,

        String productName,
        String optionLabel,
        List<CartOptionResponse> options,

        Long unitPrice,
        Integer moq,
        Integer quantity,
        Integer stockQuantity,
        Long totalPrice,

        Long baseShippingFee,
        Long freeShippingThreshold,

        Boolean sampleAvailable,
        Long samplePrice,
        Integer sampleMaxQuantity,
        Boolean isChecked,
        CartType cartType
) {

    public static CartResponse from(CartItem cartItem) {
        ProductOption productOption = cartItem.getProductOption();
        Product product = productOption.getProduct();
        Company company = product.getCompany();

        List<CartOptionResponse> options = getCartOptionResponses(productOption);

        Long unitPrice = cartItem.getCartType() == CartType.SAMPLE
                ? productOption.getSamplePrice()
                : product.getUnitPrice() + productOption.getAdditionalPrice();

        Long totalPrice = unitPrice * cartItem.getQuantity();

        return new CartResponse(
                cartItem.getCartItemId(),
                product.getProductId(),
                productOption.getProductOptionId(),
                company.getCompanyId(),

                product.getProductName(),
                productOption.getOptionLabel(),
                options,

                unitPrice,
                product.getMoq(),
                cartItem.getQuantity(),
                productOption.getStockQuantity(),
                totalPrice,

                company.getBaseShippingFee(),
                company.getFreeShippingThreshold(),

                product.getSampleAvailable(),
                productOption.getSamplePrice(),
                productOption.getSampleMaxQuantity(),
                cartItem.getIsChecked(),
                cartItem.getCartType()
        );
    }

    private static List<CartOptionResponse> getCartOptionResponses(ProductOption productOption) {

        return productOption.getOptionValues()
                .stream()
                .map(value -> new CartOptionResponse(
                        value.getOptionName(),
                        value.getOptionValue()
                ))
                .toList();
    }
}
