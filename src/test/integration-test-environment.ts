/* eslint-disable @typescript-eslint/no-var-requires */
// integration-test-environment

import fs from "fs";
import path from "path";
import * as tsConfigPaths from "tsconfig-paths";

const tsConfigJSON = fs
  .readFileSync(path.join(__dirname, "../../../tsconfig.json"))
  .toString("utf-8");

const tsConfig = JSON.parse(tsConfigJSON);

const baseUrl = "./";

tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});

import NodeEnvironment from "jest-environment-node";
import { persistence, queue, search, sync } from "@/components";
import { bootstrapServer } from "@/server";
import { quit as quitServer } from "@/api";
import { CONSTANTS } from "./commons";

class IntegrationTestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    this.global.app = await bootstrapServer();
    this.global.functions = await this.initializeGlobalFunctions();
    this.global.constants = await this.initializeCommonConstants();
    await persistence.clearDBForTest();
    await sync.clearDBForTest();
  }

  initializeGlobalFunctions = async () => {
    return {};
  };

  initializeCommonConstants = async () => {
    return CONSTANTS;
  };

  async teardown() {
    await quitServer();
    await sync.quit();
    await search.quit();
    await queue.quit();
    await persistence.quit();
    await super.teardown();
  }
}

export = IntegrationTestEnvironment;
