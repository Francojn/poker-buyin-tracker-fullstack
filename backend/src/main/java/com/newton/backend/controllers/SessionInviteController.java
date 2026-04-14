package com.newton.backend.controllers;

import com.newton.backend.Services.SessionInviteService;
import com.newton.backend.domain.dtos.SessionInviteDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(path = "/api/v1/session_invites")
@RequiredArgsConstructor
public class SessionInviteController {

    private final SessionInviteService sessionInviteService;

    @PatchMapping("/{inviteId}/accept")
    public ResponseEntity<SessionInviteDto> acceptInvite(
            @PathVariable UUID inviteId,
            HttpServletRequest request) {

        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionInviteDto invite = sessionInviteService.acceptInvite(inviteId, currentUserId);
        return ResponseEntity.ok(invite);
    }

    @PatchMapping("/{inviteId}/deny")
    public ResponseEntity<SessionInviteDto> denyInvite(
            @PathVariable UUID inviteId,
            HttpServletRequest request) {

        UUID currentUserId = (UUID) request.getAttribute("userId");
        SessionInviteDto invite = sessionInviteService.denyInvite(inviteId, currentUserId);
        return ResponseEntity.ok(invite);
    }
}
