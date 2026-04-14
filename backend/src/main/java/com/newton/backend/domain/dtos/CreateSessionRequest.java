package com.newton.backend.domain.dtos;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {

    @NotBlank(message= "Session name is required")
    @Size(min = 2, max = 50, message = "Session name must be between {min} and {max} characters")
    @Pattern(regexp = "[\\w\\s-]+$", message = "Session name can only contain letters, numbers, spaces and hyphens")
    private String name;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotBlank(message= "location is required")
    @Size(min = 2, max = 50, message = "location name must be between {min} and {max} characters")
    @Pattern(regexp = "[\\w\\s-]+$", message = "location name can only contain letters, numbers, spaces and hyphens")
    private String location;

    @Size(min = 0, max = 500, message = "Notes must be between {min} and {max} characters")
    @Pattern(regexp = "[\\w\\s-]+$", message = "Notes can only contain letters, numbers, spaces and hyphens")
    private String notes;
}
