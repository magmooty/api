export const metricsCounters = [
  {
    name: "dynamo_get_object",
    help: "Total number of get requests to dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_get_object_error",
    help: "Total number of errored get requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_create_object",
    help: "Total number of create object requests to dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_create_object_error",
    help: "Total number of errored create object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_update_object",
    help: "Total number of update object requests to dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_update_object_error",
    help: "Total number of errored update object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_replace_object",
    help: "Total number of replace object requests to dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_replace_object_error",
    help: "Total number of errored replace object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_delete_object",
    help: "Total number of delete object requests to dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_delete_object_error",
    help: "Total number of errored delete object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_queried_objects",
    help: "Total number of seeded objects fetched from dynamo",
    labelNames: ["objectType"],
  },
  {
    name: "dynamo_queried_objects_error",
    help: "Total number of failed query requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_create_edge",
    help: "Total number of create edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "dynamo_create_edge_error",
    help: "Total number of errored create edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_delete_edge",
    help: "Total number of delete edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "dynamo_delete_edge_error",
    help: "Total number of errored delete edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_get_edges",
    help: "Total number of get edges requests to dynamo",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "dynamo_get_edges_error",
    help: "Total number of errored get edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_get_reverse_edges",
    help: "Total number of get edges requests to dynamo",
    labelNames: ["dstObjectType", "edgeName"],
  },
  {
    name: "dynamo_get_reverse_edges_error",
    help: "Total number of errored get edge requests to dynamo",
    labelNames: ["dstObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_create_unique",
    help: "Total number of create unique requests to dynamo",
    labelNames: ["objectType", "fieldName"],
  },
  {
    name: "dynamo_create_unique_error",
    help: "Total number of errored create unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
  },
  {
    name: "dynamo_check_unique",
    help: "Total number of check unique requests to dynamo",
    labelNames: ["objectType", "fieldName"],
  },
  {
    name: "dynamo_check_unique_error",
    help: "Total number of errored check unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
  },
  {
    name: "dynamo_remove_unique",
    help: "Total number of remove unique requests to dynamo",
    labelNames: ["objectType", "fieldName"],
  },
  {
    name: "dynamo_remove_unique_error",
    help: "Total number of errored remove unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
  },
  {
    name: "persistence_get_object",
    help: "Total number of get requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_get_object_error",
    help: "Total number of errored get requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_create_object",
    help: "Total number of create object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_create_object_error",
    help: "Total number of errored create object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_update_object",
    help: "Total number of update object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_update_object_error",
    help: "Total number of errored update object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_replace_object",
    help: "Total number of replace object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_replace_object_error",
    help: "Total number of errored replace object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_delete_object",
    help: "Total number of delete object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_delete_object_error",
    help: "Total number of errored delete object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_queried_objects",
    help: "Total number of seeded objects fetched from persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_queried_objects_error",
    help: "Total number of failed query requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_create_edge",
    help: "Total number of create edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_create_edge_error",
    help: "Total number of errored create edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_delete_edge",
    help: "Total number of delete edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_delete_edge_error",
    help: "Total number of errored delete edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_get_edges",
    help: "Total number of get edges requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_get_edges_error",
    help: "Total number of errored get edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_get_reverse_edges",
    help: "Total number of get edges requests to persistence",
    labelNames: ["dstObjectType", "edgeName"],
  },
  {
    name: "persistence_get_reverse_edges_error",
    help: "Total number of errored get edge requests to persistence",
    labelNames: ["dstObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_retries",
    help: "Total number of retries to dynamo",
    labelNames: [
      "method",
      "objectType",
      "srcObjectType",
      "edgeName",
      "dstObjectType",
    ],
  },
  {
    name: "redis_get_requests",
    help: "Total number of redis get requests",
    labelNames: ["result"],
  },
  {
    name: "redis_get_errors",
    help: "Total number of redis get requests errors",
    labelNames: ["error"],
  },
  {
    name: "redis_mget_requests",
    help: "Total number of redis get requests",
    labelNames: ["hits", "misses", "rate"],
  },
  {
    name: "redis_mget_errors",
    help: "Total number of redis get requests errors",
    labelNames: ["error"],
  },
  {
    name: "redis_scanned_keys",
    help: "Total number of scanned redis keys",
    labelNames: ["match"],
  },
  {
    name: "redis_requests",
    help: "Total number of redis requests",
    labelNames: ["method"],
  },
  {
    name: "redis_errors",
    help: "Total number of redis requests errors",
    labelNames: ["method", "error"],
  },
  {
    name: "login_requests",
    help: "Total number of login requests",
    labelNames: ["provider"],
  },
  {
    name: "login_errors",
    help: "Total number of login requests errors",
    labelNames: ["provider", "error"],
  },
  {
    name: "signup_requests",
    help: "Total number of signup requests",
    labelNames: ["provider"],
  },
  {
    name: "signup_errors",
    help: "Total number of signup requests errors",
    labelNames: ["provider", "error"],
  },
] as const;

export type CounterName = typeof metricsCounters[number]["name"];
