import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getUsers } from "../api/users";
import {
  acceptConnection,
  cancelConnectionRequest,
  declineConnection,
  getAcceptedConnections,
  getPendingConnections,
  removeConnection,
  sendConnectionRequest
} from "../api/connections";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { Connection, User } from "../types/api";
import { formatDateTime } from "../utils/formatters";
import { getErrorMessage } from "../utils/http";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadPage = async () => {
    if (!user?.id) {
      setError("No user id is available from login yet. Log in again if needed.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [accepted, pending, allUsers] = await Promise.all([
        getAcceptedConnections(user.id),
        getPendingConnections(user.id),
        getUsers()
      ]);

      setAcceptedConnections(accepted);
      setPendingConnections(pending);
      setUsers(allUsers);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, [user?.id]);

  const availableUsers = useMemo(
    () => users.filter((candidate) => candidate.id !== user?.id),
    [users, user?.id]
  );

  const handleSendRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id || !selectedRecipientId) {
      return;
    }

    setSending(true);
    setActionError("");

    try {
      // Backend currently expects senderId in the request body.
      await sendConnectionRequest({
        senderId: user.id,
        recipientId: selectedRecipientId
      });
      setSelectedRecipientId("");
      await loadPage();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError));
    } finally {
      setSending(false);
    }
  };

  const runAction = async (connectionId: string, action: () => Promise<unknown>) => {
    setBusyId(connectionId);
    setActionError("");

    try {
      await action();
      await loadPage();
    } catch (runError) {
      setActionError(getErrorMessage(runError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Connections</p>
          <h2>Manage your poker network</h2>
        </div>
      </div>

      {loading ? <LoadingState>Loading connections...</LoadingState> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void loadPage()} /> : null}

      {!loading && !error ? (
        <>
          <div className="two-column-grid">
            <article className="section-card">
              <h3>Send friend request</h3>
              <form className="form-grid compact-form" onSubmit={handleSendRequest}>
                <label className="form-field form-field-full">
                  <span>Select user</span>
                  <select
                    value={selectedRecipientId}
                    onChange={(event) => setSelectedRecipientId(event.target.value)}
                    required
                  >
                    <option value="">Choose a user</option>
                    {availableUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.username} ({candidate.email})
                      </option>
                    ))}
                  </select>
                </label>

                {actionError ? <p className="form-error form-field-full">{actionError}</p> : null}

                <div className="form-actions form-field-full">
                  <button type="submit" className="button" disabled={sending || !selectedRecipientId}>
                    {sending ? "Sending..." : "Send request"}
                  </button>
                </div>
              </form>
            </article>

            <article className="section-card">
              <h3>Pending requests</h3>
              {pendingConnections.length === 0 ? (
                <EmptyState title="No pending requests" />
              ) : (
                <div className="stack-list">
                  {pendingConnections.map((connection) => (
                    <div key={connection.id} className="row-card connection-row">
                      <div>
                        <strong>{connection.senderUsername}</strong>
                        <p className="helper-text">{formatDateTime(connection.createdAt)}</p>
                      </div>
                      <div className="row-actions">
                        <StatusBadge value={connection.status} />
                        <button
                          type="button"
                          className="button button-small button-xs"
                          disabled={busyId === connection.id}
                          onClick={() => runAction(connection.id, () => acceptConnection(connection.id))}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-xs"
                          disabled={busyId === connection.id}
                          onClick={() => runAction(connection.id, () => declineConnection(connection.id))}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <article className="section-card">
            <h3>Accepted connections</h3>
            {acceptedConnections.length === 0 ? (
              <EmptyState title="No accepted connections" />
            ) : (
              <div className="stack-list">
                {acceptedConnections.map((connection) => {
                  const otherName =
                    connection.senderId === user?.id
                      ? connection.recipientUsername
                      : connection.senderUsername;

                  return (
                    <div key={connection.id} className="row-card connection-row">
                      <strong>{otherName}</strong>
                      <div className="row-actions">
                        <StatusBadge value={connection.status} />
                        {confirmRemoveId === connection.id ? (
                          <>
                            <span className="muted-text" style={{ fontSize: "0.8rem" }}>Sure?</span>
                            <button
                              type="button"
                              className="button button-danger button-small button-xs"
                              disabled={busyId === connection.id}
                              onClick={() => {
                                setConfirmRemoveId(null);
                                void runAction(connection.id, () => removeConnection(connection.id));
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="button button-secondary button-small button-xs"
                              onClick={() => setConfirmRemoveId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="button button-secondary button-small button-xs"
                            disabled={busyId === connection.id}
                            onClick={() => setConfirmRemoveId(connection.id)}
                          >
                            Remove
                          </button>
                        )}
                        {connection.senderId === user?.id && connection.status === "RECEIVED" ? (
                          <button
                            type="button"
                            className="button button-secondary button-small button-xs"
                            disabled={busyId === connection.id}
                            onClick={() =>
                              runAction(connection.id, () => cancelConnectionRequest(connection.id))
                            }
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </>
      ) : null}
    </section>
  );
}
