package com.newton.backend.domain.dtos;

import com.newton.backend.domain.PaymentMethodEnum;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class CreateCashOutRequest {
    @NotNull
    private UUID sessionPlayerId;
    @NotNull @DecimalMin(value = "0.00")
    private BigDecimal amount;
    private PaymentMethodEnum paymentMethod;
}
