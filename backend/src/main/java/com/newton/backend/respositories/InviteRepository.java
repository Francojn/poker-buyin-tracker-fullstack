package com.newton.backend.respositories;

import com.newton.backend.domain.SessionInvite;
import com.newton.backend.domain.SessionInviteStatusEnum;
import com.newton.backend.domain.SessionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InviteRepository extends JpaRepository<SessionInvite, UUID> {

    boolean existsBySessionIdAndInvitedUserIdAndStatus(
            UUID sessionId,
            UUID invitedUserId,
            SessionInviteStatusEnum status
    );
}
