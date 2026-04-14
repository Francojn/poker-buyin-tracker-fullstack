package com.newton.backend.domain;


import jakarta.persistence.*;
import lombok.*;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "sessionplayers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionPlayer {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at", nullable = true)
    private LocalDateTime leftAt;

    @Column(name = "role", nullable = false, columnDefinition = "VARCHAR(50)")
    @Enumerated(EnumType.STRING)
    private SessionPlayerRoleEnum role;

    @Column(name = "total_buy_in", nullable = false)
    private BigDecimal totalBuyIn = BigDecimal.ZERO;;

    @Column(name = "total_cash_out", nullable = false)
    private BigDecimal totalCashOut = BigDecimal.ZERO;;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @OneToMany(mappedBy = "sessionPlayer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BuyIn> buyIns = new ArrayList<>();

    @OneToMany(mappedBy = "sessionPlayer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CashOut> cashOuts = new ArrayList<>();


    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;

        SessionPlayer that = (SessionPlayer) o;
        return Objects.equals(id, that.id) && Objects.equals(joinedAt, that.joinedAt) && Objects.equals(leftAt, that.leftAt) && role == that.role && Objects.equals(totalBuyIn, that.totalBuyIn) && Objects.equals(totalCashOut, that.totalCashOut);
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(id);
        result = 31 * result + Objects.hashCode(joinedAt);
        result = 31 * result + Objects.hashCode(leftAt);
        result = 31 * result + Objects.hashCode(role);
        result = 31 * result + Objects.hashCode(totalBuyIn);
        result = 31 * result + Objects.hashCode(totalCashOut);
        return result;
    }
}
