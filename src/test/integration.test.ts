import request from "supertest";
import { TestingConstants } from "./commons";

/**
 * @jest-environment ./integration-test-environment
 */

let app: Express.Application;
let constants: TestingConstants;

beforeAll(async () => {
  app = (globalThis as any).app;
  constants = (globalThis as any).constants;
});

describe("Server is healthy", function () {
  it("Responds with 200", async function () {
    const response = await request(app).get("/");

    expect(response.status).toEqual(200);
  });
});

describe("Login and tutor profile", function () {
  it("Can sign up", async function () {
    const response = await request(app)
      .post("/auth/signup")
      .send(constants.normalUserSignUp);

    console.log({ body: response.body });

    expect(response.body.token).toBeTruthy();
    expect(response.body.refresh_token).toBeTruthy();
    expect(response.status).toEqual(200);
  });
});
