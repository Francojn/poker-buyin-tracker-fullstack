package com.newton.backend.Services;

import com.newton.backend.domain.dtos.*;

import java.util.List;
import java.util.UUID;

public interface SessionService {
    List<SessionDetailsDto> listSessions(UUID currentUserId);
    SessionDetailsDto createSession(CreateSessionRequest request, UUID currentUserId);
    SessionDetailsDto getSessionById(UUID sessionId, UUID currentUserId);
    SessionDetailsDto addPlayerToSession(UUID sessionId, AddPlayersToSessionRequest request, UUID currentUserId);
    void removePlayerFromSession(UUID sessionId, DeletePlayerFromSessionRequest request, UUID currentUserId);
    SessionDetailsDto invitePlayerToSession(UUID sessionId, SessionInviteRequest request, UUID currentUserId);
    SessionDetailsDto completeSession(UUID sessionId, UUID currentUserId);
    void deleteSession(UUID sessionId, UUID currentUserId);
}
