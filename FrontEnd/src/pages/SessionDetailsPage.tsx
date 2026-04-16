import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  acceptBuyIn,
  cancelBuyIn,
  createBuyIn,
  declineBuyIn,
  getBuyInsForSession,
  markBuyInPaid
} from "../api/buyIns";
import { getInvitesForSession } from "../api/invites";
import {
  cancelCashOut,
  createCashOut,
  getCashOutsForSession,
  markCashOutPaidOut
} from "../api/cashOuts";
import {
  addPlayerToSession,
  completeSession,
  deleteSession,
  getSessionById,
  invitePlayerToSession,
  removePlayerFromSession
} from "../api/sessions";
import { getAcceptedConnections } from "../api/connections";
import { getUsers } from "../api/users";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { BuyIn, BuyInStatus, CashOut, Connection, PaymentMethod, SessionDetails, SessionInvite, User } from "../types/api";
import { formatCurrency, formatDateTime, getInitials } from "../utils/formatters";
import { getErrorMessage } from "../utils/http";

type SessionTab = "overview" | "players" | "buyins" | "cashouts" | "results";

function getBuyInStatusParts(status: BuyInStatus) {
  let acceptanceLabel: string;
  let acceptanceClass: string;

  if (status === "PENDING") {
    acceptanceLabel = "Pending";
    acceptanceClass = "status-pending";
  } else if (status === "CONFIRMED" || status === "PAID") {
    acceptanceLabel = "Accepted";
    acceptanceClass = "status-accepted";
  } else if (status === "DECLINED") {
    acceptanceLabel = "Declined";
    acceptanceClass = "status-declined";
  } else {
    acceptanceLabel = "Cancelled";
    acceptanceClass = "status-cancelled";
  }

  let paymentLabel: string | null = null;
  let paymentClass: string | null = null;

  if (status === "PAID") {
    paymentLabel = "Paid";
    paymentClass = "status-paid";
  } else if (status === "CONFIRMED") {
    paymentLabel = "Unpaid";
    paymentClass = "status-unpaid";
  }

  return { acceptanceLabel, acceptanceClass, paymentLabel, paymentClass };
}

const tabs: Array<{ id: SessionTab; label: string }> = [
  { id: "overview", label: "Session Overview" },
  { id: "players", label: "Player List" },
  { id: "buyins", label: "Buy-Ins" },
  { id: "cashouts", label: "Cash-Outs" }
];

