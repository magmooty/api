//#region FEATURE FLAG OFF
// import { wrapper } from "@/components";
// import { Context } from "@/tracing";
// import { AuthDriver, LoginResult, SessionExtraAttirbutes } from ".";
//#endregion

export interface NativeAuthDriverConfig {
  sessionTTL: number;
}

//#region FEATURE FLAG OFF
// export class NativeAuthDriver implements AuthDriver {
//   login = wrapper(
//     { name: "login", file: __filename },
//     (
//       ctx: Context,
//       username: string,
//       password: string,
//       extraAttributes: SessionExtraAttirbutes
//     ): Promise<LoginResult> => {}
//   );
// }
//#endregion
