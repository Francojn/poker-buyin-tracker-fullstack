package com.newton.backend.respositories;

import com.newton.backend.domain.SessionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionPlayerRepository extends JpaRepository<SessionPlayer, UUID> {
    boolean existsBySessionIdAndPlayerId(UUID sessionId, UUID userId);
    Optional<SessionPlayer> findBySessionIdAndPlayerId(UUID sessionId, UUID userId);
    Optional<SessionPlayer> findByPlayerIdAndSessionId(UUID userId, UUID sessionId);
}
