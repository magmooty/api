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
      type: {
        type: "value-set",
        valueSet: "contact-point",
      },
      value: {
        type: "string",
      },
    },
  },
} as { [key: string]: StructConfig };
