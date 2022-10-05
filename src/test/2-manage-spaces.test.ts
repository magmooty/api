import bcrypt from "bcryptjs";
import request from "superagent";
import * as cache from "./cache";
import {
  devUserCredentials,
  endpoint,
  fakePassword,
  fakePhoneNumber,
  handleRequest,
} from "./common";
import * as primarydb from "./primarydb";
import * as queue from "./queue";
import { faker } from "@faker-js/faker";

beforeAll(async () => {
  await queue.init();
});

afterAll(async () => {
  await cache.quit();
  await primarydb.quit();
  await queue.quit();
});

export const CONSTANTS = {
  normalUserCredentials: {
    username: fakePhoneNumber(),
    password: fakePassword(),
  },
  normalUserCredentialsInvalidPassword: {
    password: fakePassword(),
  },
  tutorCreateSpace: {
    name: faker.name.fullName(),
    object_type: "space",
  },
  tutorCreateTutorRole: {
    space: null,
    contacts: [
      {
        type: "phone",
        value: fakePhoneNumber(),
      },
    ],
    object_type: "tutor_role",
  },
  tutorCreateAcademicYear: {
    name: faker.random.words(2),
    object_type: "academic_year",
  },
  tutorCreateStudyGroup: {
    name: faker.random.words(2),
    academic_year: null,
    object_type: "study_group",
  },
  tutorCreateNewExam: {
    name: faker.random.words(2),
    academic_year: null,
    max_grade: 30,
    object_type: "exam",
    time_table: [
      {
        date: faker.date.soon(10),
        time_from: 60,
        time_to: 90,
      },
    ],
    grade_groups: [
      {
        grade_group_id: "success",
        name: "Success",
        range_from: 20,
        range_to: 30,
        color: "green",
      },
    ],
  },
};

const state: any = {};

describe("Manage spaces", function () {
  test("Prerequisites", async function () {
    const signUpResponse = await handleRequest(
      request
        .post(endpoint("/auth/signup"))
        .send(CONSTANTS.normalUserCredentials)
    );

    expect(signUpResponse.status).toEqual(200);

    state.token = signUpResponse.body.token;

    const spaceResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send(CONSTANTS.tutorCreateSpace)
    );

    expect(spaceResponse.status).toEqual(200);

    state.spaceId = spaceResponse.body.id;

    const tutorRoleResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({ ...CONSTANTS.tutorCreateTutorRole, space: state.spaceId })
    );

    expect(tutorRoleResponse.status).toEqual(200);

    state.tutorRoleId = tutorRoleResponse.body.id;

    const loginResponse = await handleRequest(
      request
        .post(endpoint("/auth/login"))
        .send(CONSTANTS.normalUserCredentials)
    );

    expect(loginResponse.status).toEqual(200);

    state.token = loginResponse.body.token;
  });

  test("Creating an academic year", async function () {
    const academicYearResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({ ...CONSTANTS.tutorCreateAcademicYear, space: state.spaceId })
    );

    expect(academicYearResponse.status).toBe(200);

    const academicYearSearchResults = await handleRequest(
      request
        .post(endpoint("/search/query/academic_year"))
        .auth(state.token, { type: "bearer" })
        .send({ filters: { and: [{ space: state.spaceId }] } })
    );

    expect(academicYearSearchResults.status).toBe(200);
    expect(academicYearSearchResults.body.count).toBe(1);

    const [academicYear] = academicYearSearchResults.body.results;

    expect(academicYear).toBeTruthy();
    expect(academicYear.name).toBe(CONSTANTS.tutorCreateAcademicYear.name);
    expect(academicYear.space).toBe(state.spaceId);
    expect(academicYear.object_type).toBe("academic_year");

    state.academicYearId = academicYear.id;
  });

  test("Creating a study group", async function () {
    const studyGroupResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({
          ...CONSTANTS.tutorCreateStudyGroup,
          academic_year: state.academicYearId,
        })
    );

    expect(studyGroupResponse.status).toBe(200);

    const studyGroupSearchResults = await handleRequest(
      request
        .post(endpoint("/search/query/study_group"))
        .auth(state.token, { type: "bearer" })
        .send({ filters: { and: [{ space: state.spaceId }] } })
    );

    expect(studyGroupSearchResults.status).toBe(200);
    expect(studyGroupSearchResults.body.count).toBe(1);

    const [studyGroup] = studyGroupSearchResults.body.results;

    expect(studyGroup).toBeTruthy();
    expect(studyGroup.name).toBe(CONSTANTS.tutorCreateStudyGroup.name);
    expect(studyGroup.academic_year).toBe(state.academicYearId);
    expect(studyGroup.object_type).toBe("study_group");
  });
});
