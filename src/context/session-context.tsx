import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "herlens:session";

interface SessionState {
  userId: string;
  isNewUser: boolean;
}

interface SessionContextValue {
  userId: string | null;
  isNewUser: boolean;
  setSession: (userId: string, isNewUser: boolean) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readStored(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (typeof parsed.userId === "string") {
      return { userId: parsed.userId, isNewUser: Boolean(parsed.isNewUser) };
    }
    return null;
  } catch {
    return null;
  }
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SessionState | null>(() => readStored());

  useEffect(() => {
    try {
      if (state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* storage unavailable — ignore */
    }
  }, [state]);

  const setSession = useCallback((userId: string, isNewUser: boolean) => {
    setState({ userId, isNewUser });
  }, []);

  const clearSession = useCallback(() => setState(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      userId: state?.userId ?? null,
      isNewUser: state?.isNewUser ?? false,
      setSession,
      clearSession,
    }),
    [state, setSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
};
