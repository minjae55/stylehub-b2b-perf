package kr.remerge.stylehub.domain.quote.dto;

import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuoteInitResponse {

    private String sourcingNo;
    private String productName;
    private String brandName;
    private String material;
    private String needSample;   // "Y" / "N"

    private List<QuoteInitItemResponse> items;

    @Getter
    @Builder
    public static class QuoteInitItemResponse {
        private String optionSummary;
        private Integer quantity;
        private Integer sampleQuantity;
    }

    public static QuoteInitResponse from(SourcingRequest request, List<SourcingRequestItem> items) {
        return QuoteInitResponse.builder()
                .sourcingNo(request.getSourcingNo())
                .productName(request.getProductName())
                .brandName(request.getBrandName())
                .material(request.getMainMaterial())
                .needSample(request.getNeedSample())
                .items(items.stream()
                        .map(item -> QuoteInitItemResponse.builder()
                                .optionSummary(item.getOptionSummary())
                                .quantity(item.getQuantity())
                                .sampleQuantity(item.getSampleQuantity())
                                .build())
                        .toList())
                .build();
    }
}
