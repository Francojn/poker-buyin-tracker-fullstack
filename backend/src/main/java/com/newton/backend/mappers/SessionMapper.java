package com.newton.backend.mappers;


import com.newton.backend.domain.Session;
import com.newton.backend.domain.dtos.CreateSessionRequest;
import com.newton.backend.domain.dtos.SessionDetailsDto;
import org.mapstruct.*;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring",uses = {PlayerMapper.class, UserMapper.class, UserSummaryMapper.class} ,unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SessionMapper {

    @Mapping(source = "playersInSession", target = "players")
    @Mapping(source = "host", target = "host")
    SessionDetailsDto toDto(Session session);

    Session toEntity(CreateSessionRequest createSessionRequest);

    @AfterMapping
    default void setEmptyPlayersListIfNull(@MappingTarget SessionDetailsDto dto) {
        if (dto.getPlayers() == null) {
            dto.setPlayers(new ArrayList<>());
        }
    }
}
