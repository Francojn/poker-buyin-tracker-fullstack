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
public class ConnectionDto {
    private UUID id;
    private UUID senderId;
    private String senderUsername;
    private UUID recipientId;
    private String recipientUsername;
    private ConnectionStatusEnum status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
