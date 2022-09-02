import { StructConfig } from ".";

export default {
  "human-name": {
    prefix: {
      type: "value-set",
      valueSet: "name-prefix",
    },
  },
} as { [key: string]: StructConfig };
