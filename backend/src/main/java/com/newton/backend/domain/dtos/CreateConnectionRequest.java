package com.newton.backend.domain.dtos;

import com.newton.backend.domain.ConnectionStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateConnectionRequest {
    @NotNull
    private UUID senderId;
    @NotNull
    private UUID recipientId;
}
