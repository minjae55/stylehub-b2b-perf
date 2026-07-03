package kr.remerge.stylehub.domain.order.entity;

import jakarta.persistence.*;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogMemo;
import kr.remerge.stylehub.domain.order.enumtype.OrderLogType;
import kr.remerge.stylehub.domain.order.enumtype.OrderProcessStep;
import kr.remerge.stylehub.domain.order.enumtype.OrderStatus;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.global.entity.BaseEntity;
import lombok.*;

@Entity
@Table(
        name = "order_logs",
        indexes = {
                @Index(name = "idx_order_logs_order_id", columnList = "order_id"),
                @Index(name = "idx_order_logs_order_created", columnList = "order_id, created_at"),
                @Index(name = "idx_order_logs_log_type_created", columnList = "log_type, created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_log_id")
    private Integer orderLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_type", nullable = false, length = 30)
    private OrderLogType logType;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    private OrderStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status")
    private OrderStatus newStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_step")
    private OrderProcessStep processStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actorUser;

    @Column(columnDefinition = "TEXT")
    private String memo;

    public static OrderLog createStatusLog(
            Order order,
            OrderStatus previousStatus,
            OrderStatus newStatus,
            User actor,
            OrderLogMemo memo
    ) {
        return OrderLog.builder()
                .order(order)
                .logType(OrderLogType.STATUS)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .actorUser(actor)
                .memo(memo.getMessage())
                .build();
    }
}