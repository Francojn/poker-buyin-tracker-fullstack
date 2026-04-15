import { apiClient } from "./client";
import { endpoints } from "./endpoints";
import type { SessionInvite, User, UserSearchResult } from "../types/api";

export async function getUsers() {
  const response = await apiClient.get<User[]>(endpoints.users.list);
  return response.data;
}

export async function searchUsers(username: string) {
  const response = await apiClient.get<UserSearchResult[]>(endpoints.users.search(username));
  return response.data;
}

export async function getUserReceivedInvites(userId: string) {
  const response = await apiClient.get<SessionInvite[]>(endpoints.users.receivedInvites(userId));
  return response.data;
}
