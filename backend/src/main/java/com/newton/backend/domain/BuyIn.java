package com.newton.backend.domain;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "buy_ins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyIn {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createdAt;

    // JPA will automatically map them to for example responded_at
    private LocalDateTime respondedAt;
    private LocalDateTime paidAt;
    private LocalDateTime cancelledAt;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private BuyInStatusEnum status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_player_id")
    private SessionPlayer sessionPlayer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;

        BuyIn buyIn = (BuyIn) o;
        return Objects.equals(id, buyIn.id) && Objects.equals(amount, buyIn.amount) && Objects.equals(createdAt, buyIn.createdAt) && Objects.equals(respondedAt, buyIn.respondedAt) && Objects.equals(paidAt, buyIn.paidAt) && Objects.equals(cancelledAt, buyIn.cancelledAt) && Objects.equals(note, buyIn.note) && status == buyIn.status;
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(id);
        result = 31 * result + Objects.hashCode(amount);
        result = 31 * result + Objects.hashCode(createdAt);
        result = 31 * result + Objects.hashCode(respondedAt);
        result = 31 * result + Objects.hashCode(paidAt);
        result = 31 * result + Objects.hashCode(cancelledAt);
        result = 31 * result + Objects.hashCode(note);
        result = 31 * result + Objects.hashCode(status);
        return result;
    }
}
