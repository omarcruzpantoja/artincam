import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

const LS_APPLIED_FILTER_KEY = "artincam:appliedFilter";

type StoredAppliedFilter = {
  agentId: string;
  startDate: string | null; // "YYYY-MM-DD" interpreted as UTC date
  endDate: string | null; // "YYYY-MM-DD" interpreted as UTC date
};

export type AppliedFilter = {
  agentId: string;
  start: Date | null; // UTC start-of-day
  end: Date | null; // UTC end-of-day
};

export type FilterContextValue = {
  applied: AppliedFilter;
  draft: { start: Date | null; end: Date | null };

  setAgentId: (agentId: string) => void;

  setDraftStartDate: (yyyyMmDd: string | null) => void;
  setDraftEndDate: (yyyyMmDd: string | null) => void;

  apply: () => void;
  clearDraft: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

// ---- UTC helpers ----

function startOfDayUTCFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfDayUTCFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

function ymdFromUTCDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function safeParseStored(raw: string | null): StoredAppliedFilter | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<StoredAppliedFilter>;
    return {
      agentId: typeof obj.agentId === "string" ? obj.agentId : "",
      startDate: typeof obj.startDate === "string" ? obj.startDate : null,
      endDate: typeof obj.endDate === "string" ? obj.endDate : null,
    };
  } catch {
    return null;
  }
}

export const FilterProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const restored = safeParseStored(localStorage.getItem(LS_APPLIED_FILTER_KEY));

  const initialApplied: AppliedFilter = {
    agentId: restored?.agentId ?? "",
    start: restored?.startDate
      ? startOfDayUTCFromYMD(restored.startDate)
      : null,
    end: restored?.endDate ? endOfDayUTCFromYMD(restored.endDate) : null,
  };

  const [applied, setApplied] = useState<AppliedFilter>(initialApplied);

  // draft begins as applied (already UTC)
  const [draftStart, setDraftStartState] = useState<Date | null>(
    initialApplied.start,
  );
  const [draftEnd, setDraftEndState] = useState<Date | null>(
    initialApplied.end,
  );

  const value = useMemo<FilterContextValue>(
    () => ({
      applied,
      draft: { start: draftStart, end: draftEnd },

      setAgentId: (agentId) => setApplied((prev) => ({ ...prev, agentId })),

      setDraftStartDate: (ymd) =>
        setDraftStartState(ymd ? startOfDayUTCFromYMD(ymd) : null),

      setDraftEndDate: (ymd) =>
        setDraftEndState(ymd ? endOfDayUTCFromYMD(ymd) : null),

      apply: () => {
        const next: AppliedFilter = {
          agentId: applied.agentId,
          start: draftStart,
          end: draftEnd,
        };

        setApplied(next);

        const stored: StoredAppliedFilter = {
          agentId: next.agentId,
          startDate: next.start ? ymdFromUTCDate(next.start) : null,
          endDate: next.end ? ymdFromUTCDate(next.end) : null,
        };

        localStorage.setItem(LS_APPLIED_FILTER_KEY, JSON.stringify(stored));
      },

      clearDraft: () => {
        setDraftStartState(null);
        setDraftEndState(null);
      },
    }),
    [applied, draftStart, draftEnd],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within a FilterProvider");
  return ctx;
}
