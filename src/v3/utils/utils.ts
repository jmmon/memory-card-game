import { iNestedObj, iObj, iUserSettings } from "../types/types";

export const flattenObjectToEntries = (
  obj: iUserSettings,
  prefix: string = ""
) => {
  const initialEntries = Object.entries(obj);
  let result: [string, string][] = [];
  if (prefix && prefix !== "") {
    prefix = prefix + "_";
  }

  for (const [key, value] of initialEntries as [string, string][]) {
    const prefixedKey = prefix + key;

    if (typeof value === "object") {
      // recurse if value is object
      const nested = result.concat(flattenObjectToEntries(value, prefixedKey));
      result = nested;
    } else {
      result.push([prefixedKey, value]);
    }
  }
  return result.sort(([k1], [k2]) => k1.localeCompare(k2));
};

export const unflattenObject = (obj: iObj) => {
  const unflattened: iNestedObj = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.includes("_")) {
      // value is an object, recurse
      const split = key.split("_");
      const parentKey = split[0];
      const remainingUnderscoreKeys = split.slice(1).join("_");

      if (unflattened[parentKey] === undefined) {
        // do not have a value for firstKey, need to set up an object for it
        unflattened[parentKey] = { [remainingUnderscoreKeys]: value };
      } else {
        // already have a value for firstKey
        const unflattenedValue = unflattenObject({
          [remainingUnderscoreKeys]: value,
        });
        unflattened[parentKey] = {
          ...(unflattened[parentKey] as object),
          ...unflattenedValue,
        };
      }
    } else {
      // non-object values
      unflattened[key] = value;
    }
  }
  return unflattened;
};
