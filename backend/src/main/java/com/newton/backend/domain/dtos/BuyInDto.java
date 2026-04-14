package com.newton.backend.domain.dtos;

import com.newton.backend.domain.BuyIn;
import com.newton.backend.domain.BuyInStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuyInDto {
    private UUID id;
    private UUID sessionId;
    private UUID sessionPlayerId;
    private UUID userId;
    private String username;
    private BigDecimal amount;
    private BuyInStatusEnum status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime paidAt;
    private String note;
}
