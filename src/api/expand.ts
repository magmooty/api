import { errors, persistence, wrapper } from "@/components";
import { getObjectConfigFromObjectType, getObjectTypeFromId } from "@/graph";
import { GraphObject, User } from "@/graph/objects/types";
import { Context } from "@/tracing";
import Tokenizr from "tokenizr";
import { verifyEdgeACL, verifyObjectACL } from "./common";

const expandLexer = new Tokenizr();

expandLexer.rule(/\{[A-Za-z_,\{]+}+/, (ctx, match) => {
  if (match[0].startsWith("{") && match[0].endsWith("}")) {
    ctx.accept("expand", match[0].slice(1, -1));
  } else {
    ctx.accept("expand", match[0]);
  }
});

expandLexer.rule(/[A-Za-z_]+/, (ctx) => {
  ctx.accept("field");
});

expandLexer.rule(/,/, (ctx) => {
  ctx.ignore();
});

function parseExpandLayer(ctx: Context, expand: string) {
  let tokens = [];

  try {
    expandLexer.input(expand);
    tokens = expandLexer.tokens();
  } catch {
    errors.createError(ctx, "InvalidExpandQuery", { expand });
    return;
  }

  const expandLayer: any = {};

  let lastField: string;

  tokens.forEach((token) => {
    if (token.type === "expand" && !lastField) {
      errors.createError(ctx, "InvalidExpandQuery", { expand });
    }

    if (token.type === "expand") {
      expandLayer[lastField] = token.value;
    }

    if (token.type === "field") {
      expandLayer[token.value] = "";
      lastField = token.value;
    }
  });

  return expandLayer;
}

export interface ExpandACLParameters {
  roles: string[];
  author?: User;
  aclCache: any;
}

export async function expandObject(
  ctx: Context,
  object: GraphObject,
  expand: string,
  aclParameters: ExpandACLParameters
) {
  const objectType = await getObjectTypeFromId(ctx, object.id);
  const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

  const { roles, author, aclCache } = aclParameters;

  const expandLayer = parseExpandLayer(ctx, expand);
  const result = { ...object };

  await Promise.all(
    Object.keys(expandLayer).map(async (key) => {
      if (objectConfig.fields[key]) {
        // Verify this field can be expanded
        await verifyObjectACL(ctx, {
          aclMode: "hard",
          method: "GET",
          objectType,
          roles,
          singleFieldStrategy: "error",
          aclCache,
          author,
          keys: [key],
          object,
        });

        const expandedObjectId = object[key] as string;
        const expandedObjectType = await getObjectTypeFromId(
          ctx,
          expandedObjectId
        );

        await verifyObjectACL(ctx, {
          aclMode: "soft",
          method: "GET",
          objectType: expandedObjectType,
          roles,
          author,
          singleFieldStrategy: "strip",
          aclCache,
        });

        let expandedObject = await persistence.getObject<GraphObject>(
          ctx,
          expandedObjectId
        );

        const expandedObjectKeys = Object.keys(expandedObject);

        expandedObject = await expandObject(
          ctx,
          expandedObject,
          expandLayer[key],
          aclParameters
        );

        result[key] = await verifyObjectACL(ctx, {
          aclMode: "hard",
          method: "GET",
          objectType: expandedObjectType,
          roles,
          author,
          singleFieldStrategy: "strip",
          aclCache,
          object: expandedObject,
          keys: expandedObjectKeys,
        });
      }

      if (objectConfig.edges[key]) {
        // Verify this edge can be expanded
        await verifyEdgeACL(ctx, {
          aclMode: "hard",
          edgeName: key,
          method: "GET",
          roles,
          src: object,
          author,
        });

        const dsts = await persistence.getEdges<string[]>(ctx, object.id, key, {
          lean: true,
        });

        result[key] = await Promise.all(
          dsts.map(async (dst) => {
            const objectType = await getObjectTypeFromId(ctx, dst);

            await verifyObjectACL(ctx, {
              aclMode: "soft",
              method: "GET",
              roles,
              singleFieldStrategy: "strip",
              aclCache,
              author,
              objectType,
            });

            let expandedObject = await persistence.getObject<GraphObject>(
              ctx,
              dst
            );

            const expandedObjectKeys = Object.keys(expandedObject);

            expandedObject = await expandObject(
              ctx,
              expandedObject,
              expandLayer[key],
              aclParameters
            );

            return await verifyObjectACL(ctx, {
              aclMode: "hard",
              method: "GET",
              objectType,
              roles,
              singleFieldStrategy: "strip",
              aclCache,
              author,
              object: expandedObject,
              keys: expandedObjectKeys,
            });
          })
        );
      }
    })
  );

  return result;
}
