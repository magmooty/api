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
} as { [key: string]: StructConfig };
