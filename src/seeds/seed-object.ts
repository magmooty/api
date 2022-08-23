import { sync } from "@/components";
import { ObjectType } from "@/graph/objects/types";
import yargs from "yargs/yargs";

async function main() {
  const argv: any = yargs(process.argv).argv;

  if (!argv.object) {
    return console.error("You need to define an object");
  }

  const objectType = argv.object as ObjectType;
  const after = argv.after || null;

  await sync.reseedObject(null, objectType, after);
}

main();
