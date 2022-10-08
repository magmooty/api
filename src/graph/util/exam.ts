import { ExamTimeTable } from "@/graph/objects/types";
import _ from "lodash";

export const examMinDate = (time_table: ExamTimeTable[]): string | null => {
  return (
    _.minBy(time_table, (timeTableEntry) => timeTableEntry.date)?.date || null
  );
};

export const examMaxDate = (time_table: ExamTimeTable[]): string | null => {
  return (
    _.maxBy(time_table, (timeTableEntry) => timeTableEntry.date)?.date || null
  );
};