export default function SessionDetailsPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [buyIns, setBuyIns] = useState<BuyIn[]>([]);
  const [cashOuts, setCashOuts] = useState<CashOut[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sessionInvites, setSessionInvites] = useState<SessionInvite[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [tab, setTab] = useState<SessionTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedInviteUserId, setSelectedInviteUserId] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerStatusFilter, setPlayerStatusFilter] = useState("ALL");
  const [buyInForm, setBuyInForm] = useState({ sessionPlayerId: "", amount: "", note: "", paymentMethod: "CASH" as PaymentMethod });
  const [cashOutForm, setCashOutForm] = useState({ sessionPlayerId: "", cashAmount: "", cardAmount: "" });

  const loadPage = async () => {
    if (!sessionId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [sessionDetails, allUsers, buyInList, cashOutList, inviteResult, connectionList] = await Promise.all([
        getSessionById(sessionId),
        getUsers(),
        getBuyInsForSession(sessionId),
        getCashOutsForSession(sessionId),
        getInvitesForSession(sessionId).catch(() => [] as import("../types/api").SessionInvite[]),
        user ? getAcceptedConnections(user.id) : Promise.resolve([] as Connection[])
      ]);

      setSession(sessionDetails);
      setUsers(allUsers);
      setBuyIns(buyInList);
      setCashOuts(cashOutList);
      setSessionInvites(inviteResult);
      setConnections(connectionList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!sessionId) return;
    try {
      const [sessionDetails, allUsers, buyInList, cashOutList, inviteResult, connectionList] = await Promise.all([
        getSessionById(sessionId),
        getUsers(),
        getBuyInsForSession(sessionId),
        getCashOutsForSession(sessionId),
        getInvitesForSession(sessionId).catch(() => [] as import("../types/api").SessionInvite[]),
        user ? getAcceptedConnections(user.id) : Promise.resolve([] as Connection[])
      ]);
      setSession(sessionDetails);
      setUsers(allUsers);
      setBuyIns(buyInList);
      setCashOuts(cashOutList);
      setSessionInvites(inviteResult);
      setConnections(connectionList);
    } catch {
      // silently ignore poll errors
    }
  };

  useEffect(() => {
    void loadPage();
  }, [sessionId]);

  useEffect(() => {
    if (session?.status !== "LIVE") return;
    const interval = setInterval(() => { void refreshData(); }, 5000);
    return () => clearInterval(interval);
  }, [session?.status, sessionId]);

  const isHost = session?.host?.userId === user?.id;

  const availableUsers = useMemo(() => {
    if (!session) {
      return [];
    }

    const sessionUserIds = new Set(session.players.map((player) => player.userId));
    return users.filter((candidate) => !sessionUserIds.has(candidate.id));
  }, [session, users]);

  const friendIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(connections.map((c) => c.senderId === user.id ? c.recipientId : c.senderId));
  }, [connections, user]);

  const friendsAvailableToAdd = useMemo(() => {
    return availableUsers.filter((u) => friendIds.has(u.id));
  }, [availableUsers, friendIds]);

  const sessionStats = useMemo(() => {
    const totalBuyIns = buyIns.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalCashOuts = cashOuts.reduce((sum, c) => sum + Number(c.amount), 0);
    const cashBuyIns = buyIns.filter((b) => b.paymentMethod === "CASH").reduce((sum, b) => sum + Number(b.amount), 0);
    const cardBuyIns = buyIns.filter((b) => b.paymentMethod === "CARD").reduce((sum, b) => sum + Number(b.amount), 0);
    const cashCashOuts = cashOuts.reduce((sum, c) => sum + Number(c.cashAmount ?? 0), 0);
    const cardCashOuts = cashOuts.reduce((sum, c) => sum + Number(c.cardAmount ?? 0), 0);
    return {
      totalPlayers: session?.players.length ?? 0,
      totalBuyIns,
      paidBuyIns: buyIns
        .filter((b) => b.status === "PAID")
        .reduce((sum, b) => sum + Number(b.amount), 0),
      totalCashOuts,
      moneyOnTable: totalBuyIns - totalCashOuts,
      cashOnTable: cashBuyIns - cashCashOuts,
      cardOnTable: cardBuyIns - cardCashOuts
    };
  }, [buyIns, cashOuts, session?.players.length]);

  const cashOutByPlayer = useMemo(() => {
    return cashOuts
      .filter(co => co.status !== "CANCELLED")
      .reduce<Record<string, number>>((acc, co) => {
        const id = String(co.sessionPlayerId);
        acc[id] = (acc[id] ?? 0) + Number(co.amount ?? 0);
        return acc;
      }, {});
  }, [cashOuts]);

  const playerRows = useMemo(() => {
    if (!session) {
      return [];
    }

    return session.players.map((player) => {
      const playerBuyIns = buyIns.filter((buyIn) => buyIn.sessionPlayerId === player.sessionPlayerId);
      const latestStatus = playerBuyIns[0]?.status ?? "NONE";

      return {
        ...player,
        buyInCount: playerBuyIns.length,
        displayStatus:
          latestStatus === "PAID"
            ? "PAID"
            : latestStatus === "CONFIRMED" || latestStatus === "PENDING"
              ? "PENDING"
              : latestStatus === "DECLINED"
                ? "DECLINED"
                : "NONE"
      };
    });
  }, [buyIns, session]);

  const filteredPlayerRows = useMemo(() => {
    return playerRows.filter((player) => {
      const matchesSearch = player.username.toLowerCase().includes(playerSearch.toLowerCase());
      const matchesStatus =
        playerStatusFilter === "ALL" || player.displayStatus === playerStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [playerRows, playerSearch, playerStatusFilter]);

  const recentActivity = useMemo(() => {
    const buyInActivity = buyIns.map((buyIn) => ({
      parts:
        buyIn.status === "PAID"
          ? [
              { text: buyIn.username, tone: "strong" },
              { text: " completed a ", tone: "muted" },
              { text: formatCurrency(buyIn.amount), tone: "strong" },
              { text: " payment", tone: "muted" }
            ]
          : [
              { text: buyIn.username, tone: "strong" },
              { text: " has a ", tone: "muted" },
              { text: formatCurrency(buyIn.amount), tone: "strong" },
              { text: buyIn.status === "CONFIRMED" ? " payment pending" : " buy-in", tone: "muted" }
            ],
      date: buyIn.paidAt || buyIn.respondedAt || buyIn.createdAt
    }));

    const cashOutActivity = cashOuts.map((cashOut) => ({
      parts:
        cashOut.status === "PAID_OUT"
          ? [
              { text: cashOut.username, tone: "strong" },
              { text: " was paid out ", tone: "muted" },
              { text: formatCurrency(cashOut.amount), tone: "strong" }
            ]
          : [
              { text: cashOut.username, tone: "strong" },
              { text: " has a cash-out of ", tone: "muted" },
              { text: formatCurrency(cashOut.amount), tone: "strong" }
            ],
      date: cashOut.paidOutAt || cashOut.createdAt
    }));

    const joinActivity = (session?.players ?? []).map((player) => ({
      parts: [
        { text: player.username, tone: "strong" },
        { text: " joined the session", tone: "muted" }
      ],
      date: session?.startTime ?? ""
    }));

    return [...buyInActivity, ...cashOutActivity, ...joinActivity]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [buyIns, cashOuts, session]);

  const clearMessages = () => {
    setActionError("");
    setActionSuccess("");
  };

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    clearMessages();
    setBusyKey(key);

    try {
      await action();
      setActionSuccess(successMessage);
      await loadPage();
    } catch (actionFailure) {
      setActionError(getErrorMessage(actionFailure));
    } finally {
      setBusyKey("");
    }
  };

  const handleAddPlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !selectedUserId) {
      return;
    }

    await runAction(
      "add-player",
      async () => {
        await addPlayerToSession(sessionId, { userId: selectedUserId });
        setSelectedUserId("");
      },
      "Player added to session."
    );
  };

  const handleInvitePlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !selectedInviteUserId) {
      return;
    }

    await runAction(
      "invite-player",
      async () => {
        await invitePlayerToSession(sessionId, { userId: selectedInviteUserId });
        setSelectedInviteUserId("");
      },
      "Player invited."
    );
  };

  const handleCreateBuyIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !buyInForm.sessionPlayerId || !buyInForm.amount) {
      return;
    }

    await runAction(
      "create-buyin",
      async () => {
        await createBuyIn(sessionId, {
          sessionPlayerId: buyInForm.sessionPlayerId,
          amount: Number(buyInForm.amount),
          note: buyInForm.note.trim() || undefined,
          paymentMethod: buyInForm.paymentMethod
        });
        setBuyInForm({ sessionPlayerId: "", amount: "", note: "", paymentMethod: "CASH" });
      },
      "Buy-in created."
    );
  };

  const handleCreateCashOut = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !cashOutForm.sessionPlayerId || (!cashOutForm.cashAmount && !cashOutForm.cardAmount)) {
      return;
    }

    await runAction(
      "create-cashout",
      async () => {
        await createCashOut(sessionId, {
          sessionPlayerId: cashOutForm.sessionPlayerId,
          cashAmount: cashOutForm.cashAmount ? Number(cashOutForm.cashAmount) : undefined,
          cardAmount: cashOutForm.cardAmount ? Number(cashOutForm.cardAmount) : undefined
        });
        setCashOutForm({ sessionPlayerId: "", cashAmount: "", cardAmount: "" });
      },
      "Cash-out recorded."
    );
  };

  const handleCompleteSession = async () => {
    if (!sessionId) {
      return;
    }

    const confirmed = window.confirm("End this session and mark it as completed?");
    if (!confirmed) {
      return;
    }

    await runAction(
      "complete-session",
      async () => {
        await completeSession(sessionId);
      },
      "Session marked as completed."
    );
  };

  const handleDeleteSession = async () => {
    if (!sessionId) {
      return;
    }

    const confirmed = window.confirm("Permanently delete this session? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await deleteSession(sessionId);
      navigate("/sessions");
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError));
    }
  };

  if (!sessionId) {
    return <ErrorState message="No session id was provided in the route." />;
  }

  return (
    <section className="panel-card">
      <div className="page-back">
        <Link to="/sessions">← Back to Sessions</Link>
      </div>

      {loading ? <LoadingState>Loading session...</LoadingState> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void loadPage()} /> : null}

          {!loading && !error && session ? (
            <>
              <div className="tab-row">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === tab ? "tab-button active" : "tab-button"}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
                {isHost ? (
                  <button
                    type="button"
                    className={tab === "results" ? "tab-button active" : "tab-button"}
                    onClick={() => setTab("results")}
                  >
                    Results
                  </button>
                ) : null}
              </div>

              <div className="session-header-card">
                <h2>{session.name}</h2>
                <p className="muted-text">
                  Hosted by {session.host.username} • {formatDateTime(session.startTime)}
                </p>
                {!isHost && session.host.paymentLink ? (
                  <a
                    href={session.host.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-outline-primary button-small"
                  >
                    Pay {session.host.username}
                  </a>
                ) : null}
                <StatusBadge value={session.status} />
                {isHost ? (
                  <>
                    <button type="button" className="button button-outline-warning button-small" onClick={handleCompleteSession}>
                      End Session
                    </button>
                    <button type="button" className="button button-outline-danger button-small" onClick={handleDeleteSession}>
                      Delete Session
                    </button>
                  </>
                ) : null}
              </div>

              {actionError ? <p className="form-error">{actionError}</p> : null}
              {actionSuccess ? <p className="form-success">{actionSuccess}</p> : null}

              {tab === "buyins" || tab === "cashouts" ? (
                <div className="stats-grid five-columns">
                  <article className="stat-card">
                    <span>Total Buy-Ins</span>
                    <strong>{formatCurrency(sessionStats.totalBuyIns)}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Paid Amount</span>
                    <strong>{formatCurrency(sessionStats.paidBuyIns)}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Cash on Table</span>
                    <strong>{formatCurrency(sessionStats.cashOnTable)}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Card on Table</span>
                    <strong>{formatCurrency(sessionStats.cardOnTable)}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Total Players</span>
                    <strong>{sessionStats.totalPlayers}</strong>
                  </article>
                </div>
              ) : (
                <div className="stats-grid">
                  <article className="stat-card">
                    <span>Total Players</span>
                    <strong>{sessionStats.totalPlayers}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Host</span>
                    <strong>{session.host.username}</strong>
                  </article>
                </div>
              )}

              {tab === "overview" ? (
                <div className="stack-section">
                  <div className="two-column-grid overview-grid">
                    <article className="section-card">
                      <h3>Session Details</h3>
                      <dl className="details-grid">
                        <div>
                          <dt>Session Name</dt>
                          <dd>{session.name}</dd>
                        </div>
                        <div>
                          <dt>Date</dt>
                          <dd>{formatDateTime(session.startTime)}</dd>
                        </div>
                        <div>
                          <dt>Host</dt>
                          <dd>{session.host.username}</dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>{session.location}</dd>
                        </div>
                        <div>
                          <dt>Notes</dt>
                          <dd>{session.notes || "No notes yet."}</dd>
                        </div>
                      </dl>
                    </article>

                    {isHost ? (
                      <article className="section-card quick-actions-card">
                        <h3>Quick Actions</h3>
                        <p className="section-copy">Manage the session quickly from one place.</p>

                        <div className="quick-actions quick-actions-column">
                          <button type="button" className="button button-secondary action-pill" onClick={() => setTab("players")}>
                            + Add Player
                          </button>
                          <button type="button" className="button button-secondary action-pill" onClick={() => setTab("buyins")}>
                            + Add Buy-In
                          </button>
                          <button type="button" className="button button-secondary action-pill" onClick={() => setTab("players")}>
                            Invite Players
                          </button>
                          <button
                            type="button"
                            className="button button-secondary action-pill"
                            onClick={() => setShowInvites((v) => !v)}
                          >
                            {showInvites ? "Hide Invites" : "View Invites"}
                          </button>
                        </div>
                      </article>
                    ) : null}
                  </div>

                  {isHost && showInvites ? (
                    <article className="section-card">
                      <h3>Pending Invites</h3>
                      <p className="section-copy" style={{ marginBottom: "14px" }}>
                        Users who have been invited but haven't joined yet.
                      </p>
                      {(() => {
                        const pending = sessionInvites.filter((inv) => inv.status === "RECEIVED");
                        if (pending.length === 0) {
                          return <EmptyState title="No pending invites" description="Everyone you invited has already responded." />;
                        }
                        return (
                          <div className="stack-list">
                            {pending.map((inv) => (
                              <div key={inv.inviteId} className="row-card">
                                <div className="player-cell">
                                  <span className="avatar-circle">{getInitials(inv.invitedUsername)}</span>
                                  <div>
                                    <strong>{inv.invitedUsername}</strong>
                                    <p className="helper-text">Invited {formatDateTime(inv.createdAt)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </article>
                  ) : null}

                  <article className="section-card">
                    <h3>Recent Activity</h3>
                    {recentActivity.length === 0 ? (
                      <EmptyState
                        title="No recent activity"
                        description="Buy-ins, cash-outs, and joins will show up here."
                      />
                    ) : (
                      <div className="activity-list">
                        {recentActivity.map((item) => (
                          <div
                            key={`${item.parts.map((part) => part.text).join("")}-${item.date}`}
                            className="activity-row"
                          >
                            <span>
                              {item.parts.map((part, index) => (
                                <span
                                  key={`${part.text}-${index}`}
                                  className={part.tone === "strong" ? "activity-strong" : "activity-muted"}
                                >
                                  {part.text}
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {tab === "players" ? (
                <div className="stack-section">
                  <div className="table-toolbar">
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(event) => setPlayerSearch(event.target.value)}
                      placeholder="Search players by name"
                    />

                    <select
                      value={playerStatusFilter}
                      onChange={(event) => setPlayerStatusFilter(event.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                      <option value="DECLINED">Declined</option>
                      <option value="NONE">No Buy-Ins</option>
                    </select>
                  </div>

                  {isHost ? (
                    <div className="two-column-grid">
                      <article className="section-card">
                        <h3>Add player directly</h3>
                        {friendsAvailableToAdd.length === 0 ? (
                          <p className="helper-text">No friends available to add. Add friends via the Friends page first.</p>
                        ) : (
                          <form className="form-grid compact-form" onSubmit={handleAddPlayer}>
                            <label className="form-field form-field-full">
                              <span>Friend</span>
                              <select
                                value={selectedUserId}
                                onChange={(event) => setSelectedUserId(event.target.value)}
                                required
                              >
                                <option value="">Select friend</option>
                                {friendsAvailableToAdd.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.username} (#{candidate.userCode})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="form-actions form-field-full">
                              <button type="submit" className="button" disabled={busyKey === "add-player"}>
                                Add Player
                              </button>
                            </div>
                          </form>
                        )}
                      </article>

                      <article className="section-card">
                        <h3>Invite player</h3>
                        <form className="form-grid compact-form" onSubmit={handleInvitePlayer}>
                          <label className="form-field form-field-full">
                            <span>User</span>
                            <select
                              value={selectedInviteUserId}
                              onChange={(event) => setSelectedInviteUserId(event.target.value)}
                              required
                            >
                              <option value="">Select user</option>
                              {availableUsers.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.username} (#{candidate.userCode})
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="form-actions form-field-full">
                            <button type="submit" className="button" disabled={busyKey === "invite-player"}>
                              Invite Player
                            </button>
                          </div>
                        </form>
                      </article>
                    </div>
                  ) : null}

                  <article className="section-card">
                    <h3>Players in Session</h3>
                    {filteredPlayerRows.length === 0 ? (
                      <EmptyState title="No players" description="Players will appear here once added." />
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="table-wrap desktop-table">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Player</th>
                                <th>Total Buy-In</th>
                                <th>Number of Buy-Ins</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredPlayerRows.map((player) => {
                                const canRemove = player.role !== "HOST" && (isHost || player.userId === user?.id);
                                const isSelf = player.userId === user?.id;
                                return (
                                  <tr key={player.sessionPlayerId}>
                                    <td>
                                      <div className="player-cell">
                                        <span className="avatar-circle">{getInitials(player.username)}</span>
                                        <span>{player.username}</span>
                                      </div>
                                    </td>
                                    <td>{formatCurrency(player.totalBuyIn)}</td>
                                    <td>{player.buyInCount}</td>
                                    <td><StatusBadge value={player.displayStatus} /></td>
                                    <td>
                                      {canRemove ? (
                                        <button
                                          type="button"
                                          className="button button-secondary"
                                          disabled={busyKey === `remove-${player.userId}`}
                                          onClick={() =>
                                            runAction(
                                              `remove-${player.userId}`,
                                              async () => { await removePlayerFromSession(sessionId, player.userId); },
                                              "Player removed from session."
                                            )
                                          }
                                        >
                                          {isSelf ? "Leave" : "Remove"}
                                        </button>
                                      ) : (
                                        <span className="muted-text">No action</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="mobile-cards">
                          {filteredPlayerRows.map((player) => {
                            const canRemove = player.role !== "HOST" && (isHost || player.userId === user?.id);
                            const isSelf = player.userId === user?.id;
                            return (
                              <div key={player.sessionPlayerId} className="mobile-row-card">
                                <div className="mobile-row-header">
                                  <div className="player-cell">
                                    <span className="avatar-circle">{getInitials(player.username)}</span>
                                    <span>{player.username}</span>
                                  </div>
                                  <span className="mobile-row-amount">{formatCurrency(player.totalBuyIn)}</span>
                                </div>
                                <div className="mobile-row-meta">
                                  <span className="muted-text">{player.buyInCount} buy-in{player.buyInCount !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="mobile-row-badges">
                                  <StatusBadge value={player.displayStatus} />
                                </div>
                                {canRemove ? (
                                  <div className="mobile-row-actions">
                                    <button
                                      type="button"
                                      className="button button-secondary"
                                      disabled={busyKey === `remove-${player.userId}`}
                                      onClick={() =>
                                        runAction(
                                          `remove-${player.userId}`,
                                          async () => { await removePlayerFromSession(sessionId, player.userId); },
                                          "Player removed from session."
                                        )
                                      }
                                    >
                                      {isSelf ? "Leave" : "Remove"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </article>
                </div>
              ) : null}

              {tab === "buyins" ? (
                <div className="stack-section">
                  {(() => {
                    const myBuyIns = buyIns.filter((b) => b.userId === user?.id);
                    if (myBuyIns.length === 0) return null;
                    return (
                      <article className="section-card my-buyins-card">
                        <h3>Your Buy-Ins</h3>
                        <p className="section-copy">Buy-ins assigned to you — accept or decline below.</p>
                        <>
                          <div className="table-wrap desktop-table" style={{ marginTop: "14px" }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Amount</th>
                                  <th>Created</th>
                                  <th>Acceptance</th>
                                  <th>Payment</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {myBuyIns.map((buyIn) => {
                                  const canAccept = buyIn.status === "PENDING";
                                  const canDecline = buyIn.status === "PENDING";
                                  const { acceptanceLabel, acceptanceClass, paymentLabel, paymentClass } = getBuyInStatusParts(buyIn.status);
                                  return (
                                    <tr key={buyIn.id}>
                                      <td>{formatCurrency(buyIn.amount)}</td>
                                      <td>{formatDateTime(buyIn.createdAt)}</td>
                                      <td><span className={`status-badge ${acceptanceClass}`}>{acceptanceLabel}</span></td>
                                      <td>
                                        {paymentLabel && paymentClass
                                          ? <span className={`status-badge ${paymentClass}`}>{paymentLabel}</span>
                                          : <span className="muted-text">—</span>}
                                      </td>
                                      <td>
                                        <div className="inline-actions">
                                          {canAccept ? (
                                            <button
                                              type="button"
                                              className="button"
                                              disabled={busyKey === `buyin-accept-${buyIn.id}`}
                                              onClick={() => runAction(`buyin-accept-${buyIn.id}`, async () => { await acceptBuyIn(buyIn.id); }, "Buy-in accepted.")}
                                            >
                                              Accept
                                            </button>
                                          ) : null}
                                          {canDecline ? (
                                            <button
                                              type="button"
                                              className="button button-danger"
                                              disabled={busyKey === `buyin-decline-${buyIn.id}`}
                                              onClick={() => runAction(`buyin-decline-${buyIn.id}`, async () => { await declineBuyIn(buyIn.id); }, "Buy-in declined.")}
                                            >
                                              Decline
                                            </button>
                                          ) : null}
                                          {!canAccept && !canDecline ? (
                                            <span className="muted-text">No action needed</span>
                                          ) : null}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mobile-cards" style={{ marginTop: "14px" }}>
                            {myBuyIns.map((buyIn) => {
                              const canAccept = buyIn.status === "PENDING";
                              const canDecline = buyIn.status === "PENDING";
                              const { acceptanceLabel, acceptanceClass, paymentLabel, paymentClass } = getBuyInStatusParts(buyIn.status);
                              return (
                                <div key={buyIn.id} className="mobile-row-card">
                                  <div className="mobile-row-header">
                                    <span className="mobile-row-amount">{formatCurrency(buyIn.amount)}</span>
                                  </div>
                                  <div className="mobile-row-meta">
                                    <span className="muted-text">{formatDateTime(buyIn.createdAt)}</span>
                                  </div>
                                  <div className="mobile-row-badges">
                                    <span className={`status-badge ${acceptanceClass}`}>{acceptanceLabel}</span>
                                    {paymentLabel && paymentClass
                                      ? <span className={`status-badge ${paymentClass}`}>{paymentLabel}</span>
                                      : null}
                                  </div>
                                  {(canAccept || canDecline) ? (
                                    <div className="mobile-row-actions">
                                      {canAccept ? (
                                        <button
                                          type="button"
                                          className="button"
                                          disabled={busyKey === `buyin-accept-${buyIn.id}`}
                                          onClick={() => runAction(`buyin-accept-${buyIn.id}`, async () => { await acceptBuyIn(buyIn.id); }, "Buy-in accepted.")}
                                        >
                                          Accept
                                        </button>
                                      ) : null}
                                      {canDecline ? (
                                        <button
                                          type="button"
                                          className="button button-danger"
                                          disabled={busyKey === `buyin-decline-${buyIn.id}`}
                                          onClick={() => runAction(`buyin-decline-${buyIn.id}`, async () => { await declineBuyIn(buyIn.id); }, "Buy-in declined.")}
                                        >
                                          Decline
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      </article>
                    );
                  })()}

                  {isHost ? (
                    <article className="section-card">
                      <h3>Add Buy-In</h3>
                      <form className="form-grid" onSubmit={handleCreateBuyIn}>
                        <label className="form-field">
                          <span>Player</span>
                          <select
                            value={buyInForm.sessionPlayerId}
                            onChange={(event) =>
                              setBuyInForm((current) => ({ ...current, sessionPlayerId: event.target.value }))
                            }
                            required
                          >
                            <option value="">Select player</option>
                            {session.players.map((player) => (
                              <option key={player.sessionPlayerId} value={player.sessionPlayerId}>
                                {player.username}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="form-field">
                          <span>Amount (£)</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={buyInForm.amount}
                            onChange={(event) =>
                              setBuyInForm((current) => ({ ...current, amount: event.target.value }))
                            }
                            required
                          />
                        </label>

                        <div className="form-field">
                          <span>Payment Method</span>
                          <div className="method-toggle">
                            {(["CASH", "CARD"] as PaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                className={buyInForm.paymentMethod === method ? "method-btn active" : "method-btn"}
                                onClick={() => setBuyInForm((current) => ({ ...current, paymentMethod: method }))}
                              >
                                {method === "CASH" ? "Cash" : "Card"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="form-field form-field-full">
                          <span>Notes</span>
                          <textarea
                            rows={3}
                            value={buyInForm.note}
                            onChange={(event) =>
                              setBuyInForm((current) => ({ ...current, note: event.target.value }))
                            }
                            placeholder="Optional note"
                          />
                        </label>

                        <div className="form-actions form-field-full">
                          <button type="submit" className="button" disabled={busyKey === "create-buyin"}>
                            Add Buy-In
                          </button>
                        </div>
                      </form>
                    </article>
                  ) : null}

                  <article className="section-card">
                    <h3>Transaction History</h3>
                    {buyIns.length === 0 ? (
                      <EmptyState
                        title="No buy-ins"
                        description="Create the first buy-in to start tracking payments."
                      />
                    ) : (
                      <>
                        <div className="table-wrap desktop-table">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Player</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Created</th>
                                <th>Acceptance</th>
                                <th>Payment</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {buyIns.map((buyIn) => {
                                const canMarkPaid = isHost && buyIn.status === "CONFIRMED";
                                const canCancel =
                                  isHost &&
                                  buyIn.status !== "PAID" &&
                                  buyIn.status !== "DECLINED" &&
                                  buyIn.status !== "CANCELLED";
                                const { acceptanceLabel, acceptanceClass, paymentLabel, paymentClass } = getBuyInStatusParts(buyIn.status);

                                return (
                                  <tr key={buyIn.id}>
                                    <td>{buyIn.username}</td>
                                    <td>{formatCurrency(buyIn.amount)}</td>
                                    <td>
                                      {buyIn.paymentMethod
                                        ? <span className={`method-badge method-${buyIn.paymentMethod.toLowerCase()}`}>{buyIn.paymentMethod === "CASH" ? "Cash" : "Card"}</span>
                                        : <span className="muted-text">—</span>}
                                    </td>
                                    <td>{formatDateTime(buyIn.createdAt)}</td>
                                    <td><span className={`status-badge ${acceptanceClass}`}>{acceptanceLabel}</span></td>
                                    <td>
                                      {paymentLabel && paymentClass
                                        ? <span className={`status-badge ${paymentClass}`}>{paymentLabel}</span>
                                        : <span className="muted-text">—</span>}
                                    </td>
                                    <td>
                                      <div className="inline-actions">
                                        {canMarkPaid ? (
                                          <button
                                            type="button"
                                            className="button"
                                            disabled={busyKey === `buyin-paid-${buyIn.id}`}
                                            onClick={() =>
                                              runAction(
                                                `buyin-paid-${buyIn.id}`,
                                                async () => { await markBuyInPaid(buyIn.id); },
                                                "Buy-in marked as paid."
                                              )
                                            }
                                          >
                                            Mark Paid
                                          </button>
                                        ) : null}
                                        {canCancel ? (
                                          <button
                                            type="button"
                                            className="button button-secondary"
                                            disabled={busyKey === `buyin-cancel-${buyIn.id}`}
                                            onClick={() =>
                                              runAction(
                                                `buyin-cancel-${buyIn.id}`,
                                                async () => { await cancelBuyIn(buyIn.id); },
                                                "Buy-in cancelled."
                                              )
                                            }
                                          >
                                            Cancel
                                          </button>
                                        ) : null}
                                        {!canMarkPaid && !canCancel ? (
                                          <span className="muted-text">No action</span>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mobile-cards">
                          {buyIns.map((buyIn) => {
                            const canMarkPaid = isHost && buyIn.status === "CONFIRMED";
                            const canCancel =
                              isHost &&
                              buyIn.status !== "PAID" &&
                              buyIn.status !== "DECLINED" &&
                              buyIn.status !== "CANCELLED";
                            const { acceptanceLabel, acceptanceClass, paymentLabel, paymentClass } = getBuyInStatusParts(buyIn.status);
                            return (
                              <div key={buyIn.id} className="mobile-row-card">
                                <div className="mobile-row-header">
                                  <div className="player-cell">
                                    <span className="avatar-circle">{getInitials(buyIn.username)}</span>
                                    <span>{buyIn.username}</span>
                                  </div>
                                  <span className="mobile-row-amount">{formatCurrency(buyIn.amount)}</span>
                                </div>
                                <div className="mobile-row-meta">
                                  <span className="muted-text">{formatDateTime(buyIn.createdAt)}</span>
                                  {buyIn.paymentMethod
                                    ? <span className={`method-badge method-${buyIn.paymentMethod.toLowerCase()}`}>{buyIn.paymentMethod === "CASH" ? "Cash" : "Card"}</span>
                                    : null}
                                </div>
                                <div className="mobile-row-badges">
                                  <span className={`status-badge ${acceptanceClass}`}>{acceptanceLabel}</span>
                                  {paymentLabel && paymentClass
                                    ? <span className={`status-badge ${paymentClass}`}>{paymentLabel}</span>
                                    : null}
                                </div>
                                {(canMarkPaid || canCancel) ? (
                                  <div className="mobile-row-actions">
                                    {canMarkPaid ? (
                                      <button
                                        type="button"
                                        className="button"
                                        disabled={busyKey === `buyin-paid-${buyIn.id}`}
                                        onClick={() => runAction(`buyin-paid-${buyIn.id}`, async () => { await markBuyInPaid(buyIn.id); }, "Buy-in marked as paid.")}
                                      >
                                        Mark Paid
                                      </button>
                                    ) : null}
                                    {canCancel ? (
                                      <button
                                        type="button"
                                        className="button button-secondary"
                                        disabled={busyKey === `buyin-cancel-${buyIn.id}`}
                                        onClick={() => runAction(`buyin-cancel-${buyIn.id}`, async () => { await cancelBuyIn(buyIn.id); }, "Buy-in cancelled.")}
                                      >
                                        Cancel
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </article>
                </div>
              ) : null}

              {tab === "results" && isHost ? (
                <div className="stack-section">
                  <article className="section-card">
                    <h3>Session Results</h3>
                    <p className="section-copy" style={{ marginBottom: "18px" }}>
                      Final buy-in and cash-out totals for every player in this session.
                    </p>
                    <>
                      <div className="table-wrap desktop-table">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>Total Buy-In</th>
                              <th>Total Cash-Out</th>
                              <th>Net Profit / Loss</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...session.players]
                              .sort((a, b) => {
                                const netA = (cashOutByPlayer[String(a.sessionPlayerId)] ?? 0) - Number(a.totalBuyIn ?? 0);
                                const netB = (cashOutByPlayer[String(b.sessionPlayerId)] ?? 0) - Number(b.totalBuyIn ?? 0);
                                return netB - netA;
                              })
                              .map((player) => {
                                const buyIn = Number(player.totalBuyIn ?? 0);
                                const cashOut = cashOutByPlayer[String(player.sessionPlayerId)] ?? 0;
                                const net = cashOut - buyIn;
                                return (
                                  <tr key={player.sessionPlayerId}>
                                    <td>
                                      <div className="player-cell">
                                        <span className="avatar-circle">{getInitials(player.username)}</span>
                                        <span>{player.username}</span>
                                      </div>
                                    </td>
                                    <td>{formatCurrency(buyIn)}</td>
                                    <td>{formatCurrency(cashOut)}</td>
                                    <td>
                                      <span className={net > 0 ? "result-profit" : net < 0 ? "result-loss" : "result-neutral"}>
                                        {net > 0 ? "+" : ""}{formatCurrency(net)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>

                      <div className="mobile-cards">
                        {[...session.players]
                          .sort((a, b) => {
                            const netA = Number(a.totalCashOut ?? 0) - Number(a.totalBuyIn ?? 0);
                            const netB = Number(b.totalCashOut ?? 0) - Number(b.totalBuyIn ?? 0);
                            return netB - netA;
                          })
                          .map((player) => {
                            const buyIn = Number(player.totalBuyIn ?? 0);
                            const cashOut = Number(player.totalCashOut ?? 0);
                            const net = cashOut - buyIn;
                            return (
                              <div key={player.sessionPlayerId} className="mobile-row-card">
                                <div className="mobile-row-header">
                                  <div className="player-cell">
                                    <span className="avatar-circle">{getInitials(player.username)}</span>
                                    <span>{player.username}</span>
                                  </div>
                                  <span className={`mobile-row-amount ${net > 0 ? "result-profit" : net < 0 ? "result-loss" : "result-neutral"}`}>
                                    {net > 0 ? "+" : ""}{formatCurrency(net)}
                                  </span>
                                </div>
                                <div className="mobile-row-meta">
                                  <span className="muted-text">Buy-in: {formatCurrency(buyIn)}</span>
                                  <span className="muted-text">Cash-out: {formatCurrency(cashOut)}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  </article>
                </div>
              ) : null}

              {tab === "cashouts" ? (
                <div className="stack-section">
                  {isHost ? (
                    <article className="section-card">
                      <h3>Create Cash-Out</h3>
                      <form className="form-grid compact-form" onSubmit={handleCreateCashOut}>
                        <label className="form-field">
                          <span>Player</span>
                          <select
                            value={cashOutForm.sessionPlayerId}
                            onChange={(event) =>
                              setCashOutForm((current) => ({
                                ...current,
                                sessionPlayerId: event.target.value
                              }))
                            }
                            required
                          >
                            <option value="">Select player</option>
                            {session.players.map((player) => (
                              <option key={player.sessionPlayerId} value={player.sessionPlayerId}>
                                {player.username}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="form-field">
                          <span>Cash amount (£)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashOutForm.cashAmount}
                            placeholder="0.00"
                            onChange={(event) =>
                              setCashOutForm((current) => ({ ...current, cashAmount: event.target.value }))
                            }
                          />
                        </label>

                        <label className="form-field">
                          <span>Card amount (£)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashOutForm.cardAmount}
                            placeholder="0.00"
                            onChange={(event) =>
                              setCashOutForm((current) => ({ ...current, cardAmount: event.target.value }))
                            }
                          />
                        </label>

                        <div className="form-actions form-field-full">
                          <button type="submit" className="button" disabled={busyKey === "create-cashout"}>
                            Record Cash-Out
                          </button>
                        </div>
                      </form>
                    </article>
                  ) : null}

                  <article className="section-card">
                    <h3>Cash-Outs</h3>
                    {cashOuts.length === 0 ? (
                      <EmptyState
                        title="No cash-outs"
                        description="Record cash-outs here when the session wraps up."
                      />
                    ) : (
                      <>
                        <div className="table-wrap desktop-table">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Player</th>
                                <th>Total</th>
                                <th>Cash</th>
                                <th>Card</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cashOuts.map((cashOut) => {
                                const canMarkPaidOut = isHost && cashOut.status === "RECORDED";
                                const canCancel = isHost && cashOut.status !== "PAID_OUT" && cashOut.status !== "CANCELLED";

                                return (
                                  <tr key={cashOut.id}>
                                    <td>{cashOut.username}</td>
                                    <td>{formatCurrency(cashOut.amount)}</td>
                                    <td>{cashOut.cashAmount ? formatCurrency(cashOut.cashAmount) : <span className="muted-text">—</span>}</td>
                                    <td>{cashOut.cardAmount ? formatCurrency(cashOut.cardAmount) : <span className="muted-text">—</span>}</td>
                                    <td>{formatDateTime(cashOut.createdAt)}</td>
                                    <td><StatusBadge value={cashOut.status} /></td>
                                    <td>
                                      <div className="inline-actions">
                                        {canMarkPaidOut ? (
                                          <button
                                            type="button"
                                            className="button"
                                            disabled={busyKey === `cashout-paid-${cashOut.id}`}
                                            onClick={() =>
                                              runAction(
                                                `cashout-paid-${cashOut.id}`,
                                                async () => { await markCashOutPaidOut(cashOut.id); },
                                                "Cash-out marked as paid out."
                                              )
                                            }
                                          >
                                            Mark Paid Out
                                          </button>
                                        ) : null}
                                        {canCancel ? (
                                          <button
                                            type="button"
                                            className="button button-secondary"
                                            disabled={busyKey === `cashout-cancel-${cashOut.id}`}
                                            onClick={() =>
                                              runAction(
                                                `cashout-cancel-${cashOut.id}`,
                                                async () => { await cancelCashOut(cashOut.id); },
                                                "Cash-out cancelled."
                                              )
                                            }
                                          >
                                            Cancel
                                          </button>
                                        ) : null}
                                        {!canMarkPaidOut && !canCancel ? (
                                          <span className="muted-text">No action</span>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mobile-cards">
                          {cashOuts.map((cashOut) => {
                            const canMarkPaidOut = isHost && cashOut.status === "RECORDED";
                            const canCancel = isHost && cashOut.status !== "PAID_OUT" && cashOut.status !== "CANCELLED";
                            return (
                              <div key={cashOut.id} className="mobile-row-card">
                                <div className="mobile-row-header">
                                  <div className="player-cell">
                                    <span className="avatar-circle">{getInitials(cashOut.username)}</span>
                                    <span>{cashOut.username}</span>
                                  </div>
                                  <span className="mobile-row-amount">{formatCurrency(cashOut.amount)}</span>
                                </div>
                                <div className="mobile-row-meta">
                                  <span className="muted-text">{formatDateTime(cashOut.createdAt)}</span>
                                  {cashOut.cashAmount ? <span className="method-badge method-cash">Cash {formatCurrency(cashOut.cashAmount)}</span> : null}
                                  {cashOut.cardAmount ? <span className="method-badge method-card">Card {formatCurrency(cashOut.cardAmount)}</span> : null}
                                </div>
                                <div className="mobile-row-badges">
                                  <StatusBadge value={cashOut.status} />
                                </div>
                                {(canMarkPaidOut || canCancel) ? (
                                  <div className="mobile-row-actions">
                                    {canMarkPaidOut ? (
                                      <button
                                        type="button"
                                        className="button"
                                        disabled={busyKey === `cashout-paid-${cashOut.id}`}
                                        onClick={() => runAction(`cashout-paid-${cashOut.id}`, async () => { await markCashOutPaidOut(cashOut.id); }, "Cash-out marked as paid out.")}
                                      >
                                        Mark Paid Out
                                      </button>
                                    ) : null}
                                    {canCancel ? (
                                      <button
                                        type="button"
                                        className="button button-secondary"
                                        disabled={busyKey === `cashout-cancel-${cashOut.id}`}
                                        onClick={() => runAction(`cashout-cancel-${cashOut.id}`, async () => { await cancelCashOut(cashOut.id); }, "Cash-out cancelled.")}
                                      >
                                        Cancel
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </article>
                </div>
              ) : null}
            </>
      ) : null}
    </section>
  );
}
