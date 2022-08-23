import { User } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { NextFunction, Request, Response } from "express";

export interface APIRequest extends Request {
  ctx?: Context;
  user?: User;
}

export type APIResponse = Response;

export type APINextFunction = NextFunction;

export type APIEndpoint = (
  req: APIRequest,
  res: APIResponse,
  next: APINextFunction
) => Promise<void>;
