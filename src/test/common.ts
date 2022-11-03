import { faker } from "@faker-js/faker";
import { Response } from "superagent";
import { waitForEvents } from "./queue";
import { SuperAgentRequest } from "superagent";

export const API_URL = "http://localhost:6000";

export const endpoint = (path: string) => {
  return `${API_URL}${path}`;
};

export const handleRequest = async (
  request: SuperAgentRequest,
  { expectingError } = { expectingError: false }
): Promise<Response> => {
  try {
    const response = await request;
    if (request.method !== "GET") {
      await waitForEvents();
    }
    return response;
  } catch (error: any) {
    if (!expectingError) {
      console.log(JSON.stringify(error, null, 2));
    }
    error.response.body = JSON.parse(error.response.text);
    return error.response as Response;
  }
};

export const fakePhoneNumber = () => faker.phone.number("+2010########");

export const fakePassword = () =>
  faker.internet.password(7, false, /[0-9]/) +
  faker.internet.password(7, false, /[A-Z]/) +
  faker.internet.password(7, false, /[a-z]/);

export const devUserCredentials = {
  username: "ziadalzarka@gmail.com",
  password: fakePassword(),
};
