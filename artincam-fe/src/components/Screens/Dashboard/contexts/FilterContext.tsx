import React, { createContext, useContext, useMemo, useState } from "react";

const LS_APPLIED_FILTER_KEY = "artincam:appliedFilter";

export type AppliedFilter = {
  agentId: string;
  start: Date | null;
  end: Date | null;
};

export type FilterContextValue = {
  // what children should use
  applied: AppliedFilter;

  // what user is editing
  draft: {
    start: Date | null;
    end: Date | null;
  };

  setAgentId: (agentId: string) => void;

  setDraftStart: (date: Date | null) => void;
  setDraftEnd: (date: Date | null) => void;

  apply: () => void;
  clearDraft: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function safeParseAppliedFilter(raw: string | null): AppliedFilter | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as {
      agentId?: unknown;
      start?: unknown;
      end?: unknown;
    };

    const agentId = typeof obj.agentId === "string" ? obj.agentId : "";
    const start = typeof obj.start === "string" ? new Date(obj.start) : null;
    const end = typeof obj.end === "string" ? new Date(obj.end) : null;

    return {
      agentId,
      start: start && !isNaN(start.getTime()) ? start : null,
      end: end && !isNaN(end.getTime()) ? end : null,
    };
  } catch {
    return null;
  }
}

export const FilterProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // Restore last applied on initial mount
  const restored = safeParseAppliedFilter(
    localStorage.getItem(LS_APPLIED_FILTER_KEY)
  );

  const [applied, setApplied] = useState<AppliedFilter>(
    restored ?? { agentId: "", start: null, end: null }
  );

  // Draft should start as applied (so inputs match current applied state)
  const [draftStart, setDraftStartState] = useState<Date | null>(
    restored?.start ?? null
  );
  const [draftEnd, setDraftEndState] = useState<Date | null>(
    restored?.end ?? null
  );

  const value = useMemo<FilterContextValue>(
    () => ({
      applied,
      draft: { start: draftStart, end: draftEnd },

      setAgentId: (agentId) => {
        // changing agent should not automatically "apply" dates
        // but it should update applied agentId so children know which agent is active
        // (draft dates remain as-is until Apply is pressed)
        setApplied((prev) => ({ ...prev, agentId }));
      },

      setDraftStart: (d) => setDraftStartState(d ? startOfDay(d) : null),
      setDraftEnd: (d) => setDraftEndState(d ? startOfDay(d) : null),

      apply: () => {
        const next: AppliedFilter = {
          agentId: applied.agentId,
          start: draftStart ? startOfDay(draftStart) : null,
          end: draftEnd ? startOfDay(draftEnd) : null,
        };
        setApplied(next);
        localStorage.setItem(
          LS_APPLIED_FILTER_KEY,
          JSON.stringify({
            agentId: next.agentId,
            start: next.start ? next.start.toISOString() : null,
            end: next.end ? next.end.toISOString() : null,
          })
        );
      },

      clearDraft: () => {
        setDraftStartState(null);
        setDraftEndState(null);
      },
    }),
    [applied, draftStart, draftEnd]
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
