import { wait } from "@/util/wait";
import { faker } from "@faker-js/faker";
import request from "superagent";
import * as cache from "./cache";
import {
  endpoint,
  fakePassword,
  fakePhoneNumber,
  handleRequest,
} from "./common";
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
  tutorCreateNewBillableItem: {
    name: faker.random.words(2),
    academic_year: null,
    type: "subscription",
    object_type: "billable_item",
    price: 120,
    time_table: [
      {
        date_from: faker.date.recent(10),
        date_to: faker.date.soon(10),
      },
    ],
  },
  tutorCreateNewStudent: {
    name: [
      {
        first_name: faker.random.word(),
        middle_name: faker.random.word(),
        last_name: faker.random.word(),
        locale: "en",
      },
    ],
    academic_year: null,
    study_group: null,
    object_type: "student_role",
  },
  tutorCreateExamAfterStudentCreation: {
    name: faker.random.words(2),
    academic_year: null,
    max_grade: 60,
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
        range_from: 50,
        range_to: 60,
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
    expect(academicYear.stats).toBeTruthy();
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
    expect(studyGroup.stats).toBeTruthy();
    expect(studyGroup.object_type).toBe("study_group");

    state.studyGroupId = studyGroup.id;
  });

  test("Creating an exam", async function () {
    const examResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({
          ...CONSTANTS.tutorCreateNewExam,
          academic_year: state.academicYearId,
        })
    );

    expect(examResponse.status).toBe(200);

    const examSearchResults = await handleRequest(
      request
        .post(endpoint("/search/query/exam"))
        .auth(state.token, { type: "bearer" })
        .send({ filters: { and: [{ space: state.spaceId }] } })
    );

    expect(examSearchResults.status).toBe(200);
    expect(examSearchResults.body.count).toBe(1);

    const [exam] = examSearchResults.body.results;

    expect(exam).toBeTruthy();
    expect(exam.name).toBe(CONSTANTS.tutorCreateNewExam.name);
    expect(exam.academic_year).toBe(state.academicYearId);
    expect(exam.stats).toBeTruthy();
    expect(exam.object_type).toBe("exam");

    state.examId = exam.id;
  });

  test("Creating a billable item", async function () {
    const billableItemResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({
          ...CONSTANTS.tutorCreateNewBillableItem,
          academic_year: state.academicYearId,
        })
    );

    expect(billableItemResponse.status).toBe(200);

    const billableItemSearchResults = await handleRequest(
      request
        .post(endpoint("/search/query/billable_item"))
        .auth(state.token, { type: "bearer" })
        .send({ filters: { and: [{ space: state.spaceId }] } })
    );

    expect(billableItemSearchResults.status).toBe(200);
    expect(billableItemSearchResults.body.count).toBe(1);

    const [billableItem] = billableItemSearchResults.body.results;

    expect(billableItem).toBeTruthy();
    expect(billableItem.name).toBe(CONSTANTS.tutorCreateNewBillableItem.name);
    expect(billableItem.academic_year).toBe(state.academicYearId);
    expect(billableItem.stats).toBeTruthy();
    expect(billableItem.object_type).toBe("billable_item");

    state.billableItemId = billableItem.id;
  });

  test("Creating a student", async function () {
    const studentResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({
          ...CONSTANTS.tutorCreateNewStudent,
          study_group: state.studyGroupId,
          academic_year: state.academicYearId,
        })
    );

    expect(studentResponse.status).toBe(200);

    const studentSearchResults = await handleRequest(
      request
        .post(endpoint("/search/query/student_role"))
        .auth(state.token, { type: "bearer" })
        .send({ query: CONSTANTS.tutorCreateNewStudent.name[0].first_name })
    );

    expect(studentSearchResults.status).toBe(200);
    expect(studentSearchResults.body.count).toBe(1);

    const [student] = studentSearchResults.body.results;

    expect(student).toBeTruthy();
    expect(student.name).toEqual(CONSTANTS.tutorCreateNewStudent.name);
    expect(student.academic_year).toBe(state.academicYearId);
    expect(student.object_type).toBe("student_role");
  });

  test("Creating a student should increment academic year stats counter", async function () {
    const academicYearResponse = await handleRequest(
      request
        .get(endpoint(`/graph/${state.academicYearId}`))
        .query({ expand: "stats" })
        .auth(state.token, { type: "bearer" })
    );

    expect(academicYearResponse.status).toBe(200);

    const academicYear = academicYearResponse.body;

    expect(academicYear).toBeTruthy();
    expect(academicYear.stats).toBeTruthy();
    expect(academicYear.stats.student_counter).toBe(1);
  });

  test("Creating a student should increment study group stats counter", async function () {
    const studyGroupResponse = await handleRequest(
      request
        .get(endpoint(`/graph/${state.studyGroupId}`))
        .query({ expand: "stats" })
        .auth(state.token, { type: "bearer" })
    );

    expect(studyGroupResponse.status).toBe(200);

    const studyGroup = studyGroupResponse.body;

    expect(studyGroup).toBeTruthy();
    expect(studyGroup.stats).toBeTruthy();
    expect(studyGroup.stats.student_counter).toBe(1);
  });

  test("Creating a student should increment exam stats counter", async function () {
    const examResponse = await handleRequest(
      request
        .get(endpoint(`/graph/${state.examId}`))
        .query({ expand: "stats" })
        .auth(state.token, { type: "bearer" })
    );

    expect(examResponse.status).toBe(200);

    const exam = examResponse.body;

    expect(exam).toBeTruthy();
    expect(exam.stats).toBeTruthy();
    expect(exam.stats.student_counter).toBe(1);
  });

  test("Creating a student should increment billable item stats counter", async function () {
    const billableItemResponse = await handleRequest(
      request
        .get(endpoint(`/graph/${state.billableItemId}`))
        .query({ expand: "stats" })
        .auth(state.token, { type: "bearer" })
    );

    expect(billableItemResponse.status).toBe(200);

    const billableItem = billableItemResponse.body;

    expect(billableItem).toBeTruthy();
    expect(billableItem.stats).toBeTruthy();
    expect(billableItem.stats.student_counter).toBe(1);
  });

  test("Creating an exam after student creation", async function () {
    const examResponse = await handleRequest(
      request
        .post(endpoint("/graph"))
        .auth(state.token, { type: "bearer" })
        .send({
          ...CONSTANTS.tutorCreateExamAfterStudentCreation,
          academic_year: state.academicYearId,
        })
    );

    expect(examResponse.status).toBe(200);

    state.examAfterStudentCreationId = examResponse.body.id;
  });

  test("Exam created after student creation counter should be set to students count", async function () {
    const examResponse = await handleRequest(
      request
        .get(endpoint(`/graph/${state.examAfterStudentCreationId}`))
        .query({ expand: "stats" })
        .auth(state.token, { type: "bearer" })
    );

    expect(examResponse.status).toBe(200);

    const exam = examResponse.body;

    expect(exam).toBeTruthy();
    expect(exam.stats).toBeTruthy();
    expect(exam.stats.student_counter).toBe(1);
  });
});
