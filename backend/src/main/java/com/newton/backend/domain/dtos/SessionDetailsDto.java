package com.newton.backend.domain.dtos;


import com.newton.backend.domain.SessionStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailsDto {
    private UUID id;
    private String name;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String notes;
    private SessionStatusEnum status;
    private List<PlayerSummaryDto> players;
    private UserSummaryDto host;

}
