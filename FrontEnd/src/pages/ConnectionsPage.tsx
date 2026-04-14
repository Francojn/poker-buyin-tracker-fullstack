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
          <p className="section-copy">
            Send connection requests and respond to incoming requests so inviting players is easier.
          </p>
        </div>
      </div>

      {loading ? <LoadingState>Loading connections...</LoadingState> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void loadPage()} /> : null}

      {!loading && !error ? (
        <>
          <div className="two-column-grid">
            <article className="section-card">
              <h3>Send connection request</h3>
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
                <EmptyState
                  title="No pending requests"
                  description="Incoming connection requests will appear here."
                />
              ) : (
                <div className="stack-list">
                  {pendingConnections.map((connection) => (
                    <div key={connection.id} className="row-card">
                      <div>
                        <strong>{connection.senderUsername}</strong>
                        <p>{formatDateTime(connection.createdAt)}</p>
                      </div>
                      <div className="row-actions">
                        <StatusBadge value={connection.status} />
                        <button
                          type="button"
                          className="button"
                          disabled={busyId === connection.id}
                          onClick={() => runAction(connection.id, () => acceptConnection(connection.id))}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
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
              <EmptyState
                title="No accepted connections"
                description="Once a request is accepted, it will appear here."
              />
            ) : (
              <div className="stack-list">
                {acceptedConnections.map((connection) => {
                  const otherName =
                    connection.senderId === user?.id
                      ? connection.recipientUsername
                      : connection.senderUsername;

                  return (
                    <div key={connection.id} className="row-card">
                      <div>
                        <strong>{otherName}</strong>
                        <p>Accepted connection</p>
                      </div>
                      <div className="row-actions">
                        <StatusBadge value={connection.status} />
                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={busyId === connection.id}
                          onClick={() => runAction(connection.id, () => removeConnection(connection.id))}
                        >
                          Remove
                        </button>
                        {connection.senderId === user?.id && connection.status === "RECEIVED" ? (
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={busyId === connection.id}
                            onClick={() =>
                              runAction(connection.id, () => cancelConnectionRequest(connection.id))
                            }
                          >
                            Cancel request
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
