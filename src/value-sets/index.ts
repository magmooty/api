import fs from "fs";

export interface ValueSet {
  code: string;
}

export class ValueSets {
  init() {
    //TODO: Read all value sets and make sure a translation exists for each item
    const files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".json"));
  }

  getValueSet(name: string, locale: string) {
    //TODO: Return value set
  }
}
