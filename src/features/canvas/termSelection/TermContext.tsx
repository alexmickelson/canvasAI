import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "../../../server/trpc/trpcClient";
import type { CanvasTerm } from "../../../server/services/canvas/canvasCourseService";


interface TermContextType {
  term: CanvasTerm;
}

const TermContext = createContext<TermContextType | undefined>(undefined);

export const useTermContext = () => {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTermContext must be used within TermProvider");
  return ctx;
};

export const TermProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: terms, isLoading } = useSuspenseQuery(
    trpc.canvas.terms.queryOptions()
  );

  const syncMutation = useMutation(
    trpc.canvas.sync.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.courses.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.terms.pathKey(),
        });
      },
    })
  );

  const termFromStorage = terms.find((t) => {
    const stored = localStorage.getItem("selectedTerm");
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      return parsed && parsed.id === t.id;
    } catch {
      console.log("Parse error, clearing term storage");
      localStorage.removeItem("selectedTerm");
      return false;
    }
  });

  const [selectedTerm, setSelectedTermState] = useState<CanvasTerm | undefined>(
    termFromStorage
  );

  const setSelectedTerm = (term: CanvasTerm) => {
    setSelectedTermState(term);
    localStorage.setItem("selectedTerm", JSON.stringify(term));
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading terms...</div>;
  }

  if (!terms.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40">
        <h2 className="mb-4 text-lg font-semibold">No terms found</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? "Syncing..." : "Sync Terms"}
        </button>
        {syncMutation.isError && (
          <div className="text-red-500 mt-2">Error syncing terms</div>
        )}
      </div>
    );
  }

  if (!selectedTerm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40">
        <h2 className="mb-4 text-lg font-semibold">
          Select a term to continue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {terms.map((term) => (
            <button
              key={term.id}
              className={`unstyled bg-slate-800 text-white rounded shadow p-4 
                flex flex-col items-center 
                transition border-2 border-transparent 
                hover:bg-slate-900
                cursor-pointer
              `}
              onClick={() => setSelectedTerm(term)}
            >
              <span className="font-bold text-lg mb-1">{term.name}</span>
              {term.start_at || term.end_at ? (
                <span className="text-xs text-gray-400">
                  {term.start_at
                    ? new Date(term.start_at).toLocaleDateString()
                    : ""}
                  {term.start_at && term.end_at ? " - " : ""}
                  {term.end_at
                    ? new Date(term.end_at).toLocaleDateString()
                    : ""}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TermContext.Provider value={{ term: selectedTerm }}>
      <div className="flex justify-end mb-4">
        <button
          className=""
          onClick={() => {
            setSelectedTermState(undefined);
            localStorage.removeItem("selectedTerm");
          }}
        >
          Select New Term
        </button>
      </div>
      {children}
    </TermContext.Provider>
  );
};
