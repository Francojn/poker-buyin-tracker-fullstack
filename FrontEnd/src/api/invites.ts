import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { SessionInvite } from "../types/api";

export async function acceptInvite(inviteId: string) {
  const response = await apiClient.patch<SessionInvite>(endpoints.invites.accept(inviteId));
  return response.data;
}

export async function declineInvite(inviteId: string) {
  const response = await apiClient.patch<SessionInvite>(endpoints.invites.decline(inviteId));
  return response.data;
}
