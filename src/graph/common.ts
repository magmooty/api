import { persistence } from "@/components";
import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions,
} from "@/graph";
import { AcademicYear, GraphObject, StudyGroup } from "@/graph/objects/types";

export const FIXED_OBJECT_FIELDS = [
  "id",
  "object_type",
  "created_at",
  "updated_at",
  "deleted_at",
];

export const ROLE_GROUP = ["tutor_role"];

export const OwnerViewVirtualExecutor: ObjectViewVirtualExecutor = async (
  object: GraphObject,
  { author }: ObjectViewVirtualExecutorOptions
): Promise<boolean> => {
  return (
    object.id === author.id ||
    object.owner === author.id ||
    object.user === author.id
  );
};

export const SpaceAdminVirtualExecutor: ObjectViewVirtualExecutor = async (
  object: GraphObject,
  { roles }: ObjectViewVirtualExecutorOptions
): Promise<boolean> => {
  const { academic_year, study_group, space: rootSpace } = object;

  if (!rootSpace && !academic_year && !study_group) {
    return false;
  }

  const roleSpaces = roles.map((role) => role.split("|")[2]);

  if (rootSpace && !roleSpaces.includes(rootSpace as string)) {
    return false;
  }

  if (academic_year) {
    const { space } = await persistence.getObject<AcademicYear>(
      null,
      academic_year as string
    );

    if (!roleSpaces.includes(space as string)) {
      return false;
    }
  }

  if (study_group) {
    const { space } = await persistence.getObject<StudyGroup>(
      null,
      academic_year as string
    );

    if (!roleSpaces.includes(space as string)) {
      return false;
    }
  }

  return true;
};
