import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { CashOut, CreateCashOutPayload } from "../types/api";

export async function getCashOutsForSession(sessionId: string) {
  const response = await apiClient.get<CashOut[]>(endpoints.cashOuts.listForSession(sessionId));
  return response.data;
}

export async function createCashOut(sessionId: string, payload: CreateCashOutPayload) {
  const response = await apiClient.post<CashOut>(endpoints.cashOuts.create(sessionId), payload);
  return response.data;
}

export async function markCashOutPaidOut(cashOutId: string) {
  const response = await apiClient.patch<CashOut>(endpoints.cashOuts.markPaidOut(cashOutId));
  return response.data;
}

export async function cancelCashOut(cashOutId: string) {
  const response = await apiClient.patch<CashOut>(endpoints.cashOuts.cancel(cashOutId));
  return response.data;
}
