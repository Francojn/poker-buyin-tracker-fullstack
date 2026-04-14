import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { Connection, CreateConnectionPayload } from "../types/api";

export async function getAcceptedConnections(userId: string) {
  const response = await apiClient.get<Connection[]>(endpoints.users.acceptedConnections(userId));
  return response.data;
}

export async function getPendingConnections(userId: string) {
  const response = await apiClient.get<Connection[]>(endpoints.users.pendingConnections(userId));
  return response.data;
}

export async function sendConnectionRequest(payload: CreateConnectionPayload) {
  const response = await apiClient.post<Connection>(endpoints.connections.sendRequest, payload);
  return response.data;
}

export async function acceptConnection(connectionId: string) {
  const response = await apiClient.patch<Connection>(endpoints.connections.accept(connectionId));
  return response.data;
}

export async function declineConnection(connectionId: string) {
  const response = await apiClient.patch<Connection>(endpoints.connections.decline(connectionId));
  return response.data;
}

export async function cancelConnectionRequest(connectionId: string) {
  const response = await apiClient.patch<Connection>(endpoints.connections.cancel(connectionId));
  return response.data;
}

export async function removeConnection(connectionId: string) {
  await apiClient.delete(endpoints.connections.remove(connectionId));
}
