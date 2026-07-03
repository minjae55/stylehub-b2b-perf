package kr.remerge.stylehub.domain.settlement.dto;
import kr.remerge.stylehub.domain.settlement.entity.Settlement;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class SettlementDashboard {
    private Summary summary;
    private List<RecentPayment> rows;
    private UserStats userStats;
    private List<MonthlyStat> paymentStats;

    @Getter
    @Setter
    public static class Summary {
        private long totalGMV;
        private long totalFee;
        private long pendingAmount;
        private long refundRequestAmount;
    }

    @Getter
    @Setter
    public static class MonthlyStat {
        private String month;
        private long total;
        private long count;
        private long avgOrder;
    }

    @Getter
    @Setter
    public static class UserStats {
        private BuyerStats buyers;
        private SellerStats sellers;

        @Getter
        @Setter
        public static class BuyerStats {
            private long total;
            private long thisMonth;
            private long active;
            private long growth;
        }

        @Getter
        @Setter
        public static class SellerStats {
            private long total;
            private long thisMonth;
            private long verified;
            private long growth;
        }
    }
    @Getter
    @Setter
    public static class RecentPayment {
        private Integer settlementId;   // orderId 사용
        private String orderNo;
        private String createdAt;
        private Integer buyerId;
        private Integer sellerId;       // sellerCompany의 PK
        private String sellerCompanyName;
        private Long totalAmount;
        private Long platformFee;
        private Long finalAmount;
        private String status;
    }

}
