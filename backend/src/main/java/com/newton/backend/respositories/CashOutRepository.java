package com.newton.backend.respositories;

import com.newton.backend.domain.CashOut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashOutRepository extends JpaRepository<CashOut, UUID> {
    List<CashOut> findBySessionId(UUID sessionId);
    Optional<CashOut> findBySessionPlayerId(UUID sessionPlayerId);
}
