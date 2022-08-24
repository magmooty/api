import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ObjectConfig, ObjectField, objects } from "../graph";
import * as tsj from "ts-json-schema-generator";

const log = console;

const CONFIG_JSON_SCHEMA_FILE_PATH = path.join(
  __dirname,
  "../config/schema.json"
);
const TSCONFIG_FILE_PATH = path.join(__dirname, "../../tsconfig.json");
const CONFIG_TYPES_FILE_PATH = path.join(__dirname, "../config/types.ts");
const TYPES_FILE_PATH = path.join(__dirname, "../graph/objects/types.ts");
const VALUE_SET_DIR_PATH = path.join(__dirname, "../value-sets/sets");

//#region Generate JSON config schema

function generateSchema() {
  const config = {
    path: CONFIG_TYPES_FILE_PATH,
    tsconfig: TSCONFIG_FILE_PATH,
    type: "*", // Or <type-name> if you want to generate schema for that one type only
  };

  const schema = tsj.createGenerator(config).createSchema(config.type);

  const schemaString = JSON.stringify(schema, null, 2);
  fs.writeFileSync(CONFIG_JSON_SCHEMA_FILE_PATH, schemaString);
}

generateSchema();

//#endregion

//#region Generate types from object graph

let typesFileContents = `
export type ObjectId = string;

export type ObjectType = ${Object.keys(objects)
  .map((objectType) => `"${objectType}"`)
  .join(" | ")}

export type ObjectFieldValue = string | string[] | number | number[] | boolean | Date | ObjectId | GraphObject;

export type AppLocale = 'ar' | 'en';

export interface IEdge {
  src: string;
  edgeName: string;
  dst: string;
}

export interface GraphObject {
  id: ObjectId;
  object_type: ObjectType;
  [key: string]: ObjectFieldValue;
}

`;

const capitalize = (text: string, splitter?: string) => {
  const words = splitter ? text.split(splitter) : [text];

  return words
    .map((word) => `${word[0].toUpperCase()}${word.substring(1)}`)
    .join("");
};

const append = (text: string) => {
  typesFileContents += text;
  newLine();
};

const newLine = () => {
  typesFileContents += "\n";
};

const valueSet = {
  generator: (valueSetFileName: string, vs: { code: string }[]) => {
    const typeName = capitalize(valueSetFileName.replace(".json", ""), "-");

    return `export type ${typeName}VS = ${vs
      .map(({ code }) => `"${code}"`)
      .join(" | ")}`;
  },
  genericType: (types: string[]): string => {
    return `export type ValueSet = ${types
      .map((type) => `"${type}"`)
      .join(" | ")}\n`;
  },
  end: () => "\n",
};

const object = {
  start: (objectType: string) => {
    const typeName = capitalize(objectType, "-");

    return [
      `export interface ${typeName} extends GraphObject {`,
      `object_type: "${objectType}"`,
    ].join("\n");
  },
  fields: {
    string: (fieldName: string) => {
      return `${fieldName}: string;`;
    },
    number: (fieldName: string) => {
      return `${fieldName}: number;`;
    },
    boolean: (fieldName: string) => {
      return `${fieldName}: boolean;`;
    },
    date: (fieldName: string) => {
      return `${fieldName}: string;`;
    },
    "object-id": (fieldName: string) => {
      return `${fieldName}: string | GraphObject;`;
    },
    struct: (fieldName: string, fieldConfig: ObjectField) => {
      return `${fieldName}: I${capitalize(fieldConfig.struct as string)}`;
    },
    "value-set": (fieldName: string, fieldConfig: ObjectField) => {
      return `${fieldName}: ${capitalize(
        fieldConfig.valueSet as string,
        "-"
      )}VS;`;
    },
    "array:string": (fieldName) => {
      return `${fieldName}: string[];`;
    },
    "array:number": (fieldName) => {
      return `${fieldName}: number[];`;
    },
    "array:boolean": (fieldName: string) => {
      return `${fieldName}: boolean[];`;
    },
    "array:date": (fieldName: string) => {
      return `${fieldName}: string[];`;
    },
  } as {
    [key: string]: (fieldName: string, fieldConfig: ObjectField) => string;
  },
  end: () => "}\n",
};

let typesNotFound = false;

const valueSetFiles = fs
  .readdirSync(VALUE_SET_DIR_PATH)
  .filter((file) => file.endsWith(".json"));

const valueSetTypes = valueSetFiles.map((valueSetFileName) =>
  capitalize(valueSetFileName.replace(".json", ""), "-")
);

append(valueSet.genericType(valueSetTypes));

for (const valueSetFileName of valueSetFiles) {
  const json = JSON.parse(
    fs.readFileSync(path.join(VALUE_SET_DIR_PATH, valueSetFileName)).toString()
  );

  append(valueSet.generator(valueSetFileName, json));
  append(valueSet.end());
}

for (const objectType in objects) {
  const objectConfig: ObjectConfig = (
    objects as { [key: string]: ObjectConfig }
  )[objectType as string];

  append(object.start(objectType));

  for (const objectField in objectConfig.fields) {
    const fieldConfig = objectConfig.fields[objectField];

    if (object.fields[fieldConfig.type]) {
      append(object.fields[fieldConfig.type](objectField, fieldConfig));
    } else {
      log.error("Couldn't find field generator for type", fieldConfig.type);
      typesNotFound = true;
    }
  }

  append(object.end());
}

if (typesNotFound) {
  process.exit();
}

log.info(`Generated types for ${Object.keys(objects).length} objects`);

fs.writeFileSync(TYPES_FILE_PATH, typesFileContents);

log.info("Applying prettier");

exec(`env npx prettier --write ${TYPES_FILE_PATH}`, (error, stdout, stderr) => {
  if (error) {
    log.error(stderr);
  } else {
    log.info(stdout.replace(/\n$/, ""));
  }
});

//#endregion
