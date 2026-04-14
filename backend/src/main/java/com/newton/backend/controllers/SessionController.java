package com.newton.backend.controllers;


import com.newton.backend.Services.SessionService;
import com.newton.backend.domain.Session;
import com.newton.backend.domain.dtos.*;
import com.newton.backend.mappers.SessionMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping(path = "/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionDetailsDto> createSession(
            @Valid @RequestBody CreateSessionRequest createSessionRequest,
            HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionDetailsDto session = sessionService.createSession(createSessionRequest, currentUserId);
        return ResponseEntity.ok(session);
    }

    @GetMapping
    public ResponseEntity<List<SessionDetailsDto>> getAllSessions(HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        List<SessionDetailsDto> sessions = sessionService.listSessions(currentUserId);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{id}")
    public ResponseEntity <SessionDetailsDto> getSessionById(@PathVariable UUID id,
                                                             HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionDetailsDto session = sessionService.getSessionById(id, currentUserId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/players")
    public ResponseEntity<SessionDetailsDto> addPlayer(
            @PathVariable UUID id,
            @Valid @RequestBody AddPlayersToSessionRequest addPlayersToSessionRequest,
            HttpServletRequest request){
        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionDetailsDto updatedSession = sessionService.addPlayerToSession(
                id, addPlayersToSessionRequest, currentUserId);
        return ResponseEntity.ok(updatedSession);
    }

    @PostMapping("/{id}/invites")
    public ResponseEntity<SessionDetailsDto> invitePlayer(
            @PathVariable UUID id,
            @Valid @RequestBody SessionInviteRequest sessionInviteRequest,
            HttpServletRequest request){
        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionDetailsDto updatedSession = sessionService.invitePlayerToSession(
                id, sessionInviteRequest,  currentUserId);
        return ResponseEntity.ok(updatedSession);
    }

    @DeleteMapping("/{sessionId}/players/{userId}")
    public ResponseEntity<Void> removePlayer(
            @PathVariable UUID sessionId,
            @PathVariable DeletePlayerFromSessionRequest userId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        sessionService.removePlayerFromSession(sessionId, userId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID sessionId,
            HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        sessionService.deleteSession(sessionId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<SessionDetailsDto> completeSession(
            @PathVariable UUID sessionId,
            HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionDetailsDto completedSession = sessionService.completeSession(sessionId, currentUserId);
        return ResponseEntity.ok(completedSession);
    }

}
