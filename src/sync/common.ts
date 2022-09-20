import { HumanName } from "@/graph/objects/types";

export function extractSearchableNameFromHumanNameArray(
  name: HumanName[]
): string {
  if (name) {
    return name
      .map((humanName) =>
        [
          humanName.first_name || "",
          humanName.middle_name || "",
          humanName.last_name || "",
        ]
          .filter((term) => term)
          .map((str) => str.trim())
          .join(" ")
      )
      .join(" ");
  }

  return "";
}
