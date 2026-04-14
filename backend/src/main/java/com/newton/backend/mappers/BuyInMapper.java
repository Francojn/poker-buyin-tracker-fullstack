package com.newton.backend.mappers;


import com.newton.backend.domain.BuyIn;
import com.newton.backend.domain.dtos.BuyInDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BuyInMapper {

    @Mapping(source = "session.id", target = "sessionId")
    @Mapping(source = "sessionPlayer.id" ,target = "sessionPlayerId")
    @Mapping(source = "sessionPlayer.player.id", target = "userId")
    @Mapping(source = "sessionPlayer.player.username", target = "username")
    BuyInDto toDto(BuyIn buyIn);
}
