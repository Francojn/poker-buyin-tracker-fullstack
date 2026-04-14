package com.newton.backend.controllers;


import com.newton.backend.Services.CashOutService;
import com.newton.backend.domain.dtos.CashOutDto;
import com.newton.backend.domain.dtos.CreateCashOutRequest;
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
public class CashOutController {

    private final CashOutService cashOutService;

    @PostMapping("/sessions/{sessionId}/cashouts")
    public ResponseEntity<CashOutDto> createCashOut(
            @PathVariable UUID sessionId,
            HttpServletRequest request,
            @Valid @RequestBody CreateCashOutRequest createCashOutRequest
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cashOutService.createCashOut(sessionId, createCashOutRequest, currentUserId));
    }

    @GetMapping("/sessions/{sessionId}/cashouts")
    public ResponseEntity<List<CashOutDto>> getCashOutsForSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cashOutService.getCashOutsForSession(sessionId));
    }

    @GetMapping("/cashouts/{cashOutId}")
    public ResponseEntity<CashOutDto> getCashOutById(@PathVariable UUID cashOutId) {
        return ResponseEntity.ok(cashOutService.getCashOutById(cashOutId));
    }

    @PatchMapping("/cashouts/{cashOutId}/mark-paid-out")
    public ResponseEntity<CashOutDto> markCashOutPaidOut(
            @PathVariable UUID cashOutId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(cashOutService.markCashOutPaidOut(cashOutId, currentUserId));
    }

    @PatchMapping("/cashouts/{cashOutId}/cancel")
    public ResponseEntity<CashOutDto> cancelCashOut(
            @PathVariable UUID cashOutId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(cashOutService.cancelCashOut(cashOutId, currentUserId));
    }
}
