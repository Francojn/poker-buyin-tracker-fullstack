import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateSessionModal from "../components/CreateSessionModal";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import StatusBadge from "../components/StatusBadge";
import { createSession, getSessions } from "../api/sessions";
import type { CreateSessionPayload, SessionDetails } from "../types/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { getErrorMessage } from "../utils/http";

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSessions();
      setSessions(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const totals = useMemo(() => {
    return sessions.reduce(
      (summary, session) => {
        const sessionBuyIns = session.players.reduce(
          (sum, player) => sum + Number(player.totalBuyIn ?? 0),
          0
        );
        summary.totalSessions += 1;
        summary.totalPlayers += session.players.length;
        summary.totalBuyIns += sessionBuyIns;
        return summary;
      },
      { totalSessions: 0, totalPlayers: 0, totalBuyIns: 0 }
    );
  }, [sessions]);

  const handleCreateSession = async (payload: CreateSessionPayload) => {
    setCreating(true);
    setCreateError("");

    try {
      const created = await createSession(payload);
      setIsCreateOpen(false);
      await loadSessions();
      navigate(`/sessions/${created.id}`);
    } catch (submitError) {
      setCreateError(getErrorMessage(submitError));
    } finally {
      setCreating(false);
    }
  };

  const latestSessions = sessions;

  return (
    <>
      <section className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Your poker sessions</h2>
              <p className="section-copy">
                View existing sessions, create a new one, and jump straight into session details.
              </p>
            </div>

            <button type="button" className="button" onClick={() => setIsCreateOpen(true)}>
              Create Session
            </button>
          </div>

          {loading ? <LoadingState>Loading sessions...</LoadingState> : null}
          {!loading && error ? <ErrorState message={error} onRetry={() => void loadSessions()} /> : null}

          {!loading && !error ? (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <span>Total Sessions</span>
                  <strong>{totals.totalSessions}</strong>
                </article>
                <article className="stat-card">
                  <span>Total Buy-Ins Recorded</span>
                  <strong>{formatCurrency(totals.totalBuyIns)}</strong>
                </article>
                <article className="stat-card">
                  <span>Total Players Across Sessions</span>
                  <strong>{totals.totalPlayers}</strong>
                </article>
              </div>

              {sessions.length === 0 ? (
                <EmptyState
                  title="No sessions yet"
                  description="Create your first poker session to start inviting players and recording buy-ins."
                />
              ) : (
                <div className="session-list-grid">
                  {latestSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      className="list-card"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      <div className="list-card-header">
                        <div>
                          <h3>{session.name}</h3>
                          <p>{session.location}</p>
                        </div>
                        <StatusBadge value={session.status} />
                      </div>
                      <p>{formatDateTime(session.startTime)}</p>
                      <p>{session.players.length} player(s)</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
      </section>

      <CreateSessionModal
        open={isCreateOpen}
        loading={creating}
        error={createError}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateError("");
        }}
        onSubmit={handleCreateSession}
      />
    </>
  );
}
