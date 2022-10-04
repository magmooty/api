import fs from "fs";
import path from "path";

export function readConfig() {
  const isTesting = process.env.NODE_ENV === "test";

  const json = fs
    .readFileSync(
      path.join(
        __dirname,
        isTesting ? "../../config.test.json" : "../../config.json"
      )
    )
    .toString();

  return { config: JSON.parse(json), isTesting };
}
