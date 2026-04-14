import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type {
  AddSessionPlayerPayload,
  CreateSessionPayload,
  SessionDetails
} from "../types/api";

export async function getSessions() {
  const response = await apiClient.get<SessionDetails[]>(endpoints.sessions.list);
  return response.data;
}

export async function createSession(payload: CreateSessionPayload) {
  const response = await apiClient.post<SessionDetails>(endpoints.sessions.create, payload);
  return response.data;
}

export async function getSessionById(sessionId: string) {
  const response = await apiClient.get<SessionDetails>(endpoints.sessions.details(sessionId));
  return response.data;
}

export async function addPlayerToSession(sessionId: string, payload: AddSessionPlayerPayload) {
  const response = await apiClient.post<SessionDetails>(endpoints.sessions.addPlayer(sessionId), payload);
  return response.data;
}

export async function invitePlayerToSession(sessionId: string, payload: AddSessionPlayerPayload) {
  const response = await apiClient.post<SessionDetails>(endpoints.sessions.invitePlayer(sessionId), payload);
  return response.data;
}

export async function removePlayerFromSession(sessionId: string, userId: string) {
  await apiClient.delete(endpoints.sessions.removePlayer(sessionId, userId));
}

export async function completeSession(sessionId: string) {
  const response = await apiClient.patch<SessionDetails>(endpoints.sessions.complete(sessionId));
  return response.data;
}

export async function deleteSession(sessionId: string) {
  await apiClient.delete(endpoints.sessions.delete(sessionId));
}
