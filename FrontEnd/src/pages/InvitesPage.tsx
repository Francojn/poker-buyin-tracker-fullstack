import { useEffect, useState } from "react";
import { acceptInvite, declineInvite } from "../api/invites";
import { getUserReceivedInvites } from "../api/users";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { SessionInvite } from "../types/api";
import { formatDateTime } from "../utils/formatters";
import { getErrorMessage } from "../utils/http";

export default function InvitesPage() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadInvites = async () => {
    if (!user?.id) {
      setError("No user id is available from login yet. Log in again if needed.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getUserReceivedInvites(user.id);
      setInvites(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvites();
  }, [user?.id]);

  const handleAction = async (inviteId: string, action: () => Promise<unknown>) => {
    setBusyId(inviteId);
    setError("");

    try {
      await action();
      await loadInvites();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Invites</p>
          <h2>Pending session invites</h2>
          <p className="section-copy">
            Accept or decline invites. Accepting adds you to the session in the backend.
          </p>
        </div>
      </div>

      {loading ? <LoadingState>Loading invites...</LoadingState> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void loadInvites()} /> : null}

      {!loading && !error ? (
        invites.length === 0 ? (
          <EmptyState title="No invites" description="Session invites will show up here." />
        ) : (
          <div className="stack-list">
            {invites.map((invite) => (
              <article key={invite.inviteId} className="row-card invite-card">
                <div>
                  <h3>{invite.sessionName}</h3>
                  <p>Invited by {invite.invitedByUsername}</p>
                  <p>{formatDateTime(invite.sessionStartTime)}</p>
                  <p>{invite.sessionLocation}</p>
                </div>

                <div className="row-actions">
                  <StatusBadge value={invite.status} />

                  {invite.status === "RECEIVED" ? (
                    <>
                      <button
                        type="button"
                        className="button"
                        disabled={busyId === invite.inviteId}
                        onClick={() => handleAction(invite.inviteId, () => acceptInvite(invite.inviteId))}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={busyId === invite.inviteId}
                        onClick={() => handleAction(invite.inviteId, () => declineInvite(invite.inviteId))}
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
