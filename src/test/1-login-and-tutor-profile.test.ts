import bcrypt from "bcryptjs";
import request from "superagent";
import * as cache from "./cache";
import { endpoint, handleRequest } from "./common";
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

export const CONSTANTS = {
  normalUserSignUp: {
    username: "+201096707442",
    password: "WarWarWar-Rambo4",
  },
  normalUserLogin: {
    username: "+201096707442",
    password: "WarWarWar-Rambo4",
  },
  devUserSignUp: {
    username: "ziadalzarka@gmail.com",
    password: "WarWarWar-Rambo4",
  },
  devUserLogIn: {
    username: "ziadalzarka@gmail.com",
    password: "WarWarWar-Rambo4",
  },
  normalUserLoginInvalidPassword: {
    username: "+201096707442",
    password: "WarWarWar-Rambo43",
  },
  tutorCreateSpace: {
    name: "Ziad Alzarka 2022",
    object_type: "space",
  },
  tutorCreateTutorRole: {
    space: null,
    contacts: [
      {
        type: "phone",
        value: "+201096707442",
      },
    ],
    object_type: "tutor_role",
  },
};

const state: any = {};

describe("Login and tutor profile", function () {
  test("Phone user can sign up", async function () {
    const response = await handleRequest(
      request.post(endpoint("/auth/signup")).send(CONSTANTS.normalUserSignUp)
    );

    expect(response.status).toEqual(200);

    // Check token and refresh token
    const { token, refresh_token } = response.body;
    expect(token).toBeTruthy();
    expect(refresh_token).toBeTruthy();

    const [sessionId, sessionToken] = token.split("|");

    const session = await cache.get(sessionId);

    expect(session).toBeTruthy();
    expect(session.token).toEqual(sessionToken);
    expect(session.user).toBeTruthy();

    const user = await primarydb.getObject(session.user);

    expect(user).toBeTruthy();

    const systemUser = await primarydb.getObject(user.system_user);

    expect(systemUser).toBeTruthy();

    const hashMatches = await bcrypt.compare(
      CONSTANTS.normalUserSignUp.password,
      systemUser.hash
    );

    expect(hashMatches).toBeTruthy();

    const cachedSystemUser = await cache.get(user.system_user);

    expect(cachedSystemUser).toBeFalsy();
  });

  test("Phone user can't log in with invalid password", async function () {
    const response = await handleRequest(
      request
        .post(endpoint("/auth/login"))
        .send(CONSTANTS.normalUserLoginInvalidPassword)
    );

    expect(response.status).toEqual(401);

    expect(response.body.code).toEqual("WrongPassword");
  });

  test("Phone user can log in", async function () {
    const response = await handleRequest(
      request.post(endpoint("/auth/login")).send(CONSTANTS.normalUserLogin)
    );

    expect(response.status).toEqual(200);

    // Check token and refresh token
    const { token, refresh_token } = response.body;

    expect(token).toBeTruthy();
    expect(refresh_token).toBeTruthy();

    const [sessionId, sessionToken] = token.split("|");

    const session = await cache.get(sessionId);

    expect(session).toBeTruthy();
    expect(session.token).toEqual(sessionToken);

    state.token = token;
  });

  test("Phone user can fetch my profile", async function () {
    const response = await handleRequest(
      request.get(endpoint("/profile/me")).auth(state.token, { type: "bearer" })
    );

    expect(response.status).toEqual(200);

    const { id, phone, object_type, phone_verified } = response.body;

    expect(phone).toEqual(CONSTANTS.normalUserSignUp.username);
    expect(phone_verified).toBeFalsy();
    expect(object_type).toEqual("user");

    state.normalUserId = id;
  });

  test("Phone user can find a notification about verification", async function () {
    const response = await handleRequest(
      request
        .post(endpoint("/search/query/notification"))
        .auth(state.token, { type: "bearer" })
        .send({ filters: { and: [{ user: state.normalUserId }] } })
    );

    expect(response.status).toEqual(200);

    const verificationNotification = response.body.results.find(
      (notification: any) => notification.type === "verify_phone"
    );

    expect(verificationNotification).toBeTruthy();
  });

  test("Email dev user can sign up", async function () {
    const response = await handleRequest(
      request.post(endpoint("/auth/signup")).send(CONSTANTS.devUserSignUp)
    );

    expect(response.status).toEqual(200);

    // Check token and refresh token
    const { token, refresh_token } = response.body;

    expect(token).toBeTruthy();
    expect(refresh_token).toBeTruthy();
  });

  test("Email dev user can log in", async function () {
    const response = await handleRequest(
      request.post(endpoint("/auth/login")).send(CONSTANTS.devUserLogIn)
    );

    expect(response.status).toEqual(200);

    // Check token and refresh token
    const { token, refresh_token } = response.body;

    expect(token).toBeTruthy();
    expect(refresh_token).toBeTruthy();

    const [sessionId, sessionToken] = token.split("|");

    const session = await cache.get(sessionId);

    expect(session).toBeTruthy();
    expect(session.token).toEqual(sessionToken);

    state.devToken = token;
  });

  test("Dev user can modify phone verified", async function () {
    const response = await handleRequest(
      request
        .patch(endpoint(`/graph/${state.normalUserId}`))
        .auth(state.devToken, { type: "bearer" })
        .send({ phone_verified: true })
    );

    expect(response.status).toEqual(200);

    const { phone, phone_verified } = response.body;

    expect(phone).toEqual(CONSTANTS.normalUserSignUp.username);
    expect(phone_verified).toBeTruthy();
  });

  test("Phone user has the phone verified", async function () {
    const response = await handleRequest(
      request.get(endpoint("/profile/me")).auth(state.token, { type: "bearer" })
    );

    expect(response.status).toEqual(200);

    const { phone, phone_verified } = response.body;

    expect(phone).toEqual(CONSTANTS.normalUserSignUp.username);
    expect(phone_verified).toBeTruthy();
  });

  test("User can create a space", async function () {
    const response = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send(CONSTANTS.tutorCreateSpace)
    );

    expect(response.status).toEqual(200);

    const { id, name, owner, object_type } = response.body;

    expect(name).toBe(CONSTANTS.tutorCreateSpace.name);
    expect(owner).toBe(state.normalUserId);
    expect(object_type).toBe("space");

    state.spaceId = id;
  });

  test("User can add themselves as a tutor to the new space", async function () {
    const response = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({ ...CONSTANTS.tutorCreateTutorRole, space: state.spaceId })
    );

    expect(response.status).toEqual(200);

    const { id, object_type } = response.body;

    expect(object_type).toBe("tutor_role");

    state.normalUserTutorRoleId = id;
  });

  test("New tutor role is added to user's roles", async function () {
    const response = await handleRequest(
      request
        .get(endpoint(`/graph/${state.normalUserId}/roles`))
        .auth(state.token, { type: "bearer" })
    );

    expect(response.status).toEqual(200);

    const [tutorRole] = response.body;

    expect(tutorRole).toBeTruthy();

    const { object_type, space } = tutorRole;

    expect(object_type).toBe("tutor_role");
    expect(space).toBe(state.spaceId);
  });

  test("Tutor can find notifications about profile completion and getting started", async function () {
    const response = await handleRequest(
      request
        .post(endpoint("/search/query/notification"))
        .auth(state.token, { type: "bearer" })
        .send({
          filters: {
            and: [
              { user: state.normalUserId },
              { role: state.normalUserTutorRoleId },
            ],
          },
        })
    );

    expect(response.status).toEqual(200);

    const completeTutorProfileNotification = response.body.results.find(
      (notification: any) => notification.type === "complete_tutor_profile"
    );

    const getStartedNotification = response.body.results.find(
      (notification: any) => notification.type === "tutor_get_started"
    );

    expect(completeTutorProfileNotification).toBeTruthy();
    expect(getStartedNotification).toBeTruthy();
  });
});
