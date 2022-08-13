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
    name: "dynamo_create_unique_duration",
    help: "Duration of create unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "retries"],
  },
  {
    name: "dynamo_create_unique_error_duration",
    help: "Duration of create unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
  },
  {
    name: "dynamo_check_unique_duration",
    help: "Duration of check unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "retries"],
  },
  {
    name: "dynamo_check_unique_error_duration",
    help: "Duration of check unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
  },
  {
    name: "dynamo_remove_unique_duration",
    help: "Duration of remove unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "retries"],
  },
  {
    name: "dynamo_remove_unique_error_duration",
    help: "Duration of remove unique requests to dynamo",
    labelNames: ["objectType", "fieldName", "error"],
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
  {
    name: "persistence_get_object_duration",
    help: "Duration of get requests to persistence",
    labelNames: ["objectType", "retries"],
  },
  {
    name: "persistence_get_object_error_duration",
    help: "Duration of get requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_create_object_duration",
    help: "Duration of create object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_create_object_error_duration",
    help: "Duration of create object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_update_object_duration",
    help: "Duration of update object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_update_object_error_duration",
    help: "Duration of update object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_replace_object_duration",
    help: "Duration of replace object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_replace_object_error_duration",
    help: "Duration of replace object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_delete_object_duration",
    help: "Duration of delete object requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_delete_object_error_duration",
    help: "Duration of delete object requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_query_objects_duration",
    help: "Duration of query requests to persistence",
    labelNames: ["objectType"],
  },
  {
    name: "persistence_query_objects_error_duration",
    help: "Duration of query requests to persistence",
    labelNames: ["objectType", "error"],
  },
  {
    name: "persistence_create_edge_duration",
    help: "Duration of create edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_create_edge_error_duration",
    help: "Duration of create edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_delete_edge_duration",
    help: "Duration of delete edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_delete_edge_error_duration",
    help: "Duration of delete edge requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_get_edges_duration",
    help: "Duration of get edges requests to persistence",
    labelNames: ["srcObjectType", "edgeName"],
  },
  {
    name: "persistence_get_edges_error_duration",
    help: "Duration of get edges requests to persistence",
    labelNames: ["srcObjectType", "edgeName", "error"],
  },
  {
    name: "persistence_get_reverse_edges_duration",
    help: "Duration of get reverse edges requests to persistence",
    labelNames: ["dstObjectType", "edgeName"],
  },
  {
    name: "persistence_get_reverse_edges_error_duration",
    help: "Duration of get reverse edges requests to persistence",
    labelNames: ["dstObjectType", "edgeName", "error"],
  },
] as const;

export type HistogramName = typeof metricsHistogram[number]["name"];
