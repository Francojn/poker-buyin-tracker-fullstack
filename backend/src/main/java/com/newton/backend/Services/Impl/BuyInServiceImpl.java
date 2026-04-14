package com.newton.backend.Services.Impl;

import com.newton.backend.Services.BuyInService;
import com.newton.backend.domain.BuyIn;
import com.newton.backend.domain.BuyInStatusEnum;
import com.newton.backend.domain.Session;
import com.newton.backend.domain.SessionPlayer;
import com.newton.backend.domain.dtos.BuyInDto;
import com.newton.backend.domain.dtos.CreateBuyInRequest;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.BuyInMapper;
import com.newton.backend.respositories.BuyInRepository;
import com.newton.backend.respositories.SessionPlayerRepository;
import com.newton.backend.respositories.SessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class BuyInServiceImpl implements BuyInService {
    private final BuyInRepository buyInRepository;
    private final SessionRepository sessionRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final BuyInMapper buyInMapper;

    @Override
    public BuyInDto createBuyIn(UUID sessionId, CreateBuyInRequest request, UUID actingUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getHost().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the host can create a buy-in");
        }

        SessionPlayer sessionPlayer = sessionPlayerRepository.findById(request.getSessionPlayerId())
                .orElseThrow(() -> new NotFoundException("Session player not found"));

        if (!sessionPlayer.getSession().getId().equals(sessionId)) {
            throw new NotFoundException("Player not found in this session");
        }

        BuyIn buyIn = BuyIn.builder()
                .session(session)
                .sessionPlayer(sessionPlayer)
                .amount(request.getAmount())
                .status(BuyInStatusEnum.PENDING)
                .createdAt(LocalDateTime.now())
                .note(request.getNote())
                .paymentMethod(request.getPaymentMethod())
                .build();

        buyInRepository.save(buyIn);
        return buyInMapper.toDto(buyIn);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BuyInDto> getBuyInsForSession(UUID sessionId) {
        return buyInRepository.findBySessionId(sessionId)
                .stream()
                .map(buyInMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BuyInDto getBuyInById(UUID buyInId) {
        BuyIn buyIn = getBuyInEntity(buyInId);
        return buyInMapper.toDto(buyIn);
    }

    @Override
    public BuyInDto acceptBuyIn(UUID buyInId, UUID actingUserId) {
        BuyIn buyIn = getBuyInEntity(buyInId);

        UUID ownerId = buyIn.getSessionPlayer().getPlayer().getId();
        if (!ownerId.equals(actingUserId)) {
            throw new ForbiddenException("Only the target player can accept this buy-in");
        }

        if (buyIn.getStatus() != BuyInStatusEnum.PENDING) {
            throw new ConflictException("Only pending buy-ins can be accepted");
        }

        buyIn.setStatus(BuyInStatusEnum.CONFIRMED);
        buyIn.setRespondedAt(LocalDateTime.now());

        return buyInMapper.toDto(buyIn);
    }

    @Override
    public BuyInDto declineBuyIn(UUID buyInId, UUID actingUserId) {
        BuyIn buyIn = getBuyInEntity(buyInId);

        UUID ownerId = buyIn.getSessionPlayer().getPlayer().getId();
        if (!ownerId.equals(actingUserId)) {
            throw new ForbiddenException("Only the target player can decline this buy-in");
        }

        if (buyIn.getStatus() != BuyInStatusEnum.PENDING) {
            throw new ConflictException("Only pending buy-ins can be declined");
        }

        buyIn.setStatus(BuyInStatusEnum.DECLINED);
        buyIn.setRespondedAt(LocalDateTime.now());

        return buyInMapper.toDto(buyIn);
    }

    @Override
    public BuyInDto markBuyInPaid(UUID buyInId, UUID actingUserId) {
        BuyIn buyIn = getBuyInEntity(buyInId);

        Session session = buyIn.getSession();

        if (!session.getHost().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the host can mark a buy-in as paid");
        }

        if (buyIn.getStatus() != BuyInStatusEnum.CONFIRMED) {
            throw new ConflictException("Only confirmed buy-ins can be marked as paid");
        }

        buyIn.setStatus(BuyInStatusEnum.PAID);
        buyIn.setPaidAt(LocalDateTime.now());

        SessionPlayer sessionPlayer = buyIn.getSessionPlayer();
        sessionPlayer.setTotalBuyIn(sessionPlayer.getTotalBuyIn().add(buyIn.getAmount()));
        sessionPlayerRepository.save(sessionPlayer);

        return buyInMapper.toDto(buyIn);
    }

    @Override
    public BuyInDto cancelBuyIn(UUID buyInId, UUID actingUserId) {
        BuyIn buyIn = getBuyInEntity(buyInId);

        UUID hostId = buyIn.getSession().getHost().getId();
        UUID playerId = buyIn.getSessionPlayer().getPlayer().getId();

        boolean isHost = hostId.equals(actingUserId);
        boolean isTargetPlayer = playerId.equals(actingUserId);

        if (!isHost && !isTargetPlayer) {
            throw new ForbiddenException("Only the host or target player can cancel this buy-in");
        }

        if (buyIn.getStatus() == BuyInStatusEnum.PAID) {
            throw new ConflictException("Paid buy-ins cannot be cancelled");
        }

        if (buyIn.getStatus() == BuyInStatusEnum.DECLINED) {
            throw new ConflictException("Declined buy-ins cannot be cancelled");
        }

        if (buyIn.getStatus() == BuyInStatusEnum.CANCELLED) {
            throw new ConflictException("Buy-in is already cancelled");
        }

        buyIn.setStatus(BuyInStatusEnum.CANCELLED);
        buyIn.setCancelledAt(LocalDateTime.now());

        return buyInMapper.toDto(buyIn);
    }

    private BuyIn getBuyInEntity(UUID buyInId) {
        return buyInRepository.findById(buyInId)
                .orElseThrow(() -> new NotFoundException("Buy-in not found"));
    }
}
