package com.newton.backend.respositories;

import com.newton.backend.domain.Connection;
import com.newton.backend.domain.ConnectionStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, UUID> {
    Optional<Connection> findBySenderIdAndRecipientId(UUID senderId, UUID recipientId);
    List<Connection> findByRecipientIdAndStatus(UUID recipientId, ConnectionStatusEnum status);
    List<Connection> findBySenderIdOrRecipientId(UUID senderId, UUID recipientId);
}
