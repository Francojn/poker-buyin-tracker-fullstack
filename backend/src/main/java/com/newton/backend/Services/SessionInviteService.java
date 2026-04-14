package com.newton.backend.Services;

import com.newton.backend.domain.dtos.SessionInviteDto;


import java.util.UUID;

public interface SessionInviteService {
    SessionInviteDto acceptInvite(UUID inviteId, UUID currentUserId);
    SessionInviteDto denyInvite(UUID inviteId, UUID currentUserId);
}
