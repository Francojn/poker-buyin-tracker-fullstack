package com.newton.backend.Services.Impl;

import com.newton.backend.Services.UserService;
import com.newton.backend.domain.User;
import com.newton.backend.domain.dtos.CreateUserRequest;
import com.newton.backend.domain.dtos.SessionInviteDto;
import com.newton.backend.domain.dtos.UserDto;
import com.newton.backend.domain.dtos.UserSummaryDto;
import com.newton.backend.exceptions.ConflictException;
import com.newton.backend.exceptions.ForbiddenException;
import com.newton.backend.exceptions.NotFoundException;
import com.newton.backend.mappers.InviteMapper;
import com.newton.backend.mappers.UserMapper;
import com.newton.backend.respositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final InviteMapper inviteMapper;

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByIds(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        return userMapper.toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ConflictException("Email already exists");
        }
        if (userRepository.findByUsernameAndUserCode(request.getUsername(), request.getUserCode() != null ? request.getUserCode() : "0000").isPresent()) {
            throw new ConflictException("Username and code combination already taken");
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash("TEMP");

        User saved = userRepository.save(user);
        return userMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionInviteDto> getReceivedInvites(UUID userId, UUID currentUserId) {
        if (!userId.equals(currentUserId)) {
            throw new ForbiddenException("You can only view your own invites");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        return user.getReceivedInvites().stream()
                .map(inviteMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> searchUsers(String username) {
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(username.toLowerCase()))
                .map(u -> UserSummaryDto.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .userCode(u.getUserCode())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updatePaymentLink(UUID userId, UUID currentUserId, String paymentLink) {
        if (!userId.equals(currentUserId)) {
            throw new ForbiddenException("You can only update your own payment link");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        user.setPaymentLink(paymentLink);
        User saved = userRepository.save(user);
        return userMapper.toDto(saved);
    }

    @Override
    public void deleteUserById(UUID userId, UUID currentUserId) {
        if (!userId.equals(currentUserId)) {
            throw new ForbiddenException("You can only delete your own account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
    }
}