package com.newton.backend.controllers;

import com.newton.backend.Services.UserService;
import com.newton.backend.domain.SessionInvite;
import com.newton.backend.domain.dtos.CreateUserRequest;
import com.newton.backend.domain.dtos.SessionInviteDto;
import com.newton.backend.domain.dtos.UserDto;
import com.newton.backend.domain.dtos.UserSummaryDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping()
    public ResponseEntity<List<UserDto>> listAllUsers() {
        List<UserDto> users = userService.listAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSummaryDto>> searchUsers(
            @RequestParam(defaultValue = "") String username) {
        return ResponseEntity.ok(userService.searchUsers(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        UserDto user = userService.getUserByIds(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping()
    public ResponseEntity<UserDto> createUser(
            @Valid @RequestBody CreateUserRequest userRequest){
        UserDto user = userService.createUser(userRequest);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}/receivedInvites")
    public ResponseEntity<List<SessionInviteDto>> getReceivedInvites(
            @PathVariable UUID id,
            HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        List<SessionInviteDto> invites = userService.getReceivedInvites(id, currentUserId);
        return ResponseEntity.ok(invites);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id,
            HttpServletRequest request) {
        UUID currentUserId = (UUID) request.getAttribute("userId");
        userService.deleteUserById(id, currentUserId);
        return ResponseEntity.noContent().build();
    }


}
