import fs from "fs";
import path from "path";
import { AppConfig } from "./types";

const json = fs
  .readFileSync(path.join(__dirname, "../../config.json"))
  .toString();

export default JSON.parse(json) as AppConfig;
