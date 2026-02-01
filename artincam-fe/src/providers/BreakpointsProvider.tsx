import {
  type Breakpoint,
  type Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

interface BreakpointContextInterface {
  currentBreakpoint: Breakpoint;
  up: (key: Breakpoint | number) => boolean;
  down: (key: Breakpoint | number) => boolean;
  only: (key: Breakpoint | number) => boolean;
  between: (start: Breakpoint | number, end: Breakpoint | number) => boolean;
}

export const BreakpointContext = createContext(
  {} as BreakpointContextInterface,
);

const BreakpointsProvider = ({ children }: PropsWithChildren) => {
  const theme = useTheme();

  // ✅ Hook calls at top-level (Rules of Hooks compliant)
  const isXs = useMediaQuery<Theme>(theme.breakpoints.between("xs", "sm"));
  const isSm = useMediaQuery<Theme>(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery<Theme>(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery<Theme>(theme.breakpoints.between("lg", "xl"));
  const isXl = useMediaQuery<Theme>(theme.breakpoints.up("xl"));

  // Derive the current breakpoint (no extra state/effect needed)
  const currentBreakpoint: Breakpoint = useMemo(() => {
    if (isXl) return "xl";
    if (isLg) return "lg";
    if (isMd) return "md";
    if (isSm) return "sm";
    return "xs";
  }, [isSm, isMd, isLg, isXl]);

  // ✅ Keep your API, but implement via the already-known booleans.
  // Note: because hooks cannot be called dynamically, these only return correct
  // values for the breakpoints we compute above (xs/sm/md/lg/xl).
  const value = useMemo<BreakpointContextInterface>(() => {
    const between = (start: Breakpoint | number, end: Breakpoint | number) => {
      if (typeof start === "number" || typeof end === "number") return false;
      if (start === "xs" && end === "sm") return isXs;
      if (start === "sm" && end === "md") return isSm;
      if (start === "md" && end === "lg") return isMd;
      if (start === "lg" && end === "xl") return isLg;
      return false;
    };

    const up = (key: Breakpoint | number) => {
      if (typeof key === "number") return false;
      if (key === "xl") return isXl;
      if (key === "lg") return isLg || isXl;
      if (key === "md") return isMd || isLg || isXl;
      if (key === "sm") return isSm || isMd || isLg || isXl;
      return true; // xs and up is always true
    };

    const down = (key: Breakpoint | number) => {
      if (typeof key === "number") return false;
      if (key === "xs") return isXs;
      if (key === "sm") return isXs || isSm;
      if (key === "md") return isXs || isSm || isMd;
      if (key === "lg") return isXs || isSm || isMd || isLg;
      return true; // xl and down is always true
    };

    const only = (key: Breakpoint | number) => {
      if (typeof key === "number") return false;
      if (key === "xs") return isXs;
      if (key === "sm") return isSm;
      if (key === "md") return isMd;
      if (key === "lg") return isLg;
      return isXl;
    };

    return {
      currentBreakpoint,
      up,
      down,
      only,
      between,
    };
  }, [currentBreakpoint, isXs, isSm, isMd, isLg, isXl]);

  return (
    <BreakpointContext.Provider value={value}>
      {children}
    </BreakpointContext.Provider>
  );
};

export const useBreakpoints = () => useContext(BreakpointContext);

export default BreakpointsProvider;
