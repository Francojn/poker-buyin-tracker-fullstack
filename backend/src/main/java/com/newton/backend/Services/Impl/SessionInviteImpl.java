package com.newton.backend.Services.Impl;

import com.newton.backend.Services.SessionInviteService;
import com.newton.backend.Services.SessionService;
import com.newton.backend.domain.*;
import com.newton.backend.domain.dtos.SessionInviteDto;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.InviteMapper;
import com.newton.backend.respositories.InviteRepository;
import com.newton.backend.respositories.SessionPlayerRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionInviteImpl implements SessionInviteService {

    private final InviteRepository inviteRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final InviteMapper inviteMapper;

    @Override
    public SessionInviteDto acceptInvite(UUID inviteId, UUID currentUserId) {
        SessionInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(()->new NotFoundException("Invite not found"));

        if (!invite.getInvitedUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only accept your own invites");
        }
        if (invite.getStatus() != SessionInviteStatusEnum.RECEIVED) {
            throw new ConflictException("Invite has already been handled");
        }

        if (invite.getSession().getStatus() == SessionStatusEnum.COMPLETED) {
            throw new ConflictException("Cannot join a completed session");
        }

        boolean alreadyInSession = sessionPlayerRepository
                .existsBySessionIdAndPlayerId(
                        invite.getSession().getId(),
                        invite.getInvitedUser().getId()
                );

        if (alreadyInSession) {
            throw new ConflictException("User is already in this session");
        }

        SessionPlayerRoleEnum role = SessionPlayerRoleEnum.PLAYER;
        if (invite.getSession().getHost() != null &&
                invite.getSession().getHost().getId().equals(invite.getInvitedUser().getId())) {
            role = SessionPlayerRoleEnum.HOST;
        }

        invite.setStatus(SessionInviteStatusEnum.ACCEPTED);
        invite.setRespondedAt(LocalDateTime.now());


        SessionPlayer sessionPlayer = SessionPlayer.builder()
                .session(invite.getSession())
                .player(invite.getInvitedUser())
                .joinedAt(LocalDateTime.now())
                .role(role)
                .totalBuyIn(BigDecimal.ZERO)
                .totalCashOut(BigDecimal.ZERO)
                .build();

        sessionPlayerRepository.save(sessionPlayer);
        SessionInvite savedInvite = inviteRepository.save(invite);
        return inviteMapper.toDto(savedInvite);
    }

    @Override
    public SessionInviteDto denyInvite(UUID inviteId,  UUID currentUserId) {
        SessionInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        if (!invite.getInvitedUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only decline your own invites");
        }

        if (invite.getStatus() != SessionInviteStatusEnum.RECEIVED) {
            throw new ConflictException("Invite has already been handled");
        }

        invite.setStatus(SessionInviteStatusEnum.DECLINED);
        invite.setRespondedAt(LocalDateTime.now());

        SessionInvite savedInvite = inviteRepository.save(invite);
        return inviteMapper.toDto(savedInvite);
    }
}
