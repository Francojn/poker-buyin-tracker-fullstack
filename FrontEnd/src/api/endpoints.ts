export const endpoints = {
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register"
  },
  sessions: {
    list: "/api/v1/sessions",
    create: "/api/v1/sessions",
    details: (sessionId: string) => `/api/v1/sessions/${sessionId}`,
    addPlayer: (sessionId: string) => `/api/v1/sessions/${sessionId}/players`,
    removePlayer: (sessionId: string, userId: string) =>
      `/api/v1/sessions/${sessionId}/players/${userId}`,
    invitePlayer: (sessionId: string) => `/api/v1/sessions/${sessionId}/invites`,
    complete: (sessionId: string) => `/api/v1/sessions/${sessionId}/complete`,
    delete: (sessionId: string) => `/api/v1/sessions/${sessionId}`
  },
  users: {
    list: "/api/v1/users",
    search: (username: string) => `/api/v1/users/search?username=${encodeURIComponent(username)}`,
    details: (userId: string) => `/api/v1/users/${userId}`,
    receivedInvites: (userId: string) => `/api/v1/users/${userId}/receivedInvites`,
    acceptedConnections: (userId: string) => `/api/v1/users/${userId}/connections`,
    pendingConnections: (userId: string) => `/api/v1/users/${userId}/connection-requests/pending`,
    updatePaymentLink: (userId: string) => `/api/v1/users/${userId}/payment-link`
  },
  buyIns: {
    listForSession: (sessionId: string) => `/api/v1/sessions/${sessionId}/buyins`,
    create: (sessionId: string) => `/api/v1/sessions/${sessionId}/buyins`,
    details: (buyInId: string) => `/api/v1/buyins/${buyInId}`,
    accept: (buyInId: string) => `/api/v1/buyins/${buyInId}/accept`,
    decline: (buyInId: string) => `/api/v1/buyins/${buyInId}/decline`,
    markPaid: (buyInId: string) => `/api/v1/buyins/${buyInId}/mark-paid`,
    cancel: (buyInId: string) => `/api/v1/buyins/${buyInId}/cancel`
  },
  cashOuts: {
    listForSession: (sessionId: string) => `/api/v1/sessions/${sessionId}/cashouts`,
    create: (sessionId: string) => `/api/v1/sessions/${sessionId}/cashouts`,
    details: (cashOutId: string) => `/api/v1/cashouts/${cashOutId}`,
    markPaidOut: (cashOutId: string) => `/api/v1/cashouts/${cashOutId}/mark-paid-out`,
    cancel: (cashOutId: string) => `/api/v1/cashouts/${cashOutId}/cancel`
  },
  invites: {
    listForSession: (sessionId: string) => `/api/v1/sessions/${sessionId}/invites`,
    accept: (inviteId: string) => `/api/v1/session_invites/${inviteId}/accept`,
    decline: (inviteId: string) => `/api/v1/session_invites/${inviteId}/deny`
  },
  connections: {
    sendRequest: "/api/v1/connections/request",
    accept: (connectionId: string) => `/api/v1/connections/${connectionId}/accept`,
    decline: (connectionId: string) => `/api/v1/connections/${connectionId}/decline`,
    cancel: (connectionId: string) => `/api/v1/connections/${connectionId}/cancel`,
    remove: (connectionId: string) => `/api/v1/connections/${connectionId}`
  }
} as const;
