package com.newton.backend.Services.Impl;

import com.newton.backend.Services.CashOutService;
import com.newton.backend.domain.*;

import com.newton.backend.domain.dtos.CashOutDto;
import com.newton.backend.domain.dtos.CreateCashOutRequest;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.CashOutMapper;

import com.newton.backend.respositories.BuyInRepository;
import com.newton.backend.respositories.CashOutRepository;
import com.newton.backend.respositories.SessionPlayerRepository;
import com.newton.backend.respositories.SessionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CashOutServiceImpl implements CashOutService {

    private final CashOutRepository cashOutRepository;
    private final BuyInRepository buyInRepository;
    private final SessionRepository sessionRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final CashOutMapper cashOutMapper;

    @Override
    public CashOutDto createCashOut(UUID sessionId, CreateCashOutRequest request, UUID actingUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        validateHost(session, actingUserId);

        SessionPlayer sessionPlayer = sessionPlayerRepository.findById(request.getSessionPlayerId())
                .orElseThrow(() -> new NotFoundException("Session player not found"));

        if (!sessionPlayer.getSession().getId().equals(sessionId)) {
            throw new ConflictException("Player does not belong to this session");
        }

        if (cashOutRepository.findBySessionPlayerId(sessionPlayer.getId()).isPresent()) {
            throw new ConflictException("This player already has a cash-out recorded");
        }

        BigDecimal requestCash = request.getCashAmount() != null ? request.getCashAmount() : BigDecimal.ZERO;
        BigDecimal requestCard = request.getCardAmount() != null ? request.getCardAmount() : BigDecimal.ZERO;

        if (requestCash.compareTo(BigDecimal.ZERO) <= 0 && requestCard.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ConflictException("Cash-out amount must be greater than zero");
        }

        List<BuyIn> paidBuyIns = buyInRepository.findBySessionIdAndStatusIn(
                sessionId, List.of(BuyInStatusEnum.PAID, BuyInStatusEnum.CONFIRMED));

        List<CashOut> activeCashOuts = cashOutRepository.findBySessionId(sessionId).stream()
                .filter(c -> c.getStatus() != CashOutStatusEnum.CANCELLED)
                .toList();

        if (requestCash.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal cashPool = paidBuyIns.stream()
                    .filter(b -> PaymentMethodEnum.CASH.equals(b.getPaymentMethod()))
                    .map(BuyIn::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal usedCash = activeCashOuts.stream()
                    .map(c -> c.getCashAmount() != null ? c.getCashAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (usedCash.add(requestCash).compareTo(cashPool) > 0) {
                throw new ConflictException("Not enough cash buy-ins remaining to cover this cash-out");
            }
        }

        if (requestCard.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal cardPool = paidBuyIns.stream()
                    .filter(b -> PaymentMethodEnum.CARD.equals(b.getPaymentMethod()))
                    .map(BuyIn::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal usedCard = activeCashOuts.stream()
                    .map(c -> c.getCardAmount() != null ? c.getCardAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (usedCard.add(requestCard).compareTo(cardPool) > 0) {
                throw new ConflictException("Not enough card buy-ins remaining to cover this cash-out");
            }
        }

        CashOut cashOut = CashOut.builder()
                .session(session)
                .sessionPlayer(sessionPlayer)
                .amount(requestCash.add(requestCard))
                .cashAmount(requestCash.compareTo(BigDecimal.ZERO) > 0 ? requestCash : null)
                .cardAmount(requestCard.compareTo(BigDecimal.ZERO) > 0 ? requestCard : null)
                .status(CashOutStatusEnum.RECORDED)
                .createdAt(LocalDateTime.now())
                .build();

        cashOutRepository.save(cashOut);
        return cashOutMapper.toDto(cashOut);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashOutDto> getCashOutsForSession(UUID sessionId) {
        return cashOutRepository.findBySessionId(sessionId)
                .stream()
                .map(cashOutMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CashOutDto getCashOutById(UUID cashOutId) {
        return cashOutMapper.toDto(getCashOutEntity(cashOutId));
    }

    @Override
    public CashOutDto markCashOutPaidOut(UUID cashOutId, UUID actingUserId) {
        CashOut cashOut = getCashOutEntity(cashOutId);

        validateHost(cashOut.getSession(), actingUserId);

        if (cashOut.getStatus() != CashOutStatusEnum.RECORDED) {
            throw new ConflictException("Only recorded cash-outs can be marked as paid out");
        }

        cashOut.setStatus(CashOutStatusEnum.PAID_OUT);
        cashOut.setPaidOutAt(LocalDateTime.now());

        return cashOutMapper.toDto(cashOut);
    }

    @Override
    public CashOutDto cancelCashOut(UUID cashOutId, UUID actingUserId) {
        CashOut cashOut = getCashOutEntity(cashOutId);

        validateHost(cashOut.getSession(), actingUserId);

        if (cashOut.getStatus() == CashOutStatusEnum.PAID_OUT) {
            throw new ConflictException("Paid out cash-outs cannot be cancelled");
        }

        if (cashOut.getStatus() == CashOutStatusEnum.CANCELLED) {
            throw new ConflictException("Cash-out is already cancelled");
        }

        cashOut.setStatus(CashOutStatusEnum.CANCELLED);
        cashOut.setCancelledAt(LocalDateTime.now());

        return cashOutMapper.toDto(cashOut);
    }

    private CashOut getCashOutEntity(UUID cashOutId) {
        return cashOutRepository.findById(cashOutId)
                .orElseThrow(() -> new NotFoundException("Cash-out not found"));
    }

    private void validateHost(Session session, UUID actingUserId) {
        if (!session.getHost().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the host can perform this action");
        }
    }
}
