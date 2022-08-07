import { wrapper, config } from "@/components";
import { AppLocale } from "@/graph/objects/types";
import { Context } from "@/tracing";
import format from "string-template";
import fs from "fs";
import path from "path";

export interface AppErrorConfig {
  readonly code: string;
  readonly template: string;
  readonly templateProps: readonly string[];
}

const errors = [
  {
    code: "ObjectDoesNotExist",
    templateProps: [],
  },
  {
    code: "ObjectTypeDoesNotExist",
    templateProps: [],
  },
  {
    code: "InvalidObjectId",
    templateProps: [],
  },
  {
    code: "ErrorDataMissing",
    templateProps: [],
  },
  {
    code: "ObjectCreationFailed",
    templateProps: [],
  },
  {
    code: "ObjectUpdateFailed",
    templateProps: [],
  },
  {
    code: "ObjectDeleteFailed",
    templateProps: [],
  },
  {
    code: "ObjectQueryFailed",
    templateProps: [],
  },
  {
    code: "AfterKeyIsInvalid",
    templateProps: [],
  },
] as const;

export type ErrorType = typeof errors[number]["code"];

export class AppError extends Error {
  data?: Object;

  constructor(code: ErrorType, message: string, data?: Object) {
    super(message);

    this.name = code;
    this.data = data;
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
