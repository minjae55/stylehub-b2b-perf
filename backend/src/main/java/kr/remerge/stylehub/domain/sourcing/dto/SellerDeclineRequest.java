package kr.remerge.stylehub.domain.sourcing.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SellerDeclineRequest {
    private String feedback; // 거절 사유
}
