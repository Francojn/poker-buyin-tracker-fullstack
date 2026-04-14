package com.newton.backend.Services.Impl;

import com.newton.backend.Services.SessionService;
import com.newton.backend.domain.*;
import com.newton.backend.domain.dtos.*;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.SessionMapper;
import com.newton.backend.respositories.InviteRepository;
import com.newton.backend.respositories.SessionPlayerRepository;
import com.newton.backend.respositories.SessionRepository;
import com.newton.backend.respositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final UserRepository userRepository;
    private final InviteRepository inviteRepository;
    private final SessionPlayerRepository sessionPlayerRepository;

    // Only lists user is part of

    @Transactional(readOnly = true)
    @Override
    public List<SessionDetailsDto> listSessions(UUID currentUserId) {
        return sessionRepository.findAll()
                .stream()
                .filter(session ->
                        session.getHost().getId().equals(currentUserId) ||
                                session.getPlayersInSession().stream()
                                        .anyMatch(sp -> sp.getPlayer().getId().equals(currentUserId))
                )
                .map(sessionMapper::toDto)
                .collect(Collectors.toList());
    }


    @Override
    public SessionDetailsDto createSession(CreateSessionRequest request, UUID currentUserId) {
        Session session = sessionMapper.toEntity(request);
        session.setStatus(SessionStatusEnum.LIVE);

        User host = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        session.setHost(host);

        Session saved = sessionRepository.save(session);

        SessionPlayer playerHost = SessionPlayer.builder()
                .session(saved)
                .player(host)
                .joinedAt(LocalDateTime.now())
                .role(SessionPlayerRoleEnum.HOST)
                .totalBuyIn(BigDecimal.ZERO)
                .totalCashOut(BigDecimal.ZERO)
                .build();

        saved.getPlayersInSession().add(playerHost);
        sessionPlayerRepository.save(playerHost);

        return sessionMapper.toDto(saved);
    }


    @Override
    @Transactional(readOnly = true)
    public SessionDetailsDto getSessionById(UUID sessionId, UUID currentUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        boolean isHost = session.getHost().getId().equals(currentUserId);
        boolean isPlayer = session.getPlayersInSession().stream()
                .anyMatch(sessionPlayer -> sessionPlayer.getPlayer().getId().equals(currentUserId));

        if (!isHost && !isPlayer) {
            throw new ForbiddenException("You do not have access to this session");
        }

        return sessionMapper.toDto(session);
    }

    public SessionDetailsDto addPlayerToSession(UUID sessionId,
                                                AddPlayersToSessionRequest request,
                                                UUID currentUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getHost().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the host can add players to this session");
        }

        if (session.getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Session is already completed");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean alreadyInSession = session.getPlayersInSession().stream()
                .anyMatch(sessionPlayer -> sessionPlayer.getPlayer().getId().equals(user.getId()));

        if (alreadyInSession) {
            throw new ConflictException("User is already in this session");
        }

        SessionPlayerRoleEnum playerRole = SessionPlayerRoleEnum.PLAYER;
        if (session.getHost() != null && session.getHost().getId().equals(user.getId())) {
            playerRole = SessionPlayerRoleEnum.HOST;
        }

        SessionPlayer player = SessionPlayer.builder()
                .session(session)
                .player(user)
                .joinedAt(LocalDateTime.now())
                .role(playerRole)
                .totalBuyIn(BigDecimal.ZERO)
                .totalCashOut(BigDecimal.ZERO)
                .build();

        session.getPlayersInSession().add(player);
        Session saved = sessionRepository.save(session);

        return sessionMapper.toDto(saved);
    }


    @Override
    public void removePlayerFromSession(UUID sessionId,
                                        DeletePlayerFromSessionRequest request,
                                        UUID currentUserId) {

        SessionPlayer currentSessionPlayer = sessionPlayerRepository
                .findBySessionIdAndPlayerId(sessionId, currentUserId)
                .orElseThrow(() -> new NotFoundException("User is not part of this session"));

        SessionPlayer sessionPlayerToDelete = sessionPlayerRepository
                .findBySessionIdAndPlayerId(sessionId, request.getUserId())
                .orElseThrow(() -> new NotFoundException("Player not in session"));

        if (currentSessionPlayer.getSession().getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Cannot remove players from a completed session");
        }

        if (sessionPlayerToDelete.getRole() == SessionPlayerRoleEnum.HOST) {
            throw new ConflictException("Cannot remove host");
        }

        boolean currentUserIsHost = currentSessionPlayer.getRole() == SessionPlayerRoleEnum.HOST;
        boolean removingSelf = currentSessionPlayer.getPlayer().getId()
                .equals(sessionPlayerToDelete.getPlayer().getId());

        if (currentUserIsHost && removingSelf) {
            throw new ConflictException("Host cannot remove themselves");
        }

        if (!currentUserIsHost && !removingSelf) {
            throw new ForbiddenException("Users can only remove themselves");
        }

        sessionPlayerRepository.delete(sessionPlayerToDelete);
    }


    @Override
    public SessionDetailsDto invitePlayerToSession(UUID sessionId, SessionInviteRequest request,
                                                   UUID currentUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getHost().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the host can invite players to this session");
        }

        if (session.getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Cannot invite players to a completed session");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean alreadyInSession = session.getPlayersInSession().stream()
                .anyMatch(sessionPlayer -> sessionPlayer.getPlayer().getId().equals(user.getId()));

        if (alreadyInSession) {
            throw new ConflictException("User is already in this session");
        }

        boolean alreadyInvited = inviteRepository.existsBySessionIdAndInvitedUserIdAndStatus(
                sessionId,
                user.getId(),
                SessionInviteStatusEnum.RECEIVED
        );

        if (alreadyInvited) {
            throw new ConflictException("User already has a pending invite");
        }

        SessionInvite invite = SessionInvite.builder()
                .session(session)
                .invitedBy(session.getHost())
                .invitedUser(user)
                .status(SessionInviteStatusEnum.RECEIVED)
                .createdAt(LocalDateTime.now())
                .build();

        session.getInvites().add(invite);
        Session saved = sessionRepository.save(session);

        return sessionMapper.toDto(saved);
    }


    @Override
    public void deleteSession(UUID sessionId, UUID currentUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getHost().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only host can delete this session");
        }

        if (session.getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Cannot delete a completed session");
        }

        sessionRepository.delete(session);
    }

    @Override
    public SessionDetailsDto completeSession(UUID sessionId, UUID currentUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getHost().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only host can complete this session");
        }

        if (session.getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Session is already completed");
        }

        session.setStatus(SessionStatusEnum.COMPLETED);
        session.setEndTime(LocalDateTime.now());

        Session saved = sessionRepository.save(session);
        return sessionMapper.toDto(saved);
    }
}
