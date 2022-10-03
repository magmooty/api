import fs from "fs";
import path from "path";
import { AppConfig } from "./types";

export const isTesting = process.env.NODE_ENV === "test";

const json = fs
  .readFileSync(
    path.join(
      __dirname,
      isTesting ? "../../config.test.json" : "../../config.json"
    )
  )
  .toString();

export default JSON.parse(json) as AppConfig;
