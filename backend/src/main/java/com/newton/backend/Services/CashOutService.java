package com.newton.backend.Services;

import com.newton.backend.domain.dtos.CashOutDto;
import com.newton.backend.domain.dtos.CreateCashOutRequest;

import java.util.List;
import java.util.UUID;

public interface CashOutService {
    CashOutDto createCashOut(UUID sessionId, CreateCashOutRequest request, UUID actingUserId);
    List<CashOutDto> getCashOutsForSession(UUID sessionId);
    CashOutDto getCashOutById(UUID cashOutId);
    CashOutDto markCashOutPaidOut(UUID cashOutId, UUID actingUserId);
    CashOutDto cancelCashOut(UUID cashOutId, UUID actingUserId);
}
