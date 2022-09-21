import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, persistence, search } from "@/components";
import { SearchCriteria } from "@/search";
import { Context } from "@/tracing";
import {
  Array,
  Dictionary,
  Literal,
  Number,
  Optional,
  Record,
  Static,
  String,
  Union,
} from "runtypes";
import { validatePayload, verifyObjectACL } from "../common";
import { IndexName, indexNames } from "@/sync/mapping";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { expandObject } from "@/api/expand";

const SearchParams = Record({
  index: Union(
    Literal(indexNames[0]),
    ...indexNames.slice(1).map((indexName) => Literal(indexName))
  ),
});

type SearchParams = Static<typeof SearchParams>;

const SearchQuery = Record({
  expand: Optional(String),
  limit: Optional(Number.withConstraint((x) => x <= 100 && x > 0)),
  after: Optional(Number.withConstraint((x) => x <= 10000 && x > 0)),
});

type SearchQuery = Static<typeof SearchQuery>;

const SearchBody = Record({
  query: Optional(String),
  filters: Optional(
    Record({
      or: Optional(Array(Optional(Dictionary(Union(String, Number))))),
      and: Optional(Array(Optional(Dictionary(Union(String, Number))))),
    })
  ),
  ranges: Optional(
    Record({
      or: Optional(
        Array(
          Optional(
            Record({
              property: String,
              lt: Optional(String),
              lte: Optional(String),
              gt: Optional(String),
              gte: Optional(String),
            })
          )
        )
      ),
      and: Optional(
        Array(
          Optional(
            Record({
              property: String,
              lt: Optional(String),
              lte: Optional(String),
              gt: Optional(String),
              gte: Optional(String),
            })
          )
        )
      ),
    })
  ),
  sort_by: Optional(Dictionary(Union(Literal("asc"), Literal("desc")))),
});

type SearchBody = Static<typeof SearchBody>;

export const searchEndpoint: APIEndpoint = apiWrapper(
  {
    name: "search",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    if (!req.user || !req.session) {
      return;
    }

    const { body, params, query } = req;

    await validatePayload(ctx, params, SearchParams);
    await validatePayload(ctx, body, SearchBody);
    await validatePayload(ctx, query, SearchBody);

    const { index } = params as SearchParams;
    const criteria = body as SearchCriteria;
    const { expand } = query as SearchQuery;

    const { results: ids, count } = await search.leanSearch(
      ctx,
      index as IndexName,
      criteria
    );

    const aclCache: any = {};

    const results = await Promise.all(
      ids.map(async (id) => {
        if (!req.session) {
          return;
        }

        const objectType = await getObjectTypeFromId(ctx, id);

        await verifyObjectACL(ctx, {
          aclMode: "soft",
          method: "GET",
          objectType,
          roles: req.session.roles,
          singleFieldStrategy: "strip",
          aclCache,
          author: req.user,
        });

        let object = await persistence.getObject<GraphObject>(ctx, id);

        const objectKeys = Object.keys(object);

        if (expand) {
          object = await expandObject(ctx, object, expand, {
            aclCache,
            roles: req.session.roles,
            author: req.user,
          });
        }

        return verifyObjectACL(ctx, {
          aclMode: "hard",
          method: "GET",
          objectType,
          roles: req.session.roles,
          singleFieldStrategy: "strip",
          aclCache,
          author: req.user,
          object,
          keys: objectKeys,
        });
      })
    );

    res.json({ results, count });
  }
);
