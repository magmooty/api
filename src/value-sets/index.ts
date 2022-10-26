import config from "@/config";
import fs from "fs";
import path from "path";

export interface ValueSet {
  code: string;
  display: string;
  extra: Object;
}

export class ValueSets {
  private _translations: { [key: string]: { [key: string]: ValueSet[] } } = {};

  constructor() {
    for (const locale of config.i18n.locales) {
      if (!this._translations[locale]) {
        this._translations[locale] = {};
      }
    }

    const files = fs
      .readdirSync(path.join(__dirname, "sets"))
      .filter((file) => file.endsWith(".json"));

    for (const file of files) {
      const baseValueSetFile = fs
        .readFileSync(path.join(__dirname, `./sets/${file}`))
        .toString();

      const valueSetName = file.replace(".json", "");

      const baseValueSet = JSON.parse(baseValueSetFile) as ValueSet[];

      for (const locale of config.i18n.locales) {
        let localizedValueSetFile = "";

        try {
          localizedValueSetFile = fs
            .readFileSync(path.join(__dirname, `./i18n/${locale}/${file}`))
            .toString();
        } catch {
          console.error("Unable to find a localization for the value set", {
            locale,
            valueSetName,
          });
          process.exit();
        }

        const localizedValueSet = JSON.parse(
          localizedValueSetFile
        ) as ValueSet[];

        this._translations[locale][valueSetName] = [];

        for (const singleValue of baseValueSet) {
          const localizedSingleValue = localizedValueSet.find(
            (item) => item.code === singleValue.code
          );

          if (!localizedSingleValue) {
            console.error(
              "Unable to find a localization for a value in the value set",
              { singleValue, locale, valueSetName }
            );
            process.exit();
          }

          this._translations[locale][valueSetName].push({
            ...singleValue,
            ...localizedSingleValue,
          });
        }
      }
    }
  }

  getValueSet(
    name: string,
    locale: string = config.i18n.defaultLocale
  ): ValueSet[] {
    return this._translations[locale][name];
  }
}

export const valueSets = new ValueSets();
