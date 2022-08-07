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
] as const;

export type HistogramName = typeof metricsHistogram[number]["name"];
