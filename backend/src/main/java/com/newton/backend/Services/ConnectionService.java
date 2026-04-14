package com.newton.backend.Services;

import com.newton.backend.domain.dtos.ConnectionDto;

import java.util.List;
import java.util.UUID;

public interface ConnectionService {
    ConnectionDto sendRequest(UUID actingUserId, UUID recipientId);
    ConnectionDto acceptRequest(UUID connectionId, UUID actingUserId);
    ConnectionDto declineRequest(UUID connectionId, UUID actingUserId);
    ConnectionDto cancelRequest(UUID connectionId, UUID actingUserId);
    void removeConnection(UUID connectionId, UUID actingUserId);
    List<ConnectionDto> getUserConnections(UUID userId);
    List<ConnectionDto> getPendingRequests(UUID userId);
}