import { persistence, wrapper } from "@/components";
import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions,
} from "@/graph";
import {
  AcademicYear,
  GraphObject,
  Space,
  StudyGroup,
} from "@/graph/objects/types";
import { Context } from "@/tracing";

export const FIXED_OBJECT_FIELDS = [
  "id",
  "object_type",
  "created_at",
  "updated_at",
  "deleted_at",
];

export const ROLE_GROUP = ["tutor_role"];

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
    const { academic_year, study_group, space: rootSpace } = object;

    if (!rootSpace && !academic_year && !study_group) {
      ctx.log.info("No root space object nor study group or academic year");
      return false;
    }

    const roleSpaces = roles.map((role) => role.split("|")[2]);

    if (rootSpace && !roleSpaces.includes(rootSpace as string)) {
      ctx.log.info("Root space is not in roles");
      return false;
    }

    if (academic_year) {
      const { space } = await cache.lockAndGet<AcademicYear>(
        ctx,
        academic_year,
        async () =>
          persistence.getObject<AcademicYear>(ctx, academic_year as string)
      );

      if (!roleSpaces.includes(space as string)) {
        ctx.log.info("Academic year's space is not in roles");
        return false;
      }
    }

    if (study_group) {
      const { space } = await cache.lockAndGet<StudyGroup>(
        ctx,
        study_group,
        async () =>
          persistence.getObject<StudyGroup>(ctx, study_group as string)
      );

      if (!roleSpaces.includes(space as string)) {
        ctx.log.info("Study group's space is not in roles");
        return false;
      }
    }

    ctx.log.info("Access granted");
    return true;
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
