import request from "superagent";
import { endpoint } from "./common";
import * as cache from "./cache";
import * as primarydb from "./primarydb";
import * as queue from "./queue";

beforeAll(async () => {
  await queue.init();
});

afterAll(async () => {
  await cache.quit();
  await primarydb.quit();
  await queue.quit();
});

describe("Server is healthy", function () {
  it("Responds with 200", async function () {
    const response = await request.get(endpoint("/"));

    expect(response.status).toEqual(200);
  });
});
