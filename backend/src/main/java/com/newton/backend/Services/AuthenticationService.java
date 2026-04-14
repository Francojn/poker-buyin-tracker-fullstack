package com.newton.backend.Services;


import com.newton.backend.domain.dtos.AuthResponseDto;
import com.newton.backend.domain.dtos.RegisterRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public interface AuthenticationService {
    UserDetails authenticate(String email, String password) throws UsernameNotFoundException;
    String generateToken(UserDetails userDetails);
    UserDetails validateToken(String token);
    AuthResponseDto register(RegisterRequest request);
}
