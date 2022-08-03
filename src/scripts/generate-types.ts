import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ObjectConfig, ObjectField, objects } from "../graph";

const TYPES_FILE_PATH = path.join(__dirname, "../graph/objects/types.ts");
const VALUE_SET_DIR_PATH = path.join(__dirname, "../value-sets");

let typesFileContents = `
export type ObjectId = string;

export type ObjectType = ${Object.keys(objects)
  .map((objectType) => `"${objectType}"`)
  .join(" | ")}

export type ObjectFieldValue = string | number | boolean | Date | ObjectId;

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
  generator: (fileName: string, vs: { code: string }[]) => {
    const typeName = capitalize(fileName.replace(".json", ""), "-");

    return `export type ${typeName}VS = ${vs
      .map(({ code }) => `"${code}"`)
      .join(" | ")}`;
  },
  end: () => "\n",
};

// | "string"
//   | "number"
//   | "boolean"
//   | "date"
//   | "object-id"
//   | "struct"
//   | "value-set"
//   | "array:string"
//   | "array:number"
//   | "array:boolean"
//   | "array:date"
//   | "array:object-id"
//   | "array:struct"
//   | "array:value-set";

const object = {
  start: (objectType: string) => {
    const typeName = capitalize(objectType);

    return [
      `export interface ${typeName} {`,
      "id: ObjectId",
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
  } as {
    [key: string]: (fieldName: string, fieldConfig: ObjectField) => string;
  },
  end: () => "}\n",
};

let typesNotFound = false;

const valueSetFiles = fs.readdirSync(VALUE_SET_DIR_PATH);

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
      console.error("Couldn't find field generator for type", fieldConfig.type);
      typesNotFound = true;
    }
  }

  append(object.end());
}

if (typesNotFound) {
  process.exit();
}

console.log(`Generated types for ${Object.keys(objects).length} objects`);

fs.writeFileSync(TYPES_FILE_PATH, typesFileContents);

console.log("Applying prettier");

exec(`env npx prettier --write ${TYPES_FILE_PATH}`, (error, stdout, stderr) => {
  if (error) {
    console.error(stderr);
  } else {
    console.log(stdout.replace(/\n$/, ""));
  }
});
