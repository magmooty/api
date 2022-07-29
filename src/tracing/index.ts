

interface TraceInfo {
  name: string;
}

type RegisterFunction = (info: TraceInfo) => void;

interface Context {
  log: Logger;
  register: RegisterFunction;
}

/**
 * Obtain the parameters of a function type in a tuple
 */
type ExtractParametersWithoutFirstParam<T extends (...args: any[]) => any> =
  T extends (arg0: infer P0, ...args: infer P) => any ? P : never;

/**
 * Obtain the return type of a function type
 */
type ExtractReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

function wrapper<T extends (...args: any[]) => any>(
  func: T
): (
  ...funcArgs: ExtractParametersWithoutFirstParam<T>
) => ExtractReturnType<T> {
  let traceInfo: TraceInfo = null;

  const ctx: Context = {
    register: (info) => {
      traceInfo = info;
    },
  };

  return (...args: unknown[]) => {
    func(ctx, ...args);
  };
}

const rule = wrapper(async (ctx: Context, test: string) => {
  console.log("this is the rule");
  console.log({ ctx });
  console.log(test);
});

rule("test");
