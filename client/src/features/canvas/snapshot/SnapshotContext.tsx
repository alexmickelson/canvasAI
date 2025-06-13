import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { SyncJob } from "../../../server/services/canvas/canvasSnapshotService";
import { useEffect } from "react";

interface SnapshotContextType {
  selectedSnapshot: SyncJob | undefined;
  setSelectedSnapshot: (snapshot: SyncJob) => void;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(
  undefined
);

export const useSnapshotContext = () => {
  const ctx = useContext(SnapshotContext);
  if (!ctx)
    throw new Error(
      "useSnapshotContext must be used within a SnapshotProvider"
    );
  return ctx;
};

export const SnapshotProvider = ({ children }: { children: ReactNode }) => {
  const trpc = useTRPC();
  const { data: snapshots } = useSuspenseQuery(
    trpc.snapshot.getSnapshots.queryOptions()
  );
  const [selectedSnapshot, setSelectedSnapshot] = useState<
    SyncJob | undefined
  >();

  useEffect(() => {
    if (!selectedSnapshot && snapshots && snapshots.length > 0) {
      const mostRecent = snapshots.reduce((a, b) =>
        new Date(a.started_at) > new Date(b.started_at) ? a : b
      );
      setSelectedSnapshot(mostRecent);
    }
  }, [selectedSnapshot, snapshots]);

  return (
    <SnapshotContext.Provider value={{ selectedSnapshot, setSelectedSnapshot }}>
      {children}
    </SnapshotContext.Provider>
  );
};

