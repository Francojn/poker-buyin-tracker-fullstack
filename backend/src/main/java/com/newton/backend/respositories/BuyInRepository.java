package com.newton.backend.respositories;

import com.newton.backend.domain.BuyIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BuyInRepository extends JpaRepository<BuyIn, UUID> {
    List<BuyIn> findBySessionId(UUID sessionId);
    List<BuyIn> findBySessionPlayerId(UUID sessionPlayerId);
}
