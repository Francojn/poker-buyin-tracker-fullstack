import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  acceptBuyIn,
  cancelBuyIn,
  createBuyIn,
  declineBuyIn,
  getBuyInsForSession,
  markBuyInPaid
} from "../api/buyIns";
import {
  cancelCashOut,
  createCashOut,
  getCashOutsForSession,
  markCashOutPaidOut
} from "../api/cashOuts";
import {
  addPlayerToSession,
  completeSession,
  getSessionById,
  invitePlayerToSession,
  removePlayerFromSession
} from "../api/sessions";
import { getUsers } from "../api/users";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { BuyIn, CashOut, SessionDetails, User } from "../types/api";
import { formatCurrency, formatDateTime, getInitials } from "../utils/formatters";
import { getErrorMessage } from "../utils/http";

type SessionTab = "overview" | "players" | "buyins" | "cashouts";

const tabs: Array<{ id: SessionTab; label: string }> = [
  { id: "overview", label: "Session Overview" },
  { id: "players", label: "Player List" },
  { id: "buyins", label: "Buy-Ins" },
  { id: "cashouts", label: "Cash-Outs" }
];

export default function SessionDetailsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [buyIns, setBuyIns] = useState<BuyIn[]>([]);
  const [cashOuts, setCashOuts] = useState<CashOut[]>([]);
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
  const [buyInForm, setBuyInForm] = useState({ sessionPlayerId: "", amount: "", note: "" });
  const [cashOutForm, setCashOutForm] = useState({ sessionPlayerId: "", amount: "" });

  const loadPage = async () => {
    if (!sessionId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [sessionDetails, allUsers, buyInList, cashOutList] = await Promise.all([
        getSessionById(sessionId),
        getUsers(),
        getBuyInsForSession(sessionId),
        getCashOutsForSession(sessionId)
      ]);

      setSession(sessionDetails);
      setUsers(allUsers);
      setBuyIns(buyInList);
      setCashOuts(cashOutList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, [sessionId]);

  const isHost = session?.host?.userId === user?.id;

  const availableUsers = useMemo(() => {
    if (!session) {
      return [];
    }

    const sessionUserIds = new Set(session.players.map((player) => player.userId));
    return users.filter((candidate) => !sessionUserIds.has(candidate.id));
  }, [session, users]);

  const sessionStats = useMemo(() => {
    return {
      totalPlayers: session?.players.length ?? 0,
      totalBuyIns: buyIns.reduce((sum, buyIn) => sum + Number(buyIn.amount), 0),
      paidBuyIns: buyIns
        .filter((buyIn) => buyIn.status === "PAID")
        .reduce((sum, buyIn) => sum + Number(buyIn.amount), 0),
      pendingBuyIns: buyIns
        .filter((buyIn) => buyIn.status === "PENDING" || buyIn.status === "CONFIRMED")
        .reduce((sum, buyIn) => sum + Number(buyIn.amount), 0),
      totalCashOuts: cashOuts.reduce((sum, cashOut) => sum + Number(cashOut.amount), 0)
    };
  }, [buyIns, cashOuts, session?.players.length]);

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
          note: buyInForm.note.trim() || undefined
        });
        setBuyInForm({ sessionPlayerId: "", amount: "", note: "" });
      },
      "Buy-in created."
    );
  };

  const handleCreateCashOut = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !cashOutForm.sessionPlayerId || !cashOutForm.amount) {
      return;
    }

    await runAction(
      "create-cashout",
      async () => {
        await createCashOut(sessionId, {
          sessionPlayerId: cashOutForm.sessionPlayerId,
          amount: Number(cashOutForm.amount)
        });
        setCashOutForm({ sessionPlayerId: "", amount: "" });
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
              </div>

              <div className="session-header-card">
                <div>
                  <h2>{session.name}</h2>
                  <p>
                    Hosted by {session.host.username} • {formatDateTime(session.startTime)}
                  </p>
                  <StatusBadge value={session.status} />
                </div>

                {isHost ? (
                  <button type="button" className="button" onClick={handleCompleteSession}>
                    End Session
                  </button>
                ) : null}
              </div>

              {actionError ? <p className="form-error">{actionError}</p> : null}
              {actionSuccess ? <p className="form-success">{actionSuccess}</p> : null}

              <div className="stats-grid">
                <article className="stat-card">
                  <span>Total Buy-Ins</span>
                  <strong>{formatCurrency(sessionStats.totalBuyIns)}</strong>
                </article>
                <article className="stat-card">
                  <span>Total Players</span>
                  <strong>{sessionStats.totalPlayers}</strong>
                </article>
                <article className="stat-card">
                  <span>Pending Payments</span>
                  <strong>{formatCurrency(sessionStats.pendingBuyIns)}</strong>
                </article>
                <article className="stat-card">
                  <span>Paid Amount</span>
                  <strong>{formatCurrency(sessionStats.paidBuyIns)}</strong>
                </article>
              </div>

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
                        <Link to="/invites" className="button button-secondary text-center action-pill">
                          View Invites
                        </Link>
                      </div>
                    </article>
                  </div>

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
                  <div className="stats-grid three-columns">
                    <article className="stat-card">
                      <span>Total Players</span>
                      <strong>{session.players.length}</strong>
                    </article>
                    <article className="stat-card">
                      <span>Host</span>
                      <strong>{session.host.username}</strong>
                    </article>
                    <article className="stat-card">
                      <span>Available To Add</span>
                      <strong>{availableUsers.length}</strong>
                    </article>
                  </div>

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
                        <form className="form-grid compact-form" onSubmit={handleAddPlayer}>
                          <label className="form-field form-field-full">
                            <span>User</span>
                            <select
                              value={selectedUserId}
                              onChange={(event) => setSelectedUserId(event.target.value)}
                              required
                            >
                              <option value="">Select user</option>
                              {availableUsers.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.username} ({candidate.email})
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
                                  {candidate.username} ({candidate.email})
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
                      <div className="table-wrap">
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
                                  <td>
                                    <StatusBadge value={player.displayStatus} />
                                  </td>
                                  <td>
                                    {canRemove ? (
                                      <button
                                        type="button"
                                        className="button button-secondary"
                                        disabled={busyKey === `remove-${player.userId}`}
                                        onClick={() =>
                                          runAction(
                                            `remove-${player.userId}`,
                                            async () => {
                                              // TODO: backend controller signature currently looks unusual,
                                              // but the route suggests DELETE /sessions/{sessionId}/players/{userId}.
                                              await removePlayerFromSession(sessionId, player.userId);
                                            },
                                            "Player removed from session."
                                          )
                                        }
                                      >
                                        Remove
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
                    )}
                  </article>
                </div>
              ) : null}

              {tab === "buyins" ? (
                <div className="stack-section">
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
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>Amount</th>
                              <th>Created</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {buyIns.map((buyIn) => {
                              const canAccept = buyIn.userId === user?.id && buyIn.status === "PENDING";
                              const canDecline = buyIn.userId === user?.id && buyIn.status === "PENDING";
                              const canMarkPaid = isHost && buyIn.status === "CONFIRMED";
                              const canCancel =
                                (isHost || buyIn.userId === user?.id) &&
                                buyIn.status !== "PAID" &&
                                buyIn.status !== "DECLINED" &&
                                buyIn.status !== "CANCELLED";

                              return (
                                <tr key={buyIn.id}>
                                  <td>{buyIn.username}</td>
                                  <td>{formatCurrency(buyIn.amount)}</td>
                                  <td>{formatDateTime(buyIn.createdAt)}</td>
                                  <td>
                                    <StatusBadge value={buyIn.status} />
                                  </td>
                                  <td>
                                    <div className="inline-actions">
                                      {canAccept ? (
                                        <button
                                          type="button"
                                          className="button"
                                          disabled={busyKey === `buyin-accept-${buyIn.id}`}
                                          onClick={() =>
                                            runAction(
                                              `buyin-accept-${buyIn.id}`,
                                              async () => {
                                                await acceptBuyIn(buyIn.id);
                                              },
                                              "Buy-in accepted."
                                            )
                                          }
                                        >
                                          Accept
                                        </button>
                                      ) : null}

                                      {canDecline ? (
                                        <button
                                          type="button"
                                          className="button button-secondary"
                                          disabled={busyKey === `buyin-decline-${buyIn.id}`}
                                          onClick={() =>
                                            runAction(
                                              `buyin-decline-${buyIn.id}`,
                                              async () => {
                                                await declineBuyIn(buyIn.id);
                                              },
                                              "Buy-in declined."
                                            )
                                          }
                                        >
                                          Decline
                                        </button>
                                      ) : null}

                                      {canMarkPaid ? (
                                        <button
                                          type="button"
                                          className="button"
                                          disabled={busyKey === `buyin-paid-${buyIn.id}`}
                                          onClick={() =>
                                            runAction(
                                              `buyin-paid-${buyIn.id}`,
                                              async () => {
                                                await markBuyInPaid(buyIn.id);
                                              },
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
                                              async () => {
                                                await cancelBuyIn(buyIn.id);
                                              },
                                              "Buy-in cancelled."
                                            )
                                          }
                                        >
                                          Cancel
                                        </button>
                                      ) : null}

                                      {!canAccept && !canDecline && !canMarkPaid && !canCancel ? (
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
                    )}
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
                          <span>Amount (£)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashOutForm.amount}
                            onChange={(event) =>
                              setCashOutForm((current) => ({ ...current, amount: event.target.value }))
                            }
                            required
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
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>Amount</th>
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
                                  <td>{formatDateTime(cashOut.createdAt)}</td>
                                  <td>
                                    <StatusBadge value={cashOut.status} />
                                  </td>
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
                                              async () => {
                                                await markCashOutPaidOut(cashOut.id);
                                              },
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
                                              async () => {
                                                await cancelCashOut(cashOut.id);
                                              },
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
                    )}
                  </article>
                </div>
              ) : null}
            </>
      ) : null}
    </section>
  );
}
