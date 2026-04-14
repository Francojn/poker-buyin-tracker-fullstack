import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { AuthResponse, LoginPayload, RegisterPayload } from "../types/api";

export async function loginRequest(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>(endpoints.auth.login, payload);
  return response.data;
}

export async function registerRequest(payload: RegisterPayload) {
  const response = await apiClient.post<AuthResponse>(endpoints.auth.register, payload);
  return response.data;
}
