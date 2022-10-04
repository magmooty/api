import { Response } from "superagent";
import { waitForEvents } from "./queue";

export const API_URL = "http://localhost:6000";

export const endpoint = (path: string) => {
  return `${API_URL}${path}`;
};

export const handleRequest = async (
  request: Promise<Response>
): Promise<Response> => {
  try {
    const response = await request;
    await waitForEvents();
    return response;
  } catch (error: any) {
    error.response.body = JSON.parse(error.response.text);
    return error.response as Response;
  }
};
