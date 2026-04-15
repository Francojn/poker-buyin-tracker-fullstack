package com.newton.backend.domain.dtos;


import com.newton.backend.domain.SessionInviteStatusEnum;
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
public class SessionInviteDto {
    private UUID inviteId;

    private UUID sessionId;
    private String sessionName;
    private LocalDateTime sessionStartTime;
    private String sessionLocation;

    private UUID invitedUserId;
    private String invitedUsername;
    private String invitedUserCode;

    private UUID invitedById;
    private String invitedByUsername;
    private String invitedByUserCode;

    private SessionInviteStatusEnum status;

    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

}

