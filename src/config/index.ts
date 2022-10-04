import { readConfig } from "./read-config";
import { AppConfig } from "./types";

const { isTesting, config } = readConfig();

export default config as AppConfig;

export { isTesting };
