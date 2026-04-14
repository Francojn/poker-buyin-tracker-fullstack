package com.newton.backend.controllers;


import com.newton.backend.Services.BuyInService;
import com.newton.backend.domain.dtos.BuyInDto;
import com.newton.backend.domain.dtos.CreateBuyInRequest;
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
public class BuyInController {

    private final BuyInService buyInService;

    @PostMapping("/sessions/{sessionId}/buyins")
    public ResponseEntity<BuyInDto> createBuyIn(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CreateBuyInRequest createBuyInRequest,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buyInService.createBuyIn(sessionId, createBuyInRequest,currentUserId));
    }

    @GetMapping("/sessions/{sessionId}/buyins")
    public ResponseEntity<List<BuyInDto>> getBuyInsForSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(buyInService.getBuyInsForSession(sessionId));
    }

    @GetMapping("/buyins/{buyInId}")
    public ResponseEntity<BuyInDto> getBuyInById(@PathVariable UUID buyInId) {
        return ResponseEntity.ok(buyInService.getBuyInById(buyInId));
    }

    @PatchMapping("/buyins/{buyInId}/accept")
    public ResponseEntity<BuyInDto> acceptBuyIn(
            @PathVariable UUID buyInId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(buyInService.acceptBuyIn(buyInId, currentUserId));
    }

    @PatchMapping("/buyins/{buyInId}/decline")
    public ResponseEntity<BuyInDto> declineBuyIn(
            @PathVariable UUID buyInId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(buyInService.declineBuyIn(buyInId, currentUserId));
    }

    @PatchMapping("/buyins/{buyInId}/mark-paid")
    public ResponseEntity<BuyInDto> markBuyInPaid(
            @PathVariable UUID buyInId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(buyInService.markBuyInPaid(buyInId, currentUserId));
    }

    @PatchMapping("/buyins/{buyInId}/cancel")
    public ResponseEntity<BuyInDto> cancelBuyIn(
            @PathVariable UUID buyInId,
            HttpServletRequest request
    ) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(buyInService.cancelBuyIn(buyInId, currentUserId));
    }
}
