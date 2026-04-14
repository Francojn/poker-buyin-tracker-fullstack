package com.newton.backend.Services.Impl;

import com.newton.backend.Services.ConnectionService;
import com.newton.backend.domain.Connection;
import com.newton.backend.domain.ConnectionStatusEnum;
import com.newton.backend.domain.dtos.ConnectionDto;
import com.newton.backend.domain.User;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.ConnectionMapper;
import com.newton.backend.respositories.ConnectionRepository;
import com.newton.backend.respositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ConnectionServiceImpl implements ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final ConnectionMapper connectionMapper;

    @Override
    public ConnectionDto sendRequest(UUID actingUserId, UUID recipientId) {
        if (actingUserId.equals(recipientId)) {
            throw new IllegalArgumentException("You cannot connect with yourself");
        }

        User sender = userRepository.findById(actingUserId)
                .orElseThrow(() -> new NotFoundException("Sender not found"));

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new NotFoundException("Recipient not found"));

        Optional<Connection> existing =
                connectionRepository.findBySenderIdAndRecipientId(actingUserId, recipientId);

        if (existing.isEmpty()) {
            existing = connectionRepository.findBySenderIdAndRecipientId(recipientId, actingUserId);
        }

        if (existing.isPresent()) {
            throw new ConflictException("Connection already exists between these users");
        }

        Connection connection = Connection.builder()
                .sender(sender)
                .recipient(recipient)
                .status(ConnectionStatusEnum.RECEIVED)
                .createdAt(LocalDateTime.now())
                .build();

        connectionRepository.save(connection);
        return connectionMapper.toDto(connection);
    }

    @Override
    public ConnectionDto acceptRequest(UUID connectionId, UUID actingUserId) {
        Connection connection = getConnectionEntity(connectionId);

        if (!connection.getRecipient().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the recipient can accept this request");
        }

        if (connection.getStatus() != ConnectionStatusEnum.RECEIVED) {
            throw new ConflictException("Only pending requests can be accepted");
        }

        connection.setStatus(ConnectionStatusEnum.ACCEPTED);
        connection.setRespondedAt(LocalDateTime.now());

        return connectionMapper.toDto(connection);
    }

    @Override
    public ConnectionDto declineRequest(UUID connectionId, UUID actingUserId) {
        Connection connection = getConnectionEntity(connectionId);

        if (!connection.getRecipient().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the recipient can decline this request");
        }

        if (connection.getStatus() != ConnectionStatusEnum.RECEIVED) {
            throw new ConflictException("Only pending requests can be declined");
        }

        connection.setStatus(ConnectionStatusEnum.DECLINED);
        connection.setRespondedAt(LocalDateTime.now());

        return connectionMapper.toDto(connection);
    }

    @Override
    public ConnectionDto cancelRequest(UUID connectionId, UUID actingUserId) {
        Connection connection = getConnectionEntity(connectionId);

        if (!connection.getSender().getId().equals(actingUserId)) {
            throw new ForbiddenException("Only the sender can cancel this request");
        }

        if (connection.getStatus() != ConnectionStatusEnum.RECEIVED) {
            throw new ConflictException("Only pending requests can be cancelled");
        }

        connection.setStatus(ConnectionStatusEnum.CANCELLED);
        connection.setRespondedAt(LocalDateTime.now());

        return connectionMapper.toDto(connection);
    }

    @Override
    public void removeConnection(UUID connectionId, UUID actingUserId) {
        Connection connection = getConnectionEntity(connectionId);

        boolean isSender = connection.getSender().getId().equals(actingUserId);
        boolean isRecipient = connection.getRecipient().getId().equals(actingUserId);

        if (!isSender && !isRecipient) {
            throw new ForbiddenException("Only connected users can remove this connection");
        }

        if (connection.getStatus() != ConnectionStatusEnum.ACCEPTED) {
            throw new ConflictException("Only accepted connections can be removed");
        }

        connectionRepository.delete(connection);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConnectionDto> getUserConnections(UUID userId) {
        return connectionRepository.findBySenderIdOrRecipientId(userId, userId)
                .stream()
                .filter(connection -> connection.getStatus() == ConnectionStatusEnum.ACCEPTED)
                .map(connectionMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConnectionDto> getPendingRequests(UUID userId) {
        return connectionRepository.findByRecipientIdAndStatus(userId, ConnectionStatusEnum.RECEIVED)
                .stream()
                .map(connectionMapper::toDto)
                .toList();
    }

    private Connection getConnectionEntity(UUID connectionId) {
        return connectionRepository.findById(connectionId)
                .orElseThrow(() -> new NotFoundException("Connection not found"));
    }
}