export const metricsHistogram = [
  {
    name: "dynamo_get_object_duration",
    help: "Duration of get requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_get_object_error_duration",
    help: "Duration of get requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_create_object_duration",
    help: "Duration of create object requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_create_object_error_duration",
    help: "Duration of create object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_update_object_duration",
    help: "Duration of update object requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_update_object_error_duration",
    help: "Duration of update object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_replace_object_duration",
    help: "Duration of replace object requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_replace_object_error_duration",
    help: "Duration of replace object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_delete_object_duration",
    help: "Duration of delete object requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_delete_object_error_duration",
    help: "Duration of delete object requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_query_objects_duration",
    help: "Duration of query requests to dynamo",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "dynamo_query_objects_error_duration",
    help: "Duration of query requests to dynamo",
    labelNames: ["objectType", "error"],
  },
  {
    name: "dynamo_create_edge_duration",
    help: "Duration of create edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "retries"],
  },
  {
    name: "dynamo_create_edge_error_duration",
    help: "Duration of create edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_delete_edge_duration",
    help: "Duration of delete edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "retries"],
  },
  {
    name: "dynamo_delete_edge_error_duration",
    help: "Duration of delete edge requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_get_edges_duration",
    help: "Duration of get edges requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "retries"],
  },
  {
    name: "dynamo_get_edges_error_duration",
    help: "Duration of get edges requests to dynamo",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "dynamo_get_reverse_edges_duration",
    help: "Duration of get reverse edges requests to dynamo",
    labelNames: ["dstObjectType", "edgeName", "retries"],
  },
  {
    name: "dynamo_get_reverse_edges_error_duration",
    help: "Duration of get reverse edges requests to dynamo",
    labelNames: ["dstObjectType", "edgeName", "error"],
  },
] as const;

export type HistogramName = typeof metricsHistogram[number]["name"];
