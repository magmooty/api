import { config } from "@/components";
import { AppLocale } from "@/graph/objects/types";
import { Context } from "@/tracing";
import fs from "fs";
import path from "path";
import format from "string-template";

export interface AppErrorConfig {
  readonly code: string;
  readonly template: string;
  readonly templateProps: readonly string[];
  readonly statusCode: number;
}

const errors = [
  {
    code: "ObjectDoesNotExist",
    statusCode: 404,
    templateProps: [],
  },
  {
    code: "ObjectTypeDoesNotExist",
    statusCode: 404,
    templateProps: [],
  },
  {
    code: "InvalidObjectId",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ErrorDataMissing",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ObjectCreationFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ObjectUpdateFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ObjectDeleteFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ObjectQueryFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "AfterKeyIsInvalid",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ObjectReplaceFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "EdgeCreationFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "EdgeDeleteFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "GetEdgesFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "GetReverseEdgesFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "ValidationErrorRequiredField",
    statusCode: 400,
    templateProps: ["fieldName", "fieldType"],
  },
  {
    code: "ValidationErrorUniqueField",
    statusCode: 400,
    templateProps: ["fieldName"],
  },
  {
    code: "ValidationErrorBadDataType",
    statusCode: 400,
    templateProps: ["fieldName", "fieldType"],
  },
  {
    code: "ValidationErrorFieldNotFound",
    statusCode: 400,
    templateProps: ["fieldName"],
  },
  {
    code: "AddUniqueFailed",
    statusCode: 409,
    templateProps: [],
  },
  {
    code: "CheckUniqueFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "RemoveUniqueFailed",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "InvalidSearchCriteria",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "UserNotFound",
    statusCode: 404,
    templateProps: [],
  },
  {
    code: "WrongPassword",
    statusCode: 401,
    templateProps: [],
  },
  {
    code: "InvalidPassword",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "NeedToLoginAgain",
    statusCode: 401,
    templateProps: [],
  },
  {
    code: "InvalidToken",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "SessionExpired",
    statusCode: 401,
    templateProps: [],
  },
  {
    code: "InvalidUsername",
    statusCode: 400,
    templateProps: ["username"],
  },
  {
    code: "InvalidVerificationChannelSMS",
    statusCode: 400,
    templateProps: [],
  },
  {
    code: "InvalidVerificationChannelEmail",
    statusCode: 400,
    templateProps: [],
  },
] as const;

export type ErrorType = typeof errors[number]["code"];

export class AppError extends Error {
  data?: Object;
  statusCode: number;

  constructor(code: ErrorType, message: string, data?: Object) {
    super(message);

    this.name = code;
    this.data = data;
    this.statusCode = errorsMap[code].statusCode;
  }
}

const errorsMap: { [key: string]: AppErrorConfig } = errors.reduce(
  (p, c) => ({ ...p, [c.code]: c }),
  {}
);

export class ErrorThrower {
  translation: { [key: string]: { [key: string]: AppErrorConfig } } = {};

  constructor() {
    for (const locale of config.i18n.locales) {
      this.translation[locale] = {};
    }
  }

  init() {
    const errorCodes: string[] = errors.map((error) => error.code);

    for (const locale of config.i18n.locales) {
      const json: AppErrorConfig[] = JSON.parse(
        fs
          .readFileSync(
            path.join(__dirname, `./i18n/${locale}/errors-${locale}.json`)
          )
          .toString()
      );

      const map: { [key: string]: Partial<AppErrorConfig> } = json.reduce(
        (p, c) => ({ ...p, [c.code]: c }),
        {}
      );

      for (const errorCode of errorCodes) {
        if (map[errorCode]) {
          this.translation[locale][errorCode] = {
            ...errorsMap[errorCode],
            ...map[errorCode],
          };
        } else {
          throw new Error(
            `Error code ${errorCode} doesn't have a translation for the locale ${locale}`
          );
        }
      }
    }
  }

  formatErrorMessage(
    code: ErrorType,
    locale: AppLocale = config.i18n.defaultLocale,
    data?: Object
  ) {
    return format(this.translation[locale][code].template, data);
  }

  createError = (
    ctx: Context,
    code: ErrorType,
    data?: { [key: string]: unknown }
  ) => {
    const { templateProps } = errorsMap[code];

    if (templateProps.length && !data) {
      throw new AppError(
        "ErrorDataMissing",
        this.formatErrorMessage("ErrorDataMissing", ctx.traceInfo.locale)
      );
    }

    for (const prop of templateProps) {
      if (!data || !data[prop]) {
        throw new AppError(
          "ErrorDataMissing",
          this.formatErrorMessage("ErrorDataMissing", ctx.traceInfo.locale)
        );
      }
    }

    throw new AppError(
      code,
      this.formatErrorMessage(code, ctx.traceInfo.locale, data),
      data
    );
  };
}
