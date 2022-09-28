import { config, errors, persistence, wrapper } from "@/components";
import { getObjectConfigFromObjectType, getObjectTypeFromId } from "@/graph";
import { FIXED_OBJECT_FIELDS } from "@/graph/common";
import { GraphObject, ObjectType, User } from "@/graph/objects/types";
import { wait } from "@/util/wait";
import { Context } from "@/tracing";
import _ from "lodash";
import { Record } from "runtypes";
import { LocalLockingCache } from "@/api/util/LocalLockingCache";

const extractType = (fieldName: string, record: Record<any, any>): string => {
  return record.fields[fieldName]
    .toString()
    .replace(/Runtype<(.+)>/g, "$1")
    .replace(/(.+)[]/, "array:$1");
};

export interface ACLCache {
  localCache?: LocalLockingCache;
}

export interface VerifyObjectACLPayload {
  object?: GraphObject;
  objectType: ObjectType;
  author?: User;
  roles: string[];
  method: "GET" | "POST" | "PATCH" | "DELETE";
  singleFieldStrategy: "error" | "strip";
  aclMode: "soft" | "hard";
  keys?: string[];
  aclCache?: ACLCache;
}

export interface VerifyEdgeACLPayload {
  src: string | GraphObject;
  aclMode: "soft" | "hard";
  edgeName: string;
  author?: User;
  roles: string[];
  method: "GET" | "POST" | "DELETE";
  aclCache?: ACLCache;
}

export const verifyObjectACL = wrapper(
  { name: "verifyObjectACL", file: __filename },
  async (
    ctx: Context,
    payload: VerifyObjectACLPayload
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
    } = payload;

    if (roles.includes("dev-role")) {
      return object;
    }

    let { aclCache } = payload;

    if (!author) {
      errors.createError(ctx, "ACLDenied", { reason: "no author", author });
      return;
    }

    if (!aclCache) {
      aclCache = {};
    }

    if (!aclCache.localCache) {
      aclCache.localCache = new LocalLockingCache({
        lockRecheckInterval: config.api.virtualsCacheRecheckInterval,
      });
    }

    // Check if the object even has any permissions for the method in its views

    let noPermissionsForMethod = true;

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

    const strippedFields = [];

    let objectKeys: string[] =
      _.without(keys || [], ...FIXED_OBJECT_FIELDS) ||
      Object.keys(objectConfig.fields);

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
      const fieldConfig =
        objectConfig.fields[fieldName] || objectConfig.fields._any;

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

          try {
            ctx.log.info("Role is a virtual", {
              role,
              virtualName,
            });

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

              if (virtual.disallowStrip) {
                errors.createError(ctx, "ACLDenied", {
                  fieldName: `virtual:${virtualName}`,
                  view,
                  fieldConfig,
                  roles,
                  method,
                  reason: `virtual:${virtualName}`,
                });
                return;
              }

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

            const virtualResult = await virtual.execute(ctx, object, {
              author,
              roles,
              method,
              cache: aclCache.localCache,
            });

            ctx.log.info("Executed virtual", { virtualResult, virtualName });

            if (virtualResult) {
              ctx.log.info("Access passes: virtual executed successfully");
              noAccess = false;
              break;
            } else if (virtual.disallowStrip) {
              errors.createError(ctx, "ACLDenied", {
                fieldName: `virtual:${virtualName}`,
                view,
                fieldConfig,
                roles,
                method,
                reason: `virtual:${virtualName}`,
              });
              return;
            }
          } catch (error) {
            // Any errors happened, set to undefiend
            throw error;
          }
        }
      }

      if (
        (noAccess && singleFieldStrategy === "error") ||
        (noAccess && fieldConfig.stripDisallowed)
      ) {
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

export const verifyEdgeACL = wrapper(
  { name: "verifyObjectACL", file: __filename },
  async (ctx: Context, payload: VerifyEdgeACLPayload): Promise<void> => {
    const { src, edgeName, method, roles, aclMode, author } = payload;

    if (roles.includes("dev-role")) {
      return;
    }

    if (!author) {
      errors.createError(ctx, "ACLDenied", { reason: "no author", author });
      return;
    }
    let { aclCache } = payload;

    if (!aclCache) {
      aclCache = {};
    }

    if (!aclCache.localCache) {
      aclCache.localCache = new LocalLockingCache({
        lockRecheckInterval: config.api.virtualsCacheRecheckInterval,
      });
    }

    const id = typeof src === "string" ? src : src.id;
    let object;
    const objectType = await getObjectTypeFromId(ctx, id);
    const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

    const viewName = objectConfig.edges[edgeName].view || "_default";
    const viewRoles = objectConfig.views[viewName][method] || [];

    if (viewRoles.length <= 0) {
      errors.createError(ctx, "ACLDenied", {
        reason: "no permissions for method",
        viewRoles,
      });
      return;
    }

    if (!aclCache) {
      aclCache = {};
    }

    if (!aclCache.localCache) {
      aclCache.localCache = new LocalLockingCache({
        lockRecheckInterval: config.api.virtualsCacheRecheckInterval,
      });
    }

    ctx.log.info("Prepared required parameters and looping over view roles", {
      id,
      objectType,
      viewName,
      viewRoles,
      roles,
    });

    // Check if role is allowed
    if (_.intersection(viewRoles, ["public", "all", ...roles]).length > 0) {
      ctx.log.info("Access passes: found in roles");
      return;
    }

    const virtualsNames = viewRoles
      .filter((role) => role.startsWith("virtual:"))
      .map((role) => role.replace("virtual:", ""));

    let noAccess = true;

    ctx.log.info("Looping over virtuals", { virtualsNames });

    for (const virtualName of virtualsNames) {
      ctx.log.info("Looping over virtual", { virtualName });

      const virtual = objectConfig.virtuals.views[virtualName];

      ctx.log.info("Looping over virtual pre roles", { virtualName });

      // If pre roles aren't allowed, skip to the next item
      if (
        _.intersection(virtual.pre, ["public", "all", ...roles]).length <= 0
      ) {
        ctx.log.info("Role doesn't exist in virtual pre roles", {
          preRoles: virtual.pre,
          roles,
        });
        continue;
      }

      // It passed pre roles, access is softly granted
      if (aclMode === "soft") {
        ctx.log.info(
          "Access passes: ACL mode is soft and roles pre roles passed",
          { aclMode, preRoles: virtual.pre, roles }
        );
        noAccess = false;
        break;
      }

      if (!object) {
        ctx.log.info("Fetching source object", { id });
        object = await persistence.getObject(ctx, id);
      }

      ctx.log.info("Executing virtual", { virtualName, author, roles, object });

      const virtualResult = await virtual.execute(ctx, object, {
        author,
        roles,
        method,
        cache: aclCache.localCache,
      });

      ctx.log.info("Executed virtual", { virtualResult, virtualName });

      if (virtualResult) {
        noAccess = false;
        ctx.log.info("Access passes: virtual executed successfully");
        break;
      }
    }

    if (noAccess) {
      errors.createError(ctx, "ACLDenied", {
        roles,
        edgeName,
        src,
        objectType,
        viewRoles,
      });
    }
  }
);

export const validatePayload = async (
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
