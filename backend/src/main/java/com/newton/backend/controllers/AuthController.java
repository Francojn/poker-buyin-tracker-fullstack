package com.newton.backend.controllers;

import com.newton.backend.Services.AuthenticationService;
import com.newton.backend.Services.UserService;
import com.newton.backend.domain.dtos.AuthResponseDto;
import com.newton.backend.domain.dtos.LoginRequest;
import com.newton.backend.domain.dtos.RegisterRequest;
import com.newton.backend.domain.dtos.UserDto;
import com.newton.backend.mappers.UserMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponseDto response = authenticationService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequest loginRequest) {
        UserDetails userDetails = authenticationService.authenticate(
                loginRequest.getEmail(),
                loginRequest.getPassword()
        );

        String tokenValue = authenticationService.generateToken(userDetails);

        com.newton.backend.security.UserDetails customUserDetails =
                (com.newton.backend.security.UserDetails) userDetails;

        UserDto userDto = userMapper.toDto(customUserDetails.getUser());

        AuthResponseDto authResponseDto = AuthResponseDto.builder()
                .token(tokenValue)
                .expiresIn(86400)
                .user(userDto)
                .build();

        return ResponseEntity.ok(authResponseDto);
    }
}
