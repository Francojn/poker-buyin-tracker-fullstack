package com.newton.backend.mappers;

import com.newton.backend.domain.SessionPlayer;
import com.newton.backend.domain.dtos.PlayerSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PlayerMapper {

    default PlayerSummaryDto toDto(SessionPlayer sp) {
        return PlayerSummaryDto.builder()
                .sessionPlayerId(sp.getId())
                .userId(sp.getPlayer().getId())
                .username(sp.getPlayer().getUsername())
                .role(sp.getRole())
                .totalBuyIn(sp.getTotalBuyIn())
                .totalCashOut(sp.getTotalCashOut())
                .build();
    }
}
