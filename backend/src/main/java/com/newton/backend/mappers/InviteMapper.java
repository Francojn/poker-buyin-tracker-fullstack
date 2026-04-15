package com.newton.backend.mappers;

import com.newton.backend.domain.SessionInvite;
import com.newton.backend.domain.dtos.SessionInviteDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InviteMapper {

    @Mapping(source = "id", target = "inviteId")
    @Mapping(source = "session.id", target = "sessionId")
    @Mapping(source = "session.name", target = "sessionName")
    @Mapping(source = "session.startTime", target = "sessionStartTime")
    @Mapping(source = "session.location", target = "sessionLocation")
    @Mapping(source = "invitedUser.id", target = "invitedUserId")
    @Mapping(source = "invitedUser.username", target = "invitedUsername")
    @Mapping(source = "invitedUser.userCode", target = "invitedUserCode")
    @Mapping(source = "invitedBy.id", target = "invitedById")
    @Mapping(source = "invitedBy.username", target = "invitedByUsername")
    @Mapping(source = "invitedBy.userCode", target = "invitedByUserCode")
    SessionInviteDto toDto(SessionInvite invite);
}
