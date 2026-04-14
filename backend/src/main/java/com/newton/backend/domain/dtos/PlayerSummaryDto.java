package com.newton.backend.domain.dtos;

import com.newton.backend.domain.SessionPlayerRoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSummaryDto {
    private UUID sessionPlayerId;
    private UUID userId;
    private String username;
    private SessionPlayerRoleEnum role;
    private BigDecimal totalBuyIn;
    private BigDecimal totalCashOut;
}
