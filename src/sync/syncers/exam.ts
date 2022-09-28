import { persistence, wrapper } from "@/components";
import { AcademicYear, Exam, ExamIndexMapping } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { IndexName } from "@/sync/mapping";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { Context } from "@/tracing";
import _ from "lodash";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "exam";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: Exam
  ): Promise<SyncOperation[]> => {
    const { name, academic_year, time_table, updated_at } = object;

    const { space } = await persistence.getObject<AcademicYear>(
      ctx,
      academic_year
    );

    let min_date = null;
    let max_date = null;

    if (time_table && time_table.length > 0) {
      min_date =
        _.minBy(time_table, (timeTableEntry) => timeTableEntry.date)?.date ||
        null;
      max_date =
        _.maxBy(time_table, (timeTableEntry) => timeTableEntry.date)?.date ||
        null;
    }

    const has_no_date = !min_date && !max_date;

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          name,
          space,
          academic_year,
          has_no_date,
          min_date,
          max_date,
          updated_at,
        },
      },
    ];
  }
);

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Exam>
  ): Promise<SyncOperation<ExamIndexMapping>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalGenerator(ctx, "create", event.current);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Exam>
  ): Promise<SyncOperation<ExamIndexMapping>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalGenerator(ctx, "create", event.current);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Exam>
  ): Promise<SyncOperation<ExamIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
