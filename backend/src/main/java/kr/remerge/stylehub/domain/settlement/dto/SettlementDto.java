package kr.remerge.stylehub.domain.settlement.dto;


@Data
@getter
@setter
public class SettlementDto {
    private int settlement_id;

    private int seller_id;
    private int buyer_id;
    private int admin_id;
    private String order_no;

    private int total_amount;
    private int platform_fee;
    private int final_amount;
    private String status;

    private date settled_at;
    private date created_at;
}
