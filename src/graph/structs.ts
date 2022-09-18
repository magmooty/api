import { StructConfig } from ".";

export default {
  "human-name": {
    fields: {
      prefix: {
        type: "value-set",
        valueSet: "name-prefix",
      },
      first_name: {
        type: "string",
      },
      middle_name: {
        type: "string",
      },
      last_name: {
        type: "string",
      },
      locale: {
        type: "string",
        required: true,
      },
    },
  },
  "payment-method": {
    fields: {
      type: {
        type: "value-set",
        valueSet: "payment-method-type",
      },
      value: {
        type: "string",
      },
    },
  },
  "contact-point": {
    fields: {
      use: {
        type: "value-set",
        valueSet: "contact-point-use",
      },
      type: {
        type: "value-set",
        valueSet: "contact-point-type",
      },
      value: {
        type: "string",
      },
    },
  },
  "study-group-time-table": {
    fields: {
      class_of_week: {
        type: "number",
      },
      day: {
        type: "value-set",
        valueSet: "day",
      },
      time_from: {
        type: "number",
      },
      time_to: {
        type: "number",
      },
    },
  },
  "exam-time-table": {
    fields: {
      date: {
        type: "date",
      },
      time_from: {
        type: "number",
      },
      time_to: {
        type: "number",
      },
    },
  },
  "exam-grade-group": {
    fields: {
      grade_group_id: {
        type: "string",
      },
      name: {
        type: "string",
      },
      color: {
        type: "value-set",
        valueSet: "color",
      },
      range_from: {
        type: "number",
      },
      range_to: {
        type: "number",
      },
    },
  },
  "exam-grade-group-stats": {
    fields: {
      _any: {
        type: "counter",
      },
    },
  },
} as { [key: string]: StructConfig };
