export type Id = string;

export interface User {
  id: Id;
  username: string;
  userCode: string;
  paymentLink?: string | null;
}

export interface UserSummary {
  userId: Id;
  username: string;
  userCode: string;
}

export interface UserSearchResult {
  userId: Id;
  username: string;
  userCode: string;
}

export type SessionStatus = "LIVE" | "COMPLETED";
export type SessionPlayerRole = "HOST" | "USER";
export type BuyInStatus = "PENDING" | "PAID" | "DECLINED" | "CANCELLED" | "CONFIRMED";
export type CashOutStatus = "RECORDED" | "PAID_OUT" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD";
export type ConnectionStatus = "RECEIVED" | "ACCEPTED" | "DECLINED" | "CANCELLED";
export type SessionInviteStatus = "RECEIVED" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: User;
}

export interface SessionPlayerSummary {
  sessionPlayerId: Id;
  userId: Id;
  username: string;
  role: SessionPlayerRole;
  totalBuyIn: number | string | null;
  totalCashOut: number | string | null;
}

export interface SessionDetails {
  id: Id;
  name: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  notes?: string | null;
  status: SessionStatus;
  players: SessionPlayerSummary[];
  host: UserSummary;
}

export interface SessionInvite {
  inviteId: Id;
  sessionId: Id;
  sessionName: string;
  sessionStartTime: string;
  sessionLocation: string;
  invitedUserId: Id;
  invitedUsername: string;
  invitedById: Id;
  invitedByUsername: string;
  status: SessionInviteStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface BuyIn {
  id: Id;
  sessionId: Id;
  sessionPlayerId: Id;
  userId: Id;
  username: string;
  amount: number | string;
  status: BuyInStatus;
  paymentMethod?: PaymentMethod | null;
  createdAt: string;
  respondedAt?: string | null;
  paidAt?: string | null;
  note?: string | null;
}

export interface CashOut {
  id: Id;
  sessionId: Id;
  sessionPlayerId: Id;
  userId: Id;
  username: string;
  amount: number | string;
  cashAmount?: number | string | null;
  cardAmount?: number | string | null;
  status: CashOutStatus;
  createdAt: string;
  paidOutAt?: string | null;
  cancelledAt?: string | null;
}

export interface Connection {
  id: Id;
  senderId: Id;
  senderUsername: string;
  senderUserCode: string;
  recipientId: Id;
  recipientUsername: string;
  recipientUserCode: string;
  status: ConnectionStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
  timestamp?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  userCode: string;
  email: string;
  password: string;
  paymentLink?: string;
}

export interface CreateSessionPayload {
  name: string;
  startTime: string;
  location: string;
  notes?: string;
}

export interface AddSessionPlayerPayload {
  userId: Id;
}

export interface CreateBuyInPayload {
  sessionPlayerId: Id;
  amount: number;
  note?: string;
  paymentMethod?: PaymentMethod;
}

export interface CreateCashOutPayload {
  sessionPlayerId: Id;
  cashAmount?: number;
  cardAmount?: number;
}

export interface CreateConnectionPayload {
  senderId: Id;
  recipientId: Id;
}
