package com.newton.backend.mappers;

import com.newton.backend.domain.User;
import com.newton.backend.domain.dtos.UserDto;
import com.newton.backend.domain.dtos.UserSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserSummaryMapper {

    @Mapping(source = "id", target = "userId")
    UserSummaryDto toDto(User user);
}
