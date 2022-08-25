import { errors } from "@/components";
import { Context } from "@/tracing";
import { Record } from "runtypes";

const extractType = (fieldName: string, record: Record<any, any>): string => {
  return record.fields[fieldName]
    .toString()
    .replace(/Runtype<(.+)>/g, "$1")
    .replace(/(.+)[]/, "array:$1");
};

export const validateRequestBody = async (
  ctx: Context,
  body: any,
  record: Record<any, any>
): Promise<boolean> => {
  try {
    record.check(body);
    return true;
  } catch (error: any) {
    if (error.details) {
      const keys = Object.keys(error.details);

      const fieldName = keys[0];
      const fieldType = extractType(keys[0], record);

      if (!body[fieldName]) {
        errors.createError(ctx, "ValidationErrorRequiredField", {
          fieldName,
          fieldType,
        });
        return false;
      }

      errors.createError(ctx, "ValidationErrorBadDataType", {
        fieldName,
        fieldType,
      });
      return false;
    } else {
      throw error;
    }
  }
};
