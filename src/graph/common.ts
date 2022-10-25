import { LocalLockingCache } from "@/api/util/LocalLockingCache";
import { persistence, search, wrapper } from "@/components";
import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions,
} from "@/graph";
import {
  AcademicYear,
  AssistantRole,
  BillableItem,
  Exam,
  GraphObject,
  Space,
  StudyGroup,
} from "@/graph/objects/types";
import { IndexName } from "@/sync/mapping";
import { Context } from "@/tracing";

export const FIXED_OBJECT_FIELDS = [
  "id",
  "object_type",
  "created_at",
  "updated_at",
  "deleted_at",
];

export const ROLE_GROUP = ["tutor_role", "student_role"];

const findSpaceInObject = wrapper(
  { name: "findSpaceInObject", file: __filename },
  async (
    ctx: Context,
    object: GraphObject,
    cache: LocalLockingCache
  ): Promise<string | false> => {
    const {
      academic_year,
      study_group,
      exam,
      billable_item,
      space: rootSpace,
    } = object;

    if (
      !rootSpace &&
      !academic_year &&
      !study_group &&
      !exam &&
      !billable_item
    ) {
      ctx.log.info(
        "No root space object nor study group, academic year, exam or billalble item"
      );
      return false;
    }

    if (rootSpace) {
      ctx.log.info("Found space in root object", { rootSpace });
      return rootSpace;
    }

    if (academic_year) {
      const { space } = await cache.lockAndGet<AcademicYear>(
        ctx,
        academic_year,
        async () =>
          persistence.getObject<AcademicYear>(ctx, academic_year as string)
      );

      ctx.log.info("Found space in academic year", { space, academic_year });

      return space;
    }

    if (study_group) {
      const { academic_year } = await cache.lockAndGet<StudyGroup>(
        ctx,
        study_group,
        async () =>
          persistence.getObject<StudyGroup>(ctx, study_group as string)
      );

      const { space } = await cache.lockAndGet<AcademicYear>(
        ctx,
        academic_year,
        async () =>
          persistence.getObject<AcademicYear>(ctx, academic_year as string)
      );

      ctx.log.info("Found space in study group's academic year", {
        space,
        study_group,
        academic_year,
      });

      return space;
    }

    if (exam) {
      const { academic_year } = await cache.lockAndGet<Exam>(
        ctx,
        exam,
        async () => persistence.getObject<Exam>(ctx, exam as string)
      );

      const { space } = await cache.lockAndGet<AcademicYear>(
        ctx,
        academic_year,
        async () =>
          persistence.getObject<AcademicYear>(ctx, academic_year as string)
      );

      ctx.log.info("Found space in exam's academic year", {
        space,
        exam,
        academic_year,
      });

      return space;
    }

    if (billable_item) {
      const { academic_year } = await cache.lockAndGet<BillableItem>(
        ctx,
        billable_item,
        async () =>
          persistence.getObject<BillableItem>(ctx, billable_item as string)
      );

      const { space } = await cache.lockAndGet<AcademicYear>(
        ctx,
        academic_year,
        async () =>
          persistence.getObject<AcademicYear>(ctx, academic_year as string)
      );

      ctx.log.info("Found space in billable item's academic year", {
        space,
        billable_item,
        academic_year,
      });

      return space;
    }

    ctx.log.info("Couldn't find a parent space for the object");

    return false;
  }
);

export const OwnerViewVirtualExecutor: ObjectViewVirtualExecutor = wrapper(
  { name: "OwnerViewVirtualExecutor", file: __filename },
  async (
    ctx: Context,
    object: GraphObject,
    { author }: ObjectViewVirtualExecutorOptions
  ): Promise<boolean> => {
    return (
      object.id === author.id ||
      object.owner === author.id ||
      object.user === author.id
    );
  }
);

export const SpaceAdminVirtualExecutor: ObjectViewVirtualExecutor = wrapper(
  { name: "SpaceAdminVirtualExecutor", file: __filename },
  async (
    ctx: Context,
    object: GraphObject,
    { roles, cache }: ObjectViewVirtualExecutorOptions
  ): Promise<boolean> => {
    const space = await findSpaceInObject(ctx, object, cache);

    const roleSpaces = roles.map((role) => role.split("|")[2]);

    if (space && roleSpaces.includes(space as string)) {
      ctx.log.info("Access granted", { space });
      return true;
    }

    ctx.log.info("Access denied", { space });
    return false;
  }
);

export const SpaceOwnerVirtualExecutor: ObjectViewVirtualExecutor = wrapper(
  { name: "SpaceOwnerVirtualExecutor", file: __filename },
  async (
    ctx: Context,
    object: GraphObject,
    { author, cache }: ObjectViewVirtualExecutorOptions
  ): Promise<boolean> => {
    const { space: spaceId } = object;

    if (!spaceId) {
      return false;
    }

    const space = await cache.lockAndGet<Space>(ctx, spaceId, async () =>
      persistence.getObject<Space>(ctx, spaceId as string)
    );

    if (space.owner === author.id) {
      return true;
    }

    return false;
  }
);

export const SpaceMemberVirtualExecutor: ObjectViewVirtualExecutor = wrapper(
  { name: "SpaceMemberVirtualExecutor", file: __filename },
  async (
    ctx: Context,
    object: GraphObject,
    { author, cache }: ObjectViewVirtualExecutorOptions
  ): Promise<boolean> => {
    const space = await findSpaceInObject(ctx, object, cache);

    if (!space) {
      ctx.log.info("Access denied");
      return false;
    }

    const { results, count } = await search.leanSearch(
      ctx,
      ROLE_GROUP as IndexName[],
      {
        filters: {
          and: [{ user: author.id }, { space }],
        },
      }
    );

    ctx.log.info("Role search results", { results, count });

    if (count > 0) {
      return true;
    }

    ctx.log.info("No roles for the user found in this space");

    return false;
  }
);
