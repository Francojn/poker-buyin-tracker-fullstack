import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { getBuyInsForSession } from "../api/buyIns";
import { getPendingConnections } from "../api/connections";
import { getSessions } from "../api/sessions";
import { getUserReceivedInvites } from "../api/users";
import { useAuth } from "./AuthContext";

interface NotificationCounts {
  friends: number;
  invites: number;
  buyIns: number;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationCounts>({
  friends: 0,
  invites: 0,
  buyIns: 0,
  refresh: () => {}
});

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState(0);
  const [invites, setInvites] = useState(0);
  const [buyIns, setBuyIns] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setFriends(0);
      setInvites(0);
      setBuyIns(0);
      return;
    }

    try {
      const [pendingConnections, receivedInvites, sessions] = await Promise.all([
        getPendingConnections(user.id).catch(() => []),
        getUserReceivedInvites(user.id).catch(() => []),
        getSessions().catch(() => [])
      ]);

      // Incoming friend requests the user hasn't acted on
      setFriends(
        pendingConnections.filter(
          (c) => c.recipientId === user.id && c.status === "RECEIVED"
        ).length
      );

      // Pending session invites
      setInvites(receivedInvites.filter((i) => i.status === "RECEIVED").length);

      // Pending buy-ins across all live sessions
      const liveSessions = sessions.filter((s) => s.status === "LIVE");
      const allBuyIns = await Promise.all(
        liveSessions.map((s) => getBuyInsForSession(s.id).catch(() => []))
      );
      setBuyIns(
        allBuyIns
          .flat()
          .filter((b) => b.userId === user.id && b.status === "PENDING").length
      );
    } catch {
      // Silently fail — badges just won't update
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    void fetchCounts();
    const interval = setInterval(() => void fetchCounts(), 60_000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return (
    <NotificationContext.Provider value={{ friends, invites, buyIns, refresh: fetchCounts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
