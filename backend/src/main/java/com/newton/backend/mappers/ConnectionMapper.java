package com.newton.backend.mappers;

import com.newton.backend.domain.Connection;
import com.newton.backend.domain.dtos.ConnectionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConnectionMapper {

    @Mapping(target = "senderId", source = "sender.id")
    @Mapping(target = "senderUsername", source = "sender.username")
    @Mapping(target = "senderUserCode", source = "sender.userCode")
    @Mapping(target = "recipientId", source = "recipient.id")
    @Mapping(target = "recipientUsername", source = "recipient.username")
    @Mapping(target = "recipientUserCode", source = "recipient.userCode")
    ConnectionDto toDto(Connection connection);
}