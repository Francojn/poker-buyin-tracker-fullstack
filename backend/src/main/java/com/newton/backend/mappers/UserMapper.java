package com.newton.backend.mappers;


import com.newton.backend.domain.User;
import com.newton.backend.domain.dtos.CreateUserRequest;
import com.newton.backend.domain.dtos.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    UserDto toDto(User user);
    User toEntity(CreateUserRequest request);
}
