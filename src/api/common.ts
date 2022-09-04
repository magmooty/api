import { errors, wrapper } from "@/components";
import {
  getObjectConfigFromObjectType,
  ObjectView,
  ObjectViewVirtual,
} from "@/graph";
import { GraphObject, ObjectType, User } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { Record } from "runtypes";
import _ from "lodash";
import { FIXED_OBJECT_FIELDS } from "@/graph/common";

const extractType = (fieldName: string, record: Record<any, any>): string => {
  return record.fields[fieldName]
    .toString()
    .replace(/Runtype<(.+)>/g, "$1")
    .replace(/(.+)[]/, "array:$1");
};

export interface VerifyACLPayload {
  object?: GraphObject;
  objectType: ObjectType;
  author?: User;
  roles: string[];
  method: "GET" | "POST" | "PATCH" | "DELETE";
  singleFieldStrategy: "error" | "strip";
  aclMode: "soft" | "hard";
  keys?: string[];
  aclCache?: { [key: string]: boolean };
}

export const verifyObjectACL = wrapper(
  { name: "verifyObjectACL", file: __filename },
  async (
    ctx: Context,
    payload: VerifyACLPayload
  ): Promise<void | GraphObject | Pick<GraphObject, string>> => {
    ctx.register(payload);

    const { objectType } = payload;

    ctx.log.info("Getting object config for object type", { objectType });

    const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

    const {
      object,
      author,
      roles,
      method,
      singleFieldStrategy,
      aclMode,
      keys,
      aclCache,
    } = payload;

    if (!author) {
      errors.createError(ctx, "ACLDenied", { reason: "no author", author });
      return;
    }

    // Check if the object even has any permissions for the method in its views

    let noPermissionsForMethod = true;

    ctx.log.info("Looping through views");

    for (const viewName of Object.keys(objectConfig.views)) {
      const viewRoles = (objectConfig.views[viewName] as any)[
        method
      ] as string[];

      const viewRolesHaveVirtuals = viewRoles.some((role) =>
        role.startsWith("virtual:")
      );

      ctx.log.info("Looping over view", {
        viewName,
        viewRoles,
        viewRolesHaveVirtuals,
      });

      // User might be able to fetch the object if the roles match or if there are virtuals that need execution

      if (
        viewRoles.length > 0 &&
        (_.intersection(viewRoles, roles).length > 0 ||
          viewRolesHaveVirtuals ||
          viewRoles.includes("public") ||
          viewRoles.includes("all"))
      ) {
        noPermissionsForMethod = false;
      }
    }

    if (noPermissionsForMethod) {
      errors.createError(ctx, "ACLDenied", {
        reason: "no permissions for method",
        roles,
        objectType,
        method,
      });
      return;
    }

    // No need to check fields if access is optional anyway (strip)
    if (aclMode === "soft" && singleFieldStrategy === "strip") {
      ctx.log.info(
        "ACL mode is soft and single field strategy is strip so no need to check fields one by one",
        { aclMode, singleFieldStrategy }
      );
      return;
    }

    const virtualsCache: any = aclCache || {};
    const strippedFields = [];

    let objectKeys: string[] = keys || Object.keys(objectConfig.fields);

    if (object && (!keys || keys?.length <= 0)) {
      objectKeys = _.without(Object.keys(object), ...FIXED_OBJECT_FIELDS);
    }

    // Loop over fields in the supplied object and check each field's ACL on its own

    ctx.log.info("Looping over fields", { objectKeys, keys, object });

    for (const fieldName of objectKeys) {
      if (
        method === "PATCH" &&
        [
          "id",
          "object_type",
          "created_at",
          "updated_at",
          "deleted_at",
        ].includes(fieldName)
      ) {
        errors.createError(ctx, "FieldUneditable", { fieldName });
        return;
      }

      // Find the field config and current method's view

      const fieldConfig = objectConfig.fields[fieldName];
      const view = fieldConfig.view
        ? objectConfig.views[fieldConfig.view]
        : objectConfig.views._default;

      ctx.log.info("Looping over field", { fieldName, fieldConfig, view });

      let noAccess = true;

      // Loop over each role in the view's method
      // Keep in mind that ACL checks work as an OR operand
      // If only one role checks out, then ACL will be verified

      for (const role of (view as any)[method] as string[]) {
        ctx.log.info("Looping over role", { role });

        // Allowed roles
        if (["public", "all"].includes(role)) {
          ctx.log.info(
            "Access passes: view is allowed because it's public or all",
            { role }
          );
          noAccess = false;
          break;
        }

        // Role exists in ACL
        if (roles.includes(role)) {
          ctx.log.info("Access passes: role exists in view method roles", {
            roles,
            role,
          });
          noAccess = false;
          break;
        }

        // Run view virtuals

        if (role.startsWith("virtual:")) {
          const virtualName = role.slice("virtual:".length);

          const virtualCachedValue = virtualsCache[virtualName];

          ctx.log.info("Role is a virtual, checking virtuals cache", {
            role,
            virtualName,
            virtualCachedValue,
          });

          // Virtual has already been executed before with the pre roles and the executor
          if (virtualCachedValue === true) {
            ctx.log.info("Access passes: virtual has been executed before");
            noAccess = false;
            if (aclMode === "soft") {
              virtualsCache[virtualName] = true;
            }
            break;
          }

          const virtual = objectConfig.virtuals.views[virtualName];

          const intersection = _.intersection(virtual.pre, roles);

          if (
            intersection.length <= 0 &&
            !virtual.pre.includes("all") &&
            !virtual.pre.includes("public")
          ) {
            // Pre roles failed, no need to execute the virtual, skip to the next ACL view role
            ctx.log.info("Checking pre roles for virtual failed", {
              intersection,
              virtualName,
              role,
              pre: virtual.pre,
              roles,
            });
            continue;
          }

          if (aclMode === "soft") {
            // If ACL mode is soft, then we don't have data and virtuals shouldn't be executed
            ctx.log.info(
              "Access passes: ACL mode is soft, no need to execute virtuals",
              {
                aclMode,
                object,
              }
            );
            noAccess = false;
            continue;
          }

          if (!object) {
            ctx.log.warn("ACL mode is hard, but no supplied object", {
              aclMode,
              object,
            });
            errors.createError(ctx, "ACLDenied", {
              object,
              aclMode,
              reason: "no supplied object for hard acl",
            });
            return;
          }

          ctx.log.info("Executing virtual", { virtualName });

          const virtualResult = await virtual.execute(object, author);

          ctx.log.info("Executed virtual", { virtualResult, virtualName });

          if (virtualResult) {
            ctx.log.info("Access passes: virtual executed successfully");
            noAccess = false;
            virtualsCache[virtualName] = virtualResult;
            break;
          }
        }
      }

      if (noAccess && singleFieldStrategy === "error") {
        errors.createError(ctx, "ACLDenied", {
          fieldName,
          view,
          fieldConfig,
          roles,
          method,
          reason: fieldName,
        });
      }

      if (noAccess && singleFieldStrategy === "strip") {
        strippedFields.push(fieldName);
      }

      ctx.log.info("ACL field result", { fieldName, noAccess });
    }

    if (singleFieldStrategy === "strip" && object) {
      ctx.log.info("ACL strip result", { strippedFields });
      return _.omit(object, strippedFields);
    }
  }
);

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
