package com.newton.backend.mappers;


import com.newton.backend.domain.CashOut;
import com.newton.backend.domain.dtos.CashOutDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CashOutMapper {

    @Mapping(target = "sessionId", source = "session.id")
    @Mapping(target = "sessionPlayerId", source = "sessionPlayer.id")
    @Mapping(target = "userId", source = "sessionPlayer.player.id")
    @Mapping(target = "username", source = "sessionPlayer.player.username")
    CashOutDto toDto(CashOut cashOut);
}
