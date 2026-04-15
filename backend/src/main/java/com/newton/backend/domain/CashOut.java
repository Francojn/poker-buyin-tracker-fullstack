package com.newton.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "cash_outs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashOut {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "cash_amount")
    private BigDecimal cashAmount;

    @Column(name = "card_amount")
    private BigDecimal cardAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_out_at")
    private LocalDateTime paidOutAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CashOutStatusEnum status;

    @Column(name = "payment_method")
    @Enumerated(EnumType.STRING)
    private PaymentMethodEnum paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_player_id", nullable = false)
    private SessionPlayer sessionPlayer;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;

        CashOut cashOut = (CashOut) o;
        return Objects.equals(id, cashOut.id) && Objects.equals(amount, cashOut.amount) && Objects.equals(createdAt, cashOut.createdAt) && Objects.equals(paidOutAt, cashOut.paidOutAt) && Objects.equals(cancelledAt, cashOut.cancelledAt) && status == cashOut.status;
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(id);
        result = 31 * result + Objects.hashCode(amount);
        result = 31 * result + Objects.hashCode(createdAt);
        result = 31 * result + Objects.hashCode(paidOutAt);
        result = 31 * result + Objects.hashCode(cancelledAt);
        result = 31 * result + Objects.hashCode(status);
        return result;
    }
}