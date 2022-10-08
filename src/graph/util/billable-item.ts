import _ from "lodash";
import { BillableItemTimeTable } from "@/graph/objects/types";

export const billableItemMinDate = (
  time_table: BillableItemTimeTable[]
): string | null => {
  return (
    _.minBy(time_table, (timeTableEntry) => timeTableEntry.date_from)
      ?.date_from || null
  );
};

export const billableItemMaxDate = (
  time_table: BillableItemTimeTable[]
): string | null => {
  return (
    _.maxBy(time_table, (timeTableEntry) => timeTableEntry.date_to)?.date_to ||
    null
  );
};
