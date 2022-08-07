export const metricsCounters = [
  {
    name: "phone_user_logins",
    help: "Total number of users logging in using a phone number",
    labelNames: ["phone"],
  },
  {
    name: "email_user_logins",
    help: "Total number of users logging in using an email",
    labelNames: ["email"],
  },
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
] as const;

export type CounterName = typeof metricsCounters[number]["name"];
