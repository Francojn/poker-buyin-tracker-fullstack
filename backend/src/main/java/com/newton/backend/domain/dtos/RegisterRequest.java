package com.newton.backend.domain.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 2, max = 25, message = "Username must be between {min} and {max} characters")
    @Pattern(regexp = "[\\w\\s-]+$", message = "Username can only contain letters, numbers, spaces and hyphens")
    private String username;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "\\d{4}", message = "Code must be exactly 4 digits")
    private String userCode;

    @NotBlank(message = "Email is required")
    @Size(min = 2, max = 50, message = "Email must be between {min} and {max} characters")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between {min} and {max} characters")
    private String password;

    @URL(message = "Invalid URL format")
    private String paymentLink;
}
