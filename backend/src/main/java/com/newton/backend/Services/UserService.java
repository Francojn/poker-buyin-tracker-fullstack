package com.newton.backend.Services;

import com.newton.backend.domain.User;
import com.newton.backend.domain.dtos.CreateUserRequest;
import com.newton.backend.domain.dtos.SessionInviteDto;
import com.newton.backend.domain.dtos.UserDto;


import java.util.List;
import java.util.UUID;


public interface UserService {
    UserDto getUserByIds(UUID userId);
    List<UserDto> listAllUsers();
    UserDto createUser(CreateUserRequest Request);
    List<SessionInviteDto> getReceivedInvites(UUID userId, UUID currentUserId);
    void deleteUserById(UUID userId, UUID currentUserId);

}
