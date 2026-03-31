"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ActiveOrganizerTournament = {
  id: string;
  name: string;
};

type OrganizerWorkspaceContextValue = {
  activeTournament: ActiveOrganizerTournament | null;
  setActiveTournament: (value: ActiveOrganizerTournament | null) => void;
};

const OrganizerWorkspaceContext = createContext<OrganizerWorkspaceContextValue | null>(null);

export function OrganizerWorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeTournament, setActiveTournamentState] =
    useState<ActiveOrganizerTournament | null>(null);

  const setActiveTournament = useCallback((value: ActiveOrganizerTournament | null) => {
    setActiveTournamentState(value);
  }, []);

  const value = useMemo(
    () => ({ activeTournament, setActiveTournament }),
    [activeTournament, setActiveTournament]
  );

  return (
    <OrganizerWorkspaceContext.Provider value={value}>
      {children}
    </OrganizerWorkspaceContext.Provider>
  );
}

export function useOrganizerWorkspace(): OrganizerWorkspaceContextValue {
  const ctx = useContext(OrganizerWorkspaceContext);
  if (!ctx) {
    throw new Error("useOrganizerWorkspace must be used within OrganizerWorkspaceProvider");
  }
  return ctx;
}

/** Registers the current tournament for global organizer UI (sidebar, top bar) until unmount. */
export function OrganizerTournamentScope({
  tournamentId,
  tournamentName,
  children,
}: {
  tournamentId: string;
  tournamentName: string;
  children: ReactNode;
}) {
  const { setActiveTournament } = useOrganizerWorkspace();

  useEffect(() => {
    setActiveTournament({ id: tournamentId, name: tournamentName });
    return () => setActiveTournament(null);
  }, [tournamentId, tournamentName, setActiveTournament]);

  return <>{children}</>;
}
