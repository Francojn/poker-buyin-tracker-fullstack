package com.newton.backend.Services;

import com.newton.backend.domain.dtos.BuyInDto;
import com.newton.backend.domain.dtos.CreateBuyInRequest;

import java.util.List;
import java.util.UUID;

public interface BuyInService {
    BuyInDto createBuyIn(UUID sessionId, CreateBuyInRequest request, UUID actingUserId);
    List<BuyInDto> getBuyInsForSession(UUID sessionId);
    BuyInDto getBuyInById(UUID buyInId);
    BuyInDto acceptBuyIn(UUID buyInId, UUID actingUserId);
    BuyInDto declineBuyIn(UUID buyInId, UUID actingUserId);
    BuyInDto markBuyInPaid(UUID buyInId, UUID actingUserId);
    BuyInDto cancelBuyIn(UUID buyInId, UUID actingUserId);
}
