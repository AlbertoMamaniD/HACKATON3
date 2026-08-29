import { useMemo } from "react";
import {
  useLiveReadingsContext,
  type LecturaEcoAhorro,
} from "../context/LiveReadingsContext";

export type { LecturaEcoAhorro };

export function useLiveReadings(limit?: number) {
  const context = useLiveReadingsContext();

  const slicedRows = useMemo(() => {
    if (!limit || limit >= context.rows.length) {
      return context.rows;
    }
    return context.rows.slice(-limit);
  }, [context.rows, limit]);

  return {
    rows: slicedRows,
    todayRows: context.todayRows,
    latest: context.latest,
    online: context.online,
    loading: context.loading,
    error: context.error,
    refresh: context.refresh,
  };
}
