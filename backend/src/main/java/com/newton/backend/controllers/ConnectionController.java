package com.newton.backend.controllers;

import com.newton.backend.Services.ConnectionService;
import com.newton.backend.domain.dtos.ConnectionDto;
import com.newton.backend.domain.dtos.CreateConnectionRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/connections/request")
    public ResponseEntity<ConnectionDto> sendRequest(
            @Valid @RequestBody CreateConnectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(connectionService.sendRequest(request.getSenderId(), request.getRecipientId()));
    }

    @PatchMapping("/connections/{connectionId}/accept")
    public ResponseEntity<ConnectionDto> acceptRequest(
            @PathVariable UUID connectionId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(connectionService.acceptRequest(connectionId, currentUserId));
    }

    @PatchMapping("/connections/{connectionId}/decline")
    public ResponseEntity<ConnectionDto> declineRequest(
            @PathVariable UUID connectionId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(connectionService.declineRequest(connectionId, currentUserId));
    }

    @PatchMapping("/connections/{connectionId}/cancel")
    public ResponseEntity<ConnectionDto> cancelRequest(
            @PathVariable UUID connectionId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(connectionService.cancelRequest(connectionId, currentUserId));
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<Void> removeConnection(
            @PathVariable UUID connectionId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        connectionService.removeConnection(connectionId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/connections")
    public ResponseEntity<List<ConnectionDto>> getUserConnections(@PathVariable UUID userId) {
        return ResponseEntity.ok(connectionService.getUserConnections(userId));
    }

    @GetMapping("/users/{userId}/connection-requests/pending")
    public ResponseEntity<List<ConnectionDto>> getPendingRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(connectionService.getPendingRequests(userId));
    }
}
