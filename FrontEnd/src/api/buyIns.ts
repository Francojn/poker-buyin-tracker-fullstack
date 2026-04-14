import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { BuyIn, CreateBuyInPayload } from "../types/api";

export async function getBuyInsForSession(sessionId: string) {
  const response = await apiClient.get<BuyIn[]>(endpoints.buyIns.listForSession(sessionId));
  return response.data;
}

export async function createBuyIn(sessionId: string, payload: CreateBuyInPayload) {
  const response = await apiClient.post<BuyIn>(endpoints.buyIns.create(sessionId), payload);
  return response.data;
}

export async function acceptBuyIn(buyInId: string) {
  const response = await apiClient.patch<BuyIn>(endpoints.buyIns.accept(buyInId));
  return response.data;
}

export async function declineBuyIn(buyInId: string) {
  const response = await apiClient.patch<BuyIn>(endpoints.buyIns.decline(buyInId));
  return response.data;
}

export async function markBuyInPaid(buyInId: string) {
  const response = await apiClient.patch<BuyIn>(endpoints.buyIns.markPaid(buyInId));
  return response.data;
}

export async function cancelBuyIn(buyInId: string) {
  const response = await apiClient.patch<BuyIn>(endpoints.buyIns.cancel(buyInId));
  return response.data;
}
